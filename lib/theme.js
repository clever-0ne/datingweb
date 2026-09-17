/**
 * The theme preference, in one place.
 *
 * The switch is `data-theme` on <html> rather than a `.dark` class: the admin
 * console at /console-006cd676 already toggles `.dark` for Tailwind's
 * `darkMode: 'class'`, and two owners of one class is how a theme toggle ends up
 * fighting itself. The `theme` key *is* shared with the console, so one choice
 * covers both surfaces — but the app only ever writes the attribute, never the
 * class, and the console is left doing exactly what it already did.
 *
 * Anything that is not exactly 'dark' resolves to light, so a first visit is
 * white and an unreadable preference is white rather than a crash.
 */

export const THEME_KEY = 'theme';

/** The stored preference. 'light' unless it is explicitly 'dark'. */
export function getTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/**
 * Paint a theme. The status bar on a phone is drawn from the theme-color meta
 * tag and not from CSS, so it has to be moved by hand or it stays white above a
 * dark page.
 */
export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a0e18' : '#ffffff');
}

/** Remember a theme and paint it. */
export function setTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* A private window can refuse the write. The theme still applies to this
       page; it just will not survive a reload. */
  }
  applyTheme(theme);
}

/** Flip the theme, returning the one now in force. */
export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}
