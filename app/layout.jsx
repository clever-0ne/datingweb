import './globals.css';
import AppChrome from '@/components/AppChrome';
import PageLoader from '@/components/PageLoader';
import { WalletProvider } from '@/lib/wallet';

export const metadata = {
  title: 'Tesla Capital',
  description: 'Tesla Capital — invest, trade crypto, and manage Tesla vehicle inventory.',
  manifest: '/manifest.json',
  icons: {
    // The SVG is the red T on transparent — no white plate, so the tab shows
    // the mark on whatever colour the browser's tab strip is. It goes last
    // because the PNGs and the .ico ahead of it are the fallback: many mobile
    // browsers cannot read an SVG favicon at all, and a browser that finds
    // nothing it understands draws a blank placeholder rather than a mark.
    icon: [
      { url: '/assets/tesla-logo-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/assets/tesla-t.svg', type: 'image/svg+xml' },
    ],
    apple: '/assets/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Tesla Capital',
    // 'default' rather than 'black-translucent': the latter draws white status
    // text for a dark page, and the app is white by default now.
    statusBarStyle: 'default',
  },
};

// White, because that is what a first visit gets. lib/theme.js repaints this tag
// the moment someone chooses dark, so the status bar follows.
export const viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/**
 * Runs before the first paint, so someone who chose dark never sees a white
 * frame flash past on the way to the page. It has to be in the HTML — anything
 * React did here would run after the paint it exists to prevent.
 *
 * Mirrors lib/theme.js: `theme` is 'dark' or it is light. If you change the key
 * or the values there, change them here too.
 */
const THEME_BOOT = `try{if(localStorage.getItem('theme')==='dark'){document.documentElement.dataset.theme='dark';var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','#0a0e18')}}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: THEME_BOOT writes data-theme onto <html> before
    // React hydrates, so the attribute on the client legitimately differs from
    // the one the server sent. Without this React discards the attribute.
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <PageLoader />
        <WalletProvider>
          <AppChrome>{children}</AppChrome>
        </WalletProvider>
      </body>
    </html>
  );
}
