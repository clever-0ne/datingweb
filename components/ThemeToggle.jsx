'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { getTheme, toggleTheme } from '@/lib/theme';

/**
 * The white/dark switch.
 *
 * The icon starts as null rather than 'light' on purpose. The real value was
 * already written onto <html> by the inline script in app/layout.jsx before the
 * first paint, so rendering a guess here would show a moon for one frame and
 * then swap it for a sun on every load for anyone who chose dark.
 *
 * The markup matches the admin console's own toggle
 * (app/console-006cd676/layout.jsx) so the two surfaces are the same control.
 */
export default function ThemeToggle({ size = 20 }) {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    setTheme(getTheme());
  }, []);

  const dark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(toggleTheme())}
      className="icon-btn"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Nothing until the effect has read the stored value — see above. */}
      {theme === null ? null : dark ? <Sun size={size} /> : <Moon size={size} />}
    </button>
  );
}
