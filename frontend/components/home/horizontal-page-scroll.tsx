"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

type HorizontalPageScrollProps = {
  /** Each child renders as one full-viewport-height panel, stacked top to bottom. */
  children: ReactNode;
};

/**
 * Pins its content and turns normal page scroll into a locked, section-by-
 * section vertical scroll: each direct child becomes one full-height (100vh)
 * panel. Scrolling is intercepted and clamped between the first and last
 * panel — once the user reaches the top or bottom panel and keeps scrolling
 * in that direction, normal page scroll resumes so they can continue past
 * this block (e.g. into the footer). After the user stops scrolling/
 * swiping, the track snaps so the nearest panel fills the viewport. Falls
 * back to a plain vertical stack (no pin, no scroll hijacking) when
 * prefers-reduced-motion is set.
 */
export function HorizontalPageScroll({ children }: HorizontalPageScrollProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const [maxTranslate, setMaxTranslate] = useState(0); // max px translateY (track height - wrapper height)
  const [activeIndex, setActiveIndex] = useState(0);
  const translate = useRef(0); // current px translateY, clamped to [0, maxTranslate]
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTranslate = useRef(0);
  const snapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Center of each panel, in px from the start of the track (index-aligned).
  const panelCenters = useRef<number[]>([]);

  const panelCount = Children.count(children);

  // Index of the panel center closest to a given translate value.
  const nearestIndexTo = (value: number) => {
    const centers = panelCenters.current;
    if (centers.length === 0) return 0;
    return centers.reduce(
      (closest, c, i) => (Math.abs(c - value) < Math.abs(centers[closest] - value) ? i : closest),
      0
    );
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Measure the real rendered track/wrapper/panel heights from the DOM so
  // the clamp range and snap points stay correct regardless of panel
  // height or content changes.
  useEffect(() => {
    if (reduceMotion) return;
    const wrapper = wrapperRef.current;
    const track = trackRef.current;
    if (!wrapper || !track) return;

    const measure = () => {
      const max = Math.max(0, track.scrollHeight - wrapper.offsetHeight);
      setMaxTranslate(max);

      const centers: number[] = [];
      Array.from(track.children).forEach((panel) => {
        const el = panel as HTMLElement;
        centers.push(el.offsetTop + el.offsetHeight / 2 - wrapper.offsetHeight / 2);
      });
      panelCenters.current = centers.map((c) => Math.min(Math.max(c, 0), max));

      // Re-snap to the nearest panel's freshly-computed center, rather than
      // just clamping the old translate value — otherwise a resize (e.g.
      // the sidebar collapsing/expanding, or a mobile topbar appearing)
      // leaves the track visually off-center even though it's still
      // within [0, max].
      const centers2 = panelCenters.current;
      let nearest = centers2.length > 0 ? centers2[0] : 0;
      let smallestDiff = Math.abs(translate.current - nearest);
      for (const c of centers2) {
        const diff = Math.abs(translate.current - c);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          nearest = c;
        }
      }
      translate.current = centers2.length > 0 ? nearest : Math.min(translate.current, max);
      track.style.transition = "none";
      track.style.transform = `translateY(-${translate.current}px)`;
      setActiveIndex(nearestIndexTo(translate.current));
      setReady(true);
    };

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(wrapper);
    return () => resizeObserver.disconnect();
  }, [reduceMotion, panelCount]);

  const applyTranslate = (next: number, instant = false) => {
    const value = Math.min(Math.max(next, 0), maxTranslate);
    translate.current = value;
    const track = trackRef.current;
    if (track) {
      track.style.transition = instant ? "none" : "transform 60ms linear";
      track.style.transform = `translateY(-${value}px)`;
    }
  };

  const snapToNearest = () => {
    const centers = panelCenters.current;
    if (centers.length === 0) return;
    let nearest = centers[0];
    let smallestDiff = Math.abs(translate.current - nearest);
    for (const c of centers) {
      const diff = Math.abs(translate.current - c);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        nearest = c;
      }
    }
    translate.current = nearest;
    const track = trackRef.current;
    if (track) {
      track.style.transition = "transform 280ms ease-out";
      track.style.transform = `translateY(-${nearest}px)`;
    }
  };

  const scheduleSnap = () => {
    if (snapTimeout.current) clearTimeout(snapTimeout.current);
    snapTimeout.current = setTimeout(snapToNearest, 140);
  };

  useEffect(() => {
    return () => {
      if (snapTimeout.current) clearTimeout(snapTimeout.current);
    };
  }, []);

  // Wheel/trackpad
  useEffect(() => {
    if (reduceMotion || !ready) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onWheel = (e: WheelEvent) => {
      const delta = e.deltaY;
      // Let the page scroll normally once we're at the top or bottom panel
      // and the user keeps scrolling in that direction, so they can scroll
      // past this block (e.g. into the footer).
      if ((translate.current <= 0 && delta < 0) || (translate.current >= maxTranslate && delta > 0)) {
        return;
      }
      e.preventDefault();
      applyTranslate(translate.current + delta);
      setActiveIndex(nearestIndexTo(translate.current));
      scheduleSnap();
    };

    wrapper.addEventListener("wheel", onWheel, { passive: false });
    return () => wrapper.removeEventListener("wheel", onWheel);
  }, [reduceMotion, ready, maxTranslate]);

  // Touch swipe
  useEffect(() => {
    if (reduceMotion || !ready) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onTouchStart = (e: TouchEvent) => {
      if (snapTimeout.current) clearTimeout(snapTimeout.current);
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartTranslate.current = translate.current;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const dx = touchStartX.current - e.touches[0].clientX;
      const dy = touchStartY.current - e.touches[0].clientY;
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
        // At the top/bottom edge and swiping further that way: let the
        // browser handle normal page scroll instead of intercepting.
        if ((translate.current <= 0 && dy < 0) || (translate.current >= maxTranslate && dy > 0)) {
          return;
        }
        e.preventDefault();
        applyTranslate(touchStartTranslate.current + dy, true);
        setActiveIndex(nearestIndexTo(translate.current));
      }
    };

    const onTouchEnd = () => {
      touchStartX.current = null;
      touchStartY.current = null;
      snapToNearest();
      setActiveIndex(nearestIndexTo(translate.current));
    };

    wrapper.addEventListener("touchstart", onTouchStart, { passive: true });
    wrapper.addEventListener("touchmove", onTouchMove, { passive: false });
    wrapper.addEventListener("touchend", onTouchEnd);
    return () => {
      wrapper.removeEventListener("touchstart", onTouchStart);
      wrapper.removeEventListener("touchmove", onTouchMove);
      wrapper.removeEventListener("touchend", onTouchEnd);
    };
  }, [reduceMotion, ready, maxTranslate]);

  // Keyboard: up/down arrow keys pan to the adjacent panel's center.
  useEffect(() => {
    if (reduceMotion || !ready) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const centers = panelCenters.current;
      if (centers.length === 0) return;
      const currentIndex = centers.reduce(
        (closest, c, i) => (Math.abs(c - translate.current) < Math.abs(centers[closest] - translate.current) ? i : closest),
        0
      );
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = Math.min(currentIndex + 1, centers.length - 1);
        const next = centers[nextIndex];
        translate.current = next;
        const track = trackRef.current;
        if (track) {
          track.style.transition = "transform 280ms ease-out";
          track.style.transform = `translateY(-${next}px)`;
        }
        setActiveIndex(nextIndex);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = Math.max(currentIndex - 1, 0);
        const prev = centers[prevIndex];
        translate.current = prev;
        const track = trackRef.current;
        if (track) {
          track.style.transition = "transform 280ms ease-out";
          track.style.transform = `translateY(-${prev}px)`;
        }
        setActiveIndex(prevIndex);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reduceMotion, ready, maxTranslate]);

  // Jump directly to a panel (used by the dot navigation).
  const jumpToIndex = (index: number) => {
    const centers = panelCenters.current;
    if (index < 0 || index >= centers.length) return;
    const target = centers[index];
    translate.current = target;
    const track = trackRef.current;
    if (track) {
      track.style.transition = "transform 280ms ease-out";
      track.style.transform = `translateY(-${target}px)`;
    }
    setActiveIndex(index);
  };

  if (reduceMotion) {
    return <div className="flex flex-col">{children}</div>;
  }

  const childArray = Children.toArray(children);

  return (
    <div
      ref={wrapperRef}
      className="relative h-[calc(100dvh-40px)] overflow-hidden bg-[#1a1a1a]"
      tabIndex={0}
      role="region"
      aria-label="Home page sections — scroll or swipe vertically"
      style={{ opacity: ready ? 1 : 0, transition: "opacity 200ms ease-out" }}
    >
      <div ref={trackRef} className="flex flex-col will-change-transform">
        {childArray.map((child, index) => (
          <div key={index} className="h-[calc(100dvh-40px)] w-full flex-none overflow-y-auto">
            {child}
          </div>
        ))}
      </div>

      <nav
        className="pointer-events-auto absolute right-5 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-3 sm:right-8"
        aria-label="Section navigation"
      >
        {childArray.map((_, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={index}
              type="button"
              onClick={() => jumpToIndex(index)}
              aria-label={`Go to section ${index + 1}`}
              aria-current={isActive ? "true" : undefined}
              className="group relative flex h-6 w-6 items-center justify-center"
            >
              <span
                className="block rounded-full transition-all duration-300 ease-out"
                style={{
                  width: isActive ? 16 : 11,
                  height: isActive ? 16 : 11,
                  backgroundColor: isActive ? "#FC8337" : "transparent",
                  border: isActive ? "none" : "2px solid #8A8A94",
                  boxShadow: isActive ? "0 0 10px rgba(252, 131, 55, 0.7)" : "none",
                }}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
