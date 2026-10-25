import { useEffect, useRef, useState } from 'react';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Counts from 0 up to `target` once the element scrolls into view.
 * Returns the current value and a ref to attach to the element.
 */
export const useCountUp = <T extends HTMLElement>(target: number | undefined, duration = 1600) => {
  const ref = useRef<T>(null);
  const [value, setValue] = useState(0);
  const [visible, setVisible] = useState(false);

  // Re-run once the target arrives: components that render nothing while
  // loading only attach the ref after their data is in
  const hasTarget = target !== undefined;
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasTarget, visible]);

  useEffect(() => {
    if (!visible || target === undefined) return;
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(easeOutCubic(t) * target));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, target, duration]);

  return { ref, value };
};
