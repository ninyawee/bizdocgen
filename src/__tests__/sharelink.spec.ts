import { describe, expect, it } from 'vite-plus/test'
import { decodeShareLink, encodeShareLink, hasShareLink } from '../utils/sharelink'

const sample = {
  id: 5,
  Record: {
    Client: { Address: '199 ถนนมหาพฤฒาราม', Name: 'บริษัท วัน ไดเมนชั่น จำกัด', Tax_ID: '' },
    Credit_Term: '7 วัน',
    Date: '2026-07-30',
    Document_Type: ['Invoice'],
    Items: [
      {
        Description: 'ค่าแรงทำงานหัวหน้าวิศวกร',
        Manual_Sort: 1,
        Quantity: 119,
        Total: 204680,
        Unit_Price: 1720,
        id: 1,
      },
    ],
    Number: 'IV-20260700001',
    Payment_Method: null,
    Provider: { Address: '', Email: null, Name: 'ณัฐชนน นินยวี', Personnel_Name: null, Tax_ID: '' },
    Reference: null,
    Remarks: null,
    Tax: -0.03,
  },
}

describe('sharelink', () => {
  it('round-trips a document through the URL fragment', async () => {
    const url = await encodeShareLink(sample, 'https://bizdoc.saa-coop.org/')
    const hash = url.slice(url.indexOf('#'))
    expect(hasShareLink(hash)).toBe(true)
    await expect(decodeShareLink(hash)).resolves.toEqual(sample)
  })

  it('preserves Thai text and negative WHT exactly', async () => {
    const url = await encodeShareLink(sample, 'https://x/')
    const back = (await decodeShareLink(url.slice(url.indexOf('#')))) as typeof sample
    expect(back.Record.Number).toBe('IV-20260700001')
    expect(back.Record.Tax).toBe(-0.03)
    expect(back.Record.Items[0]!.Description).toBe('ค่าแรงทำงานหัวหน้าวิศวกร')
    expect(back.Record.Client.Name).toBe('บริษัท วัน ไดเมนชั่น จำกัด')
  })

  // jsdom has no working CompressionStream, so the encoder falls back to the
  // plain 'p' flag there. Browsers take the compressed 'z' path. Both must
  // decode, and the flag must match what the environment actually supports.
  it('tags the payload with the codec it used', async () => {
    const url = await encodeShareLink(sample, 'https://x/')
    const body = url.slice(url.indexOf('#d=') + 3)
    expect(['z', 'p']).toContain(body[0])
    // Where the environment does compress, the payload must actually be smaller.
    const compressed = body[0] === 'z'
    expect(!compressed || body.length < JSON.stringify(sample).length).toBe(true)
    await expect(decodeShareLink(url.slice(url.indexOf('#')))).resolves.toEqual(sample)
  })

  it('ignores fragments that carry no payload', async () => {
    expect(hasShareLink('#')).toBe(false)
    expect(hasShareLink('#something-else')).toBe(false)
    await expect(decodeShareLink('#something-else')).resolves.toBeNull()
  })

  it('rejects a corrupted payload', async () => {
    await expect(decodeShareLink('#d=qNOTVALID')).rejects.toThrow(Error)
  })
})
