import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  // Scroll to top when the route actually changes (pathname or search)
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      } catch (e) {
        window.scrollTo(0, 0);
      }
    }
  }, [pathname, search]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest) return;

      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // ignore links that open in new tab/window
      if (anchor.target && anchor.target !== "_self") return;

      // Build absolute URL for comparison
      try {
        const url = new URL(href, window.location.origin);

        // If link has a hash (in-page anchor), skip so browser can handle scrolling to fragment
        if (url.hash) return;

        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          try {
            window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
          } catch {
            window.scrollTo(0, 0);
          }
        }
      } catch {
        // invalid URL - ignore
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
