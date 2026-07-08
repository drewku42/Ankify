import { useCallback, useRef } from "react";

export function useRevealOnScroll(): (el: HTMLElement | null) => void {
  const observed = useRef<WeakSet<HTMLElement>>(new WeakSet());

  return useCallback((el: HTMLElement | null) => {
    if (!el || observed.current.has(el)) return;
    observed.current.add(el);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );
    io.observe(el);
  }, []);
}
