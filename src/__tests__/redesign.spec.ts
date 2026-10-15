import { describe, expect, it } from 'vite-plus/test'
import type { GristRecord, Item } from '../types/document-schema'
import { getDueDate, parseCreditTermDays, splitItemText } from '../utils/document'
import { getCopyLabel } from '../utils/copy-state'
import { getViewModel } from '../utils/view-model'

function record(over: Partial<GristRecord['Record']> = {}): GristRecord {
  return {
    id: 1,
    Record: {
      Client: { Address: '199 ถนนมหาพฤฒาราม', Name: 'บริษัท ทดสอบ จำกัด', Tax_ID: '0105561234567' },
      Credit_Term: null,
      Date: '2026-07-30T00:00:00.000Z',
      Document_Type: ['Invoice'],
      Items: [item()],
      Number: 'IV-20260700001',
      Payment_Method: null,
      Provider: {
        Address: '',
        Email: null,
        Name: 'ณัฐชนน นินยวี',
        Personnel_Name: null,
        Tax_ID: '1419900489238',
      },
      Reference: null,
      Remarks: null,
      Tax: -0.03,
      ...over,
    },
  } as GristRecord
}

function item(over: Partial<Item> = {}): Item {
  return {
    Description: 'ค่าแรงทำงานหัวหน้าวิศวกร',
    Manual_Sort: 1,
    Quantity: 119,
    Total: 204680,
    Unit_Price: 1720,
    id: 1,
    ...over,
  }
}

describe('② due date', () => {
  it('reads the day count out of a Thai credit term', () => {
    expect(parseCreditTermDays('7 วัน')).toBe(7)
    expect(parseCreditTermDays('30 days')).toBe(30)
    expect(parseCreditTermDays('15')).toBe(15)
  })

  it('collapses when there is no term', () => {
    expect(parseCreditTermDays(null)).toBeNull()
    expect(parseCreditTermDays('')).toBeNull()
    expect(parseCreditTermDays('ไม่มีเครดิต')).toBeNull()
    expect(getViewModel(record()).dueDate).toBeNull()
  })

  it('derives the date rather than storing it', () => {
    // 30/07/2026 + 7 วัน = 06/08/2026, the figure on the PEAK original
    expect(getDueDate('2026-07-30T00:00:00.000Z', '7 วัน')).toBe('2026-08-06T00:00:00.000Z')
    expect(getViewModel(record({ Credit_Term: '7 วัน' })).dueDate).toBe('2026-08-06T00:00:00.000Z')
  })
})

describe('two-level item text', () => {
  it('splits the first line off as the name', () => {
    expect(splitItemText('ชื่อรายการ\nคำอธิบาย')).toEqual({
      name: 'ชื่อรายการ',
      detail: 'คำอธิบาย',
    })
  })

  it('leaves a single-line description as a bare name', () => {
    expect(splitItemText('ชื่อรายการ')).toEqual({ name: 'ชื่อรายการ', detail: '' })
  })
})

describe('statement vs table', () => {
  it('renders one plain item as a statement — the 19-of-22 case', () => {
    expect(getViewModel(record()).renderAsStatement).toBe(true)
  })

  it('returns to the table as soon as a second item exists', () => {
    const vm = getViewModel(record({ Items: [item(), item({ id: 2, Manual_Sort: 2 })] }))
    expect(vm.renderAsStatement).toBe(false)
  })

  it('returns to the table when the single item carries bullets', () => {
    const vm = getViewModel(
      record({ Items: [item({ Description: 'ชื่อรายการ\n- ข้อหนึ่ง\n- ข้อสอง' })] }),
    )
    expect(vm.items[0]!.hasBullets).toBe(true)
    expect(vm.renderAsStatement).toBe(false)
  })
})

describe('① settlement', () => {
  const settled = (over = {}) =>
    getViewModel(
      record({
        Document_Type: ['Receipt'],
        Settlement: {
          Gross: 204680,
          Net_Transfer: 198539.6,
          WHT: 6140.4,
          Paid_Date: '2026-07-31T00:00:00.000Z',
          Channel: 'โอนผ่านธนาคาร',
          Bank: 'ธนาคารกสิกรไทย',
          Account_Number: '2198640134',
          ...over,
        },
      }),
    ).settlement!

  it('confirms the arithmetic reconciles, in satang', () => {
    // 198,539.60 + 6,140.40 = 204,680.00 — floating point must not break the tick
    expect(settled().reconciles).toBe(true)
  })

  it('reports a mismatch rather than hiding it', () => {
    expect(settled({ WHT: 6000 }).reconciles).toBe(false)
  })

  it('names the channel actually used, not just the destination account', () => {
    expect(settled().intoLabel).toBe('โอนเข้าบัญชี ธนาคารกสิกรไทย')
    expect(settled({ PromptPay: '0992866936' }).intoLabel).toBe('รับผ่านพร้อมเพย์ 0992866936')
    expect(settled({ Bank: null, Account_Number: null }).intoLabel).toBe('รับเป็นเงินสด')
  })

  it('is absent on a document that was never settled', () => {
    expect(getViewModel(record()).settlement).toBeNull()
  })
})

describe('④ copy marker', () => {
  it('defaults to ต้นฉบับ and has no data behind it', () => {
    expect(getCopyLabel('')).toBe('ต้นฉบับ')
    expect(getCopyLabel('?other=1')).toBe('ต้นฉบับ')
  })

  it('switches to สำเนา on the URL param', () => {
    expect(getCopyLabel('?copy')).toBe('สำเนา')
    expect(getCopyLabel('?copy=1')).toBe('สำเนา')
  })
})
