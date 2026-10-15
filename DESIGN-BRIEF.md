# Design brief — ใบแจ้งหนี้ / ใบเสร็จรับเงิน redesign

**For:** designer picking up the document templates
**Owner:** Ben (Nutchanon Ninyawee)
**Repo:** `ninyawee/bizdocgen`, branch `peak-fork` — fork of [dtinth/bizdocgen](https://github.com/dtinth/bizdocgen)
**Live:** https://bizdoc.saa-coop.org (renders inside Grist, and standalone via share links)

## 1. Context in one paragraph

Ben freelances as a lead engineer and used to bill through **PEAK**, a Thai accounting SaaS.
His books have been migrated out of PEAK into a self-hosted **Grist** doc, and these
templates now generate the documents PEAK used to. PEAK's output is functional but
generic — the redesign is to make these documents look like they come from a person,
not from accounting software, while staying credible to a Thai accountant.

21 real documents have already been issued this way (plus one cancelled invoice, 22
rows in total). The design must fit them, not the other way round.

## 2. Scope

**In scope — two documents:**

| Document | Thai | Issued |
|---|---|---|
| Invoice | ใบแจ้งหนี้ | 11 live |
| Receipt | ใบเสร็จรับเงิน | 10 live |

**Out of scope:** the Quotation (ใบเสนอราคา) template. It exists in the codebase and
is inherited from upstream, but Ben doesn't issue quotations. Don't spend time on it —
just don't actively break it.

Also out of scope: the Grist data model, the share-link mechanism, the print pipeline.
Those work. This is a document-design job.

## 3. See the current state first

Three things worth looking at, in this order:

1. **The PEAK originals** — 21 PDFs at `~/ddd/ninyawee/peak/pdfs/` (`IV-*.pdf`, `RE-*.pdf`).
   This is the "before", and the format Ben's accountant and clients already accept.
2. **The current widget**, with sample data, no Grist account needed:
   ```sh
   pnpm install && pnpm dev
   ```
   Then use the scenario picker in the toolbar, or `?scenario=<slug>`:
   `invoice-wht-excel-rescue`, `receipt-vat-k8s-bug-hunt`, `receipt-home-wifi-promptpay`,
   `signed-demo` (full list in `src/utils/scenarios.ts`).
3. **A real document** — ask Ben for a share link (`เพิ่มเติม ▸ 🔗 คัดลอกลิงก์เอกสาร`).
   Opens standalone, no login.

> The PEAK PDFs and share links contain real client names, addresses and tax IDs.
> If you'd rather not circulate those, the `?scenario=` samples are built for exactly
> this and cover the same layout cases.

## 4. Hard constraints

Non-negotiable, because they're what makes the document a document:

- **A4, print-first.** 210 × 297 mm, `@page { margin: 0 }`, content inset 20 mm on
  three sides. Screen is a scaled preview of print, never its own layout.
- **Renders in three contexts** from the same markup:
  1. inside a **Grist iframe** — often only ~400–600 px wide, scaled via `zoom`
  2. **standalone share link** — full viewport, opened by clients on phones
  3. **headless print-to-PDF** — Playwright, this is what becomes the real file
- **Thai typography.** Body is [Sarabun](https://fontsource.org/fonts/sarabun),
  self-hosted via `@fontsource` — no network fonts, the page must render offline
  (share links are self-contained). Thai stacks tall diacritics: `line-height` below
  ~1.3em starts clipping. Current base is 1.4em.
- **Type scale is in `pt`, spacing in `mm`** (`src/styles/variables.css`). Keep it —
  px in a print document drifts between renderers.
- **Amounts:** right-aligned, thousands-separated, exactly 2 decimals. The grand total
  also appears as Thai baht text (`สองแสนสี่พันหกร้อยแปดสิบบาทถ้วน`) — generated, not typed.
- **Always white background, always black-ish text.** No dark mode. Colour is
  available but should survive a monochrome laser printer.

## 5. Document anatomy

### What's there today

Both documents share one component stack (`src/components/PrintableDocument.vue`):

```
DocumentHeader   provider name / personnel / address / email / tax ID
                 │ doc type, เลขที่, วันที่, อ้างอิง, เครดิต
ClientInfo       ลูกค้า — name, address, tax ID
ItemsTable       ลำดับ · รายการ · จำนวน · ราคาต่อหน่วย · จำนวนเงิน
TaxSummary       ยอดรวม · ภาษีหัก ณ ที่จ่าย 3% · จำนวนเงินสุทธิ (+ baht text)
RemarksSection   หมายเหตุ (markdown)
PaymentInfo   ┐  ธนาคาร / สาขา / เลขที่บัญชี / ชื่อบัญชี / PromptPay
QRCodeSection ┘  scannable PromptPay QR — side by side, grid 1fr auto
SignatureArea    ลงชื่อ (single, right-aligned) for IV and RE
```

### What to add — the five picked features

Ben reviewed PEAK's feature set against ours and picked these. Exact Thai labels
below are PEAK's; match them unless you have a reason.

---

**① Receipt payment-settlement block — `RECEIPT ONLY`**

The single most important addition, and the only thing that should make a receipt
*structurally* different from an invoice rather than just differently titled.

PEAK prints, under `ชำระเงิน`:

```
วันที่ชำระ :      31/07/2026        ธ.กสิกรไทย                    198,539.60 บาท
                                    ออมทรัพย์ 2198640134
จำนวนเงินรวม :  204,680.00 บาท     นาย ณัฐชนน นินยวี
                                    ภาษีหัก ณ ที่จ่าย                6,140.40 บาท
```

Read it as: gross ฿204,680.00 was settled as ฿198,539.60 into the bank **plus**
฿6,140.40 withheld at source. The two right-hand figures sum to the gross — that
reconciliation is the whole point of the block, and the design should make it
legible as arithmetic.

Edge case: **2 of 10 receipts were settled in cash** (`Channel = เงินสด`,
RE-20260400001/002). No bank, no account number. The block must degrade, and the
PromptPay QR should almost certainly be suppressed on a paid receipt anyway —
see §6.

---

**② Due date — `วันที่ครบกำหนด`** · `INVOICE`

We show `เครดิต: 7 วัน` but never the date it lands on. PEAK shows both:

```
เครดิต :          7 วัน
วันที่ครบกำหนด :  06/08/2026
```

Belongs in the header's right-hand meta column, adjacent to the credit term.
Worth considering as the most prominent date on an invoice — it's the one the
client acts on.

---

**④ Original / copy marker — `(ต้นฉบับ)` / `(สำเนา)`**

PEAK prints `(ต้นฉบับ)` top-right, above everything. Small, muted, unmissable.
Needs a visual treatment for both states. Presentation only — no data behind it,
so you're also designing how it gets toggled at print time.

---

**⑦ Seller phone**

`0992866936`. Currently nowhere on the document. PEAK puts it inline next to the
seller name in the header.

---

**⑧–⑨ Attention line + contact-back block**

Two related header additions:

```
เรียน :           <contact person at the client>

ติดต่อกลับที่ :   Nutchanon Ninyawee
                  0992866936
                  life.particles@gmail.com
```

`เรียน` addresses a person at the client company. `ติดต่อกลับที่` is the reply-to
block — who at Ben's end to call about this document. Both are blank on every
existing PEAK document, so **you are designing their first appearance**; there's
no legacy to match. They also need to collapse gracefully when empty, which will
be the common case at first.

---

### Explicitly *not* adopted

So you don't reintroduce them from the PEAK reference: per-line discount column,
per-line VAT column, VAT-category subtotals, `(สำนักงานใหญ่)` head-office tags,
customer code (`V00001`), product code (`P00002`), PEAK's 6-slot signature/stamp
grid, and PEAK's document-link QR.

Most are VAT machinery — **Ben is not VAT-registered**, every line reads
`VAT: ไม่มี` and every summary reads `มูลค่าไม่มีหรือยกเว้นภาษี`. Designing VAT
columns that always render empty is the main trap in the PEAK reference.

### One deliberate divergence from PEAK

PEAK's invoice states the **gross** (฿204,680.00) and shows WHT only on the receipt.
Ours nets the 3% on the invoice itself — `ภาษีหัก ณ ที่จ่าย 3%  −6,140.40`,
`จำนวนเงินสุทธิ ฿198,539.60` — and the PromptPay QR encodes that net figure, so the
client scans and pays exactly what's owed. Both conventions are used in Thailand;
this one is deliberate. Keep it.

## 6. Content that must not break

Real ranges measured from the 22 rows in Grist, plus the sample scenarios:

- **Line items: almost always exactly one.** Of the 22 issued documents, 19 have a
  single line item and 2 have two. This is the defining layout problem: a full-width
  items table holding one row, on a page sized for many. PEAK leaves the gap as dead
  space. The sample scenarios run considerably longer, so the table still has to
  handle a real list — but design for one row first, because that's the real case.
- **Markdown in descriptions.** Line items and หมายเหตุ render markdown: bold, and
  **bullet lists inside a table cell**. Currently unstyled and the weakest part of the
  layout. See `receipt-vat-k8s-bug-hunt`.
- **Two-level item text** — PEAK renders a bold item name with a description beneath.
  Ours flattens it. Worth deciding.
- **Long Thai strings wrap unpredictably.** Client names run to
  `บริษัท ฟิต ฟอร์ ออล จำกัด`; addresses are multi-line with embedded newlines
  (rendered via `trimAddress`). Thai has no spaces — a long unbroken run will not
  wrap where you expect.
- **Amounts up to 6 figures** — largest issued is ฿254,130.00. Design the column to
  hold ฿9,999,999.99 without reflowing.
- **Optional blocks that vanish:** payment method, PromptPay QR, remarks, reference,
  credit term, signature image. Every one can be absent. A layout that only looks
  right when everything is present will look wrong most of the time.
- **Multi-page is currently undefined.** No issued document has overflowed A4, so
  nothing repeats a header and there are no page numbers. If your design implies
  a page 2, specify it — this is an open question, not a solved one.

## 7. Deliverable

Implementation is Vue single-file components with scoped CSS, driven by CSS custom
properties. Either of these works:

- **Annotated A4 layouts at 1:1** (Figma, 210 × 297 mm artboards) — one per document,
  plus the empty/degraded states from §6. Call out type sizes in `pt` and spacing in `mm`
  so they map onto `variables.css` directly.
- **Or go straight to CSS.** There's a live custom-CSS hook — the settings panel
  injects into `#grist-custom-css` and persists per widget, so you can iterate against
  a real document in the browser and hand back the stylesheet. Faster if you're
  comfortable in CSS; ask Ben to open the panel for you.

Either way, please deliver **both documents together** — the invoice/receipt
relationship is the substance of ① and shouldn't be designed in two passes.

## 8. Appendix — data plumbing (engineer, not designer)

Five picked features, three of which need data that doesn't reach the widget yet.
The widget renders `Documents.Record`, an `Any` formula column serialized by
`src/types/document-schema-formula.py` and validated by `GristRecordSchema`
(`src/types/document-schema.ts`). Anything new must be added in **both**.

| # | Data needed | Status |
|---|---|---|
| ① | `PaidDate`, `Gross`, `WHT`, `NetTransfer`, `Channel` | **Exists in Grist — wrong table.** All five are on `Receipts`, but the widget reads `Documents`. Needs a `Documents → Receipts` reference (or the columns lifted across), then serialized into `Record`. |
| ② | due date | **Derivable, no new column.** `Documents.Date` + `Credit_Term` (a Choice, e.g. `"7 วัน"`). Compute in the view model — `Invoices.DueDate` exists but is ledger-side, and duplicating it invites drift. |
| ④ | original/copy | **No data.** Presentation state — URL param or print-time toggle. |
| ⑦ | seller phone | **New column** `Providers.Phone` → `serialize_provider` → `ProviderSchema`. Value `0992866936`. |
| ⑧ | attention | **New column** `Documents.Attention` (Text). Per-document, matching PEAK. |
| ⑨ | contact-back | **Reuses ⑦.** `Personnel_Name` and `Email` already serialize; only phone is missing. |

Grist doc: **PEAK Personal Books**, `vbeQK1RgxppuR1ddy1Ee94`, `Finance` workspace on
grist.saa-coop.org. Note `Documents.Number` is a trigger formula (new records only) —
see `FORK.md` before touching it.
