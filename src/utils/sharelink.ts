/**
 * Self-contained shareable document links.
 *
 * The whole document payload is deflated and base64url-encoded into the URL
 * *fragment*, so it is never sent to the server and needs no backend, no
 * database and no login. Anyone holding the link can render the document.
 *
 * Format:  #d=<flag><base64url>
 *          flag 'z' = deflate-raw compressed JSON
 *          flag 'p' = plain JSON (fallback when CompressionStream is absent)
 */

type Bytes = Uint8Array<ArrayBuffer>

export const SHARE_PREFIX = 'd='

function bytesToB64url(bytes: Bytes): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlToBytes(s: string): Bytes {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function streamThrough(input: Bytes, stream: ReadableWritablePair): Promise<Bytes> {
  const blob = new Blob([input as unknown as BlobPart])
  const piped = blob.stream().pipeThrough(stream as ReadableWritablePair<Bytes, Bytes>)
  const buf = await new Response(piped).arrayBuffer()
  return new Uint8Array(buf)
}

/** Encode a document record into a shareable URL. */
export async function encodeShareLink(record: unknown, baseUrl?: string): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(record))
  let flag = 'p'
  let payload: Bytes = json
  if (typeof CompressionStream !== 'undefined') {
    try {
      payload = await streamThrough(json, new CompressionStream('deflate-raw'))
      flag = 'z'
    } catch {
      // keep plain
    }
  }
  const base = baseUrl ?? `${location.origin}${location.pathname}`
  return `${base}#${SHARE_PREFIX}${flag}${bytesToB64url(payload)}`
}

/**
 * Decode a document record from a URL fragment.
 * Returns null when the fragment carries no share payload.
 */
export async function decodeShareLink(hash: string = location.hash): Promise<unknown | null> {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw.startsWith(SHARE_PREFIX)) return null
  const body = raw.slice(SHARE_PREFIX.length)
  if (!body) return null

  const flag = body[0]
  const bytes = b64urlToBytes(body.slice(1))
  let jsonBytes: Bytes = bytes
  if (flag === 'z') {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('เบราว์เซอร์นี้ไม่รองรับการอ่านลิงก์แบบบีบอัด')
    }
    jsonBytes = await streamThrough(bytes, new DecompressionStream('deflate-raw'))
  } else if (flag !== 'p') {
    throw new Error('รูปแบบลิงก์ไม่ถูกต้อง')
  }
  return JSON.parse(new TextDecoder().decode(jsonBytes))
}

/** True when the current page was opened from a share link. */
export function hasShareLink(hash: string = location.hash): boolean {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  return raw.startsWith(SHARE_PREFIX) && raw.length > SHARE_PREFIX.length
}
