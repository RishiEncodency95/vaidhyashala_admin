/**
 * Schema markup as it may be pasted in SEO Information: plain JSON-LD, or JSON-LD inside
 * <script type="application/ld+json">, <script type="application/json"> or a bare <script>
 * (one or several). Returns the JSON-LD objects, [] when empty, or null when any part is not valid JSON.
 * Same rules as the backend (backend/src/utils/schemaMarkup.ts) and the website.
 */
export function parseSchemaMarkup(raw: string): object[] | null {
  const text = (raw ?? "").trim();
  if (!text) return [];
  const scripts = [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const chunks = scripts.length ? scripts : [text];
  const out: object[] = [];
  for (const chunk of chunks) {
    const body = chunk.trim().replace(/^<!\[CDATA\[|\]\]>$/g, "").trim();
    if (!body) continue;
    try {
      const parsed = JSON.parse(body);
      for (const item of Array.isArray(parsed) ? parsed : [parsed]) {
        if (!item || typeof item !== "object") return null;
        out.push(item);
      }
    } catch {
      return null;
    }
  }
  return out;
}
