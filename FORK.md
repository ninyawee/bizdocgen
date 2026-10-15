# Fork notes — ninyawee/bizdocgen

Fork of [dtinth/bizdocgen](https://github.com/dtinth/bizdocgen), self-hosted at
**https://bizdoc.saa-coop.org** and used by the Grist doc **PEAK Personal Books**
(`Finance` workspace on grist.saa-coop.org).

Kept as a fork rather than a copy so upstream fixes can still be merged:

```sh
git fetch upstream && git merge upstream/main
```

## What this fork changes

### 1. Self-contained shareable document links

Upstream can only render inside the Grist iframe; there is no way to send a
document to a client as a link. This fork adds one.

`เพิ่มเติม ▸ 🔗 คัดลอกลิงก์เอกสาร` encodes the whole document into the URL
**fragment** (`#d=z<base64url>`, deflate-raw compressed):

- Opens for anyone — no login, no Grist account, no backend, nothing stored.
- The fragment is never sent to the server, so the document body stays off
  our logs and off Cloudflare's.
- A typical invoice is ~1.2 kB of JSON → ~640 B compressed → ~880-char URL.
- Opened this way the page renders **only** the document and a print button;
  the action menu and the CSS settings panel are hidden.

Trade-offs, deliberately accepted: the link is long, anyone holding it can view
the document, and it **cannot be revoked** because nothing is stored server-side.
Treat a share link like the PDF itself.

Code: `src/utils/sharelink.ts`, wired up in `src/composables/useAppState.ts`.

### 2. Redesigned ใบแจ้งหนี้ / ใบเสร็จรับเงิน

Implemented from the "Invoice & Receipt redesign" design canvas. The document now
owns its own token layer (`src/styles/document.css`, all `--bd-*`) — `variables.css`
is left to the app chrome, which is screen-only and must not inherit print geometry.

Six features were picked out of a PEAK feature comparison and built:

| | Feature | Notes |
|---|---|---|
| ① | Receipt settlement block | The arithmetic: gross = net + WHT, with a computed ตรงกัน tick |
| ② | `วันที่ครบกำหนด` | Derived from `Date + Credit_Term`; never stored |
| ④ | `(ต้นฉบับ)` / `(สำเนา)` | Presentation only — `?copy=1`, no schema field |
| ⑦ | Seller phone | `Providers.Phone` |
| ⑧ | `เรียน` | `Documents.Attention` |
| ⑨ | `ติดต่อกลับที่` | Reuses ⑦; toggled by `Documents.Show_Contact_Back` |

Two structural changes matter more than the field list:

- **One line item renders as a statement, not a table.** 19 of 22 issued documents
  have exactly one item, and five column headings over a single row is the thing
  that made these look like accounting software. The table returns at n ≥ 2, or
  when the single item carries a markdown list.
- **Item text is two-level.** The first line of `Description` is the item name;
  everything after it is the description.

Payment details and the PromptPay QR are suppressed on receipts **by document
type**, not by data absence — a receipt row may still carry a `Payment_Method`
reference, but there is nothing left to pay.

Deliberately not adopted from PEAK: per-line VAT and discount columns, VAT-category
subtotals, `(สำนักงานใหญ่)` tags, customer/product codes, PEAK's six-slot stamp grid,
and its document-link QR. Most are VAT machinery, and Ben is not VAT-registered.

**Not built: multi-page.** The design closes the question (continuation header,
ยอดยกมา / ยอดยกไป carry rows, honest page counters), but that needs a DOM-measuring
paginator. No issued document has ever overflowed A4 — the budget holds 3–4 plain
items and the largest real document has 2. Native print rules (`table-header-group`,
`break-inside: avoid`) carry the overflow case for now, and the footer says `1 / 1`
because that is the only count it can honestly report.

**Grist wiring still outstanding** — until it lands, ①⑦⑧⑨ only appear in the
`redesign-*` dev scenarios:

- `Providers.Phone` (Text), optionally `Providers.Role`
- `Documents.Attention` (Text), `Documents.Show_Contact_Back` (Toggle)
- `Documents.Receipt` → `Ref:Receipts`, which is where `PaidDate / Gross / WHT /
  NetTransfer / Channel` already live
- the `Documents.Record` trigger formula, mirrored in `src/types/document-schema-formula.py`

Every new schema field is nullish and nothing was renamed, so share links issued
before the redesign still decode against the new bundle.

### 3. No external runtime dependency

`index.html` loads the Grist plugin API from our own instance
(`VITE_GRIST_PLUGIN_API` in `.env`) instead of `docs.getgrist.com`. Share links
render even if that script never loads.

### 4. Cache policy (`Caddyfile`)

Vite fingerprints `/assets/*`, but `index.html` is a stable URL pointing at those
hashes. Cached `index.html` means a rebuild silently keeps serving the old bundle
— this bit us once. So: assets `immutable`, `index.html` `no-cache`.

## Deploying

```sh
pnpm install
pnpm run build-only      # writes dist/, which the container mounts read-only
docker compose up -d     # joins the shared `proxy` network
```

Routed by `~/ddd/services/global-proxy/Caddyfile` → `bizdoc.saa-coop.org`.
A rebuild is picked up immediately; no restart needed.

## PEAK-compatible numbering (lives in Grist, not here)

`Documents.Number` is a **trigger formula** (new records only), so the 22
documents migrated out of PEAK keep their original numbers:

```python
prefix = {"Quotation": "QT-", "Invoice": "IV-", "Receipt": "RE-"}.get($Document_Type, "DOC-")
if not $Date:
  return ""
ym = $Date.strftime("%Y%m")
earlier = 0
for d in Documents.lookupRecords(Document_Type=$Document_Type):
  if d.id < $id and d.Date and d.Date.strftime("%Y%m") == ym:
    earlier += 1
return "%s%s%05d" % (prefix, ym, earlier + 1)
```

Produces PEAK's shape — `IV-20260800001`, `RE-20260800001` — continuing the
existing monthly sequence.

The sequence counts earlier rows rather than parsing their `Number` on purpose:
reading `Number` makes two documents created in the same batch depend on each
other, and Grist resolves that cycle by leaving both numbers blank. Caveat of the
counting approach: deleting a document frees its number for reuse.

### 5. VAT and WHT on one invoice

`Tax` holds one rate: +0.07 VAT or −0.03 WHT. A VAT-registered issuer (P2D Medical Books)
needs both, so the record also takes an optional `WHT` **amount** (computed per line in Grist,
since WHT applies to services only). When `WHT > 0` the summary shows จำนวนเงินรวมทั้งสิ้น →
หัก ภาษี ณ ที่จ่าย → ยอดชำระสุทธิ, and the PromptPay QR uses the payable amount.
