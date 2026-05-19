import { useEffect } from 'react';

/**
 * Hook to lock body scroll when a modal is open
 * Prevents background scrolling on mobile when modal content is scrolling
 */
export function useLockBodyScroll(isLocked: boolean = true) {
  useEffect(() => {
    if (!isLocked) return;

    // Save current scroll position
    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;

    // Store original styles
    const originalBodyStyle = body.style.cssText;
    const originalHtmlStyle = html.style.cssText;

    // Lock scroll
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';

    // Cleanup function
    return () => {
      // Restore original styles
      body.style.cssText = originalBodyStyle;
      html.style.cssText = originalHtmlStyle;

      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}
