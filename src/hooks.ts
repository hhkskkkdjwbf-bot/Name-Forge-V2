import { useEffect, useRef, type RefObject } from 'react';

/**
 * Calls `onClose` when the Escape key is pressed. Used by every modal dialog so keyboard users can
 * always dismiss it (WCAG 2.1.2 / dialog pattern).
 */
export function useEscapeKey(onClose: () => void): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dialog focus management: moves focus into the dialog when it opens, keeps Tab / Shift+Tab inside it,
 * and returns focus to the element that opened it when it closes (WAI-ARIA dialog pattern).
 * Attach the returned ref to the element carrying role="dialog" and give that element tabIndex={-1}.
 */
export function useModalFocus<T extends HTMLElement>(): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const container = ref.current;

    const getFocusable = (): HTMLElement[] => {
      if (!container) return [];
      const nodes: HTMLElement[] = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      return nodes.filter(
        (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true'
      );
    };

    // Prefer a text field (e.g. note or collection name), otherwise the first control, otherwise the dialog itself.
    const initial =
      container?.querySelector<HTMLElement>('textarea, input[type="text"], input:not([type])') ??
      getFocusable()[0] ??
      container;
    initial?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !container) return;
      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !container.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus();
    };
  }, []);

  return ref;
}
