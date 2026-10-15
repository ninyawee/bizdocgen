import type { GristRecord, Settlement } from '../types/document-schema'
import type {
  DocumentViewModel,
  DisplayItem,
  TaxInfo,
  PaymentInfo,
  BankInfo,
  ReferenceInfo,
  SettlementView,
} from '../types/view-model'
import { calculateSubtotal, getDueDate, sortItems, splitItemText } from './document'
import { getTaxInfo } from './tax'

const viewModelCache = new WeakMap<GristRecord, DocumentViewModel>()

/** A markdown list in the item detail forces the table rendering. */
const LIST_PATTERN = /^\s*(?:[-*+]|\d+\.)\s+/m

/**
 * ① Build the destination line of the arithmetic block. PromptPay and a bank
 * transfer are different channels that settle into the same account, so the
 * label names the channel actually used and the caption names where it landed.
 */
function describeDestination(s: Settlement): { intoLabel: string; intoCaption: string | null } {
  const account = [s.Bank, s.Account_Number].filter(Boolean).join(' ')

  if (s.PromptPay) {
    return {
      intoLabel: `รับผ่านพร้อมเพย์ ${s.PromptPay}`,
      intoCaption: account ? `เข้าบัญชี ${account}` : null,
    }
  }
  if (s.Bank) {
    return {
      intoLabel: `โอนเข้าบัญชี ${s.Bank}`,
      intoCaption: s.Account_Number ?? null,
    }
  }
  return { intoLabel: 'รับเป็นเงินสด', intoCaption: null }
}

function buildSettlement(s: Settlement): SettlementView {
  const { intoLabel, intoCaption } = describeDestination(s)
  return {
    paidDate: s.Paid_Date,
    channel: s.Channel ?? null,
    gross: s.Gross,
    wht: s.WHT,
    net: s.Net_Transfer,
    bank: s.Bank ?? null,
    accountNumber: s.Account_Number ?? null,
    accountHolder: s.Account_Holder ?? null,
    promptPayId: s.PromptPay ?? null,
    intoLabel,
    intoCaption,
    // Compared in satang to keep floating-point noise out of the tick.
    reconciles: Math.round((s.Net_Transfer + s.WHT) * 100) === Math.round(s.Gross * 100),
  }
}

export function getViewModel(record: GristRecord): DocumentViewModel {
  // Check cache first
  if (viewModelCache.has(record)) {
    return viewModelCache.get(record)!
  }

  // Transform items to display format, splitting the two-level text
  const sortedItems = sortItems(record.Record.Items)
  const items: DisplayItem[] = sortedItems.map((item) => {
    const { name, detail } = splitItemText(item.Description)
    return {
      id: item.id.toString(),
      description: item.Description,
      name,
      detail,
      hasBullets: LIST_PATTERN.test(detail),
      quantity: item.Quantity,
      unitPrice: item.Unit_Price,
      total: item.Total,
      sortOrder: item.Manual_Sort ?? 0,
    }
  })

  // Calculate financial totals
  const subtotal = calculateSubtotal(record.Record.Items)
  const gristTaxInfo = getTaxInfo(record.Record.Tax, subtotal)

  const tax: TaxInfo = {
    label: gristTaxInfo.label,
    amount: gristTaxInfo.amount,
    percentage: gristTaxInfo.percentage,
  }

  const total = subtotal + tax.amount

  // Transform payment info
  const paymentMethod = record.Record.Payment_Method
  const bankDetails: BankInfo | null = paymentMethod
    ? {
        accountHolder: paymentMethod.Account_Holder ?? null,
        accountNumber: paymentMethod.Account_Number ?? null,
        bank: paymentMethod.Bank ?? null,
        branch: paymentMethod.Branch ?? null,
      }
    : null

  const paymentInfo: PaymentInfo = {
    promptPayId: paymentMethod?.PromptPay ?? null,
    bankDetails,
  }

  // Transform reference info
  const reference: ReferenceInfo = {
    number: record.Record.Reference?.Number ?? null,
  }

  // Get credit term
  const creditTerm = record.Record.Credit_Term ?? null

  // Get remarks
  const remarks = record.Record.Remarks ?? null

  const settlement = record.Record.Settlement ? buildSettlement(record.Record.Settlement) : null

  // Create view model
  const viewModel: DocumentViewModel = {
    items,
    subtotal,
    tax,
    total,
    paymentInfo,
    reference,
    creditTerm,
    remarks,
    dueDate: getDueDate(record.Record.Date, creditTerm),
    attention: record.Record.Attention ?? null,
    showContactBack: record.Record.Show_Contact_Back ?? false,
    settlement,
    renderAsStatement: items.length === 1 && !items[0]!.hasBullets,
  }

  // Cache and return
  viewModelCache.set(record, viewModel)
  return viewModel
}
