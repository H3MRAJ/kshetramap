"use client";

import { useEffect, useState } from "react";

/** True below Tailwind `md` (768px). SSR-safe: false until mounted. */
export function useIsMobile(breakpointPx = 768): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [breakpointPx]);

  return mobile;
}
