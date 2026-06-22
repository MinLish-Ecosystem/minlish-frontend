import React, { useEffect, useState, useCallback } from "react";
import { ArrowUp } from "lucide-react";

/**
 * ScrollToTop — Floating action button that appears once the user has
 * scrolled more than `threshold` pixels down the page.  Clicking it
 * scrolls the closest scrollable ancestor (the main content area) back
 * to the top with a smooth animation.
 *
 * The button is rendered *inside* MainLayout's <main> scroll container so
 * it stays positioned relative to the viewport using `fixed`.
 */
const THRESHOLD = 300;

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  // We listen on the window scroll, but in our MainLayout the scrollable
  // container is the <main> element. We attach to the closest scrollable
  // ancestor by querying the DOM lazily.
  const getScrollEl = useCallback((): Element | null => {
    // The main content area has overflow-y-auto; select it by class
    return document.querySelector("main.flex-1.overflow-y-auto") ?? null;
  }, []);

  useEffect(() => {
    const el = getScrollEl();
    if (!el) return;

    const onScroll = () => {
      setVisible(el.scrollTop > THRESHOLD);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [getScrollEl]);

  const handleClick = () => {
    const el = getScrollEl();
    if (el) {
      el.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <button
      id="scroll-to-top-btn"
      aria-label="Scroll to top"
      onClick={handleClick}
      className={[
        "fixed bottom-8 right-8 z-50",
        "w-12 h-12 rounded-full",
        "bg-gradient-to-br from-purple-500 to-indigo-600",
        "text-white shadow-xl shadow-purple-200",
        "flex items-center justify-center",
        "transition-all duration-300 ease-out",
        "hover:scale-110 hover:shadow-2xl hover:shadow-purple-300 active:scale-95",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none",
      ].join(" ")}
    >
      <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
    </button>
  );
}
