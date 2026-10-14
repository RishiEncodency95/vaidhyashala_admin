/*
 * Content Management (Pages & CMS, Blog, Media Library, Videos, Testimonials, FAQs, Menus…)
 * has no backend in this project: its pages are UI only. A request to one of these paths is
 * never sent — reads come back empty, so each page shows its own built-in content, and saves
 * succeed only on screen until the real APIs for this project are built.
 *
 * To connect a page to a real API later, remove its path from STATIC_CONTENT_PATHS.
 */

// Paths as the backend sees them after /api (or /api/v1)
const STATIC_CONTENT_PATHS: RegExp[] = [
  // Every website section except the ones the backend really has
  /^\/website\/(?!seo(-settings)?(\/|$)|contact(-enquiry)?(\/|$)|verify(\/|$))/,
  /^\/gallery(\/|$)/,
  /^\/blogs(\/|$)/,
  /^\/blog-(categories|experts|updates|reports)(\/|$)/,
  /^\/faqs(\/|$)/,
  /^\/testimonials(\/|$)/,
  /^\/partners(\/|$)/,
];

/** `path` may be "/blogs?x=1", "/api/v1/website/home/hero" or a full URL's pathname */
export function isStaticContentPath(path: string): boolean {
  const clean = path.split("?")[0].replace(/^\/api(\/v1)?(?=\/)/, "");
  return STATIC_CONTENT_PATHS.some((pattern) => pattern.test(clean));
}

/** What a page's own fetch() gets for a static content path: an empty read, or a saved-on-screen write */
export function staticContentResponse(method: string): Response {
  const isRead = method.toUpperCase() === "GET";
  return new Response(
    JSON.stringify({
      success: true,
      message: isRead ? "Static content" : "Saved on screen only (static content)",
      data: null,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
