export interface DisplayItem {
  id: string
  /** Raw Description, unsplit — kept for back-compat with existing consumers. */
  description: string
  /** Two-level text: first line of Description. */
  name: string
  /** Two-level text: everything after the first line, markdown. */
  detail: string
  /** True when `detail` carries a markdown list — this forces the table. */
  hasBullets: boolean
  quantity: number
  unitPrice: number
  total: number
  sortOrder: number
}

export interface TaxInfo {
  label: string | null
  amount: number
  percentage: number
}

export interface BankInfo {
  accountHolder: string | null
  accountNumber: string | null
  bank: string | null
  branch: string | null
}

export interface PaymentInfo {
  promptPayId: string | null
  bankDetails: BankInfo | null
}

export interface ReferenceInfo {
  number: string | null
}

/** ① The receipt settlement block, with its presentation labels derived. */
export interface SettlementView {
  paidDate: string
  channel: string | null
  gross: number
  wht: number
  net: number
  bank: string | null
  accountNumber: string | null
  accountHolder: string | null
  promptPayId: string | null
  /** The destination line in the arithmetic block. */
  intoLabel: string
  /** Sub-caption under the destination line. */
  intoCaption: string | null
  /** net + wht === gross, to the satang. False must be visible on the page. */
  reconciles: boolean
}

export interface DocumentViewModel {
  items: DisplayItem[]
  subtotal: number
  tax: TaxInfo
  total: number
  paymentInfo: PaymentInfo
  reference: ReferenceInfo
  creditTerm: string | null
  remarks: string | null

  /** ② Derived from Date + Credit_Term; null collapses the block. */
  dueDate: string | null
  /** ⑧ เรียน */
  attention: string | null
  /** ⑨ ติดต่อกลับที่ */
  showContactBack: boolean
  /** ① receipts only */
  settlement: SettlementView | null
  /** 19-of-22 case: one item, no bullets → statement instead of a table. */
  renderAsStatement: boolean
}
