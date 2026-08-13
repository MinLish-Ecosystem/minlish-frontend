import React, { useEffect, useState, useCallback } from "react";
import { ArrowUp } from "lucide-react";

const THRESHOLD = 300;

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  const getScrollEl = useCallback((): Element | null => {
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
        "fixed bottom-6 right-6 z-30",
        "w-11 h-11 rounded-full",
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
