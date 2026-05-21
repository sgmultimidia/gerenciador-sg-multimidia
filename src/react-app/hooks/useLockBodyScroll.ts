import { useEffect } from 'react';

/**
 * Hook to lock body scroll when a modal is open
 * Prevents background scrolling on mobile when modal content is scrolling
 * Also handles Escape key to close modal
 */
export function useLockBodyScroll(isLocked: boolean = true, onClose?: () => void) {
  useEffect(() => {
    if (!isLocked) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;

    const originalBodyStyle = body.style.cssText;
    const originalHtmlStyle = html.style.cssText;

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    if (onClose) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      body.style.cssText = originalBodyStyle;
      html.style.cssText = originalHtmlStyle;
      window.scrollTo(0, scrollY);
      if (onClose) {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [isLocked, onClose]);
}
