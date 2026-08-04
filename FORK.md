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

### 2. No external runtime dependency

`index.html` loads the Grist plugin API from our own instance
(`VITE_GRIST_PLUGIN_API` in `.env`) instead of `docs.getgrist.com`. Share links
render even if that script never loads.

### 3. Cache policy (`Caddyfile`)

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
