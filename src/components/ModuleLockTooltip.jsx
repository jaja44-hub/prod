import React, { useState, useRef, useEffect } from 'react';

/**
 * ModuleLockTooltip — wraps locked nav items to show why access is denied.
 * Uses a pure CSS/JS tooltip; no external dependency.
 */
export default function ModuleLockTooltip({ children, label }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => setVisible(true);
    const hide = () => setVisible(false);
    el.addEventListener('mouseenter', show);
    el.addEventListener('mouseleave', hide);
    el.addEventListener('focusin', show);
    el.addEventListener('focusout', hide);
    return () => {
      el.removeEventListener('mouseenter', show);
      el.removeEventListener('mouseleave', hide);
      el.removeEventListener('focusin', show);
      el.removeEventListener('focusout', hide);
    };
  }, []);

  return (
    <span ref={ref} className="relative inline-block w-full">
      {children}
      {visible && (
        <span
          role="tooltip"
          className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 whitespace-nowrap rounded-md bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 shadow-lg pointer-events-none"
        >
          🔒 {label || 'Module not included in your plan'}
          <span className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700" />
        </span>
      )}
    </span>
  );
}
