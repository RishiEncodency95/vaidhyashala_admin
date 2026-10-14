import { getAccessToken, getApiBaseUrl, getBackendUrl } from "./api";
import { adminPageHeaders } from "./adminPage";
import { isStaticContentPath, staticContentResponse } from "./staticContent";

/*
 * Some admin pages (Gallery, Exhibitor List, Advisory Board, Testimonials, Videos, Trusted
 * Leaders…) call the backend with plain fetch() instead of lib/api. This wraps window.fetch
 * once so every request to our backend's /api — from any page, now or later — carries the
 * admin's token and the page it came from, and so shows up in the Activity Log.
 * Headers a caller sets itself are kept; requests to other sites are left untouched.
 * Content Management pages are UI only (lib/staticContent), so their requests stop here.
 */

let installed = false;

const backendOrigins = () => {
  const origins = new Set<string>([window.location.origin]);
  for (const url of [getApiBaseUrl(), getBackendUrl()]) {
    try {
      origins.add(new URL(url, window.location.origin).origin);
    } catch {
      // not a URL: ignore
    }
  }
  return origins;
};

/** The request's path when it goes to our backend's /api, otherwise null */
const backendApiPath = (input: RequestInfo | URL) => {
  const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  try {
    const url = new URL(raw, window.location.origin);
    return url.pathname.startsWith("/api/") && backendOrigins().has(url.origin) ? url.pathname : null;
  } catch {
    return null;
  }
};

export function installAdminFetch() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const apiPath = backendApiPath(input);
    if (!apiPath) return original(input, init);
    if (isStaticContentPath(apiPath)) {
      const method = init?.method ?? (input instanceof Request ? input.method : "GET");
      return Promise.resolve(staticContentResponse(method));
    }

    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    const token = getAccessToken();
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    for (const [name, value] of Object.entries(adminPageHeaders())) {
      if (!headers.has(name)) headers.set(name, value);
    }
    return original(input, { ...init, headers });
  };
}
