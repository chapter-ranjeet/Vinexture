"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // When pathname or search params update, complete progress
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Global listener for link and button clicks
  useEffect(() => {
    function handleDocumentClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 1. Check if user clicked an anchor link to internal route
      const anchor = target.closest("a");
      if (anchor && anchor.href) {
        const url = new URL(anchor.href, window.location.href);
        const isInternal = url.origin === window.location.origin;
        const isSamePageAnchor =
          url.pathname === window.location.pathname &&
          url.search === window.location.search &&
          url.hash !== "";

        if (
          isInternal &&
          !isSamePageAnchor &&
          anchor.target !== "_blank" &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.shiftKey &&
          !e.altKey
        ) {
          // If destination differs from current page
          const isCurrentExact =
            url.pathname === window.location.pathname &&
            url.search === window.location.search;

          if (!isCurrentExact) {
            setIsNavigating(true);
            setProgress(30);
            setTimeout(() => setProgress(65), 150);
            setTimeout(() => setProgress(85), 350);
          }
        }
      }

      // 2. Button tactile click ripple / feedback
      const button = target.closest("button");
      if (button) {
        button.classList.add("btn-pressed-active");
        setTimeout(() => {
          button.classList.remove("btn-pressed-active");
        }, 300);

        // If button is a form submit or has data-loading-indicator
        const isSubmit = button.type === "submit";
        if (isSubmit && !button.disabled) {
          button.setAttribute("data-submitting", "true");
          // Revert after 4s fallback if no page change
          setTimeout(() => {
            button.removeAttribute("data-submitting");
          }, 4000);
        }
      }
    }

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
    };
  }, []);

  if (!isNavigating && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-1 w-full overflow-hidden bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-red-600 shadow-[0_0_12px_rgba(37,99,235,0.8)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? "200ms" : "400ms",
        }}
      />
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
