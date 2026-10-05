import './globals.css';
import Script from 'next/script';
import AppChrome from '@/components/AppChrome';
import PageLoader from '@/components/PageLoader';
import { WalletProvider } from '@/lib/wallet';
import { LocaleProvider } from '@/lib/locale';

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
  userScalable: 'no',
  viewportFit: 'cover',
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

// iOS Safari ignores user-scalable=no, so pinch and double-tap zoom are blocked here.
const NO_ZOOM = `(function(){var o={passive:false};function p(e){e.preventDefault()}document.addEventListener('gesturestart',p,o);document.addEventListener('gesturechange',p,o);document.addEventListener('gestureend',p,o);document.addEventListener('touchmove',function(e){if(e.touches.length>1)e.preventDefault()},o)})();`;

// Smartsupp live-chat support widget; only loaded when a key is configured.
const SMARTSUPP_KEY = process.env.NEXT_PUBLIC_SMARTSUPP_KEY;

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: THEME_BOOT writes data-theme onto <html> before
    // React hydrates, so the attribute on the client legitimately differs from
    // the one the server sent. Without this React discards the attribute.
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <script dangerouslySetInnerHTML={{ __html: NO_ZOOM }} />
        <PageLoader />
        <WalletProvider>
          <LocaleProvider>
            <AppChrome>{children}</AppChrome>
          </LocaleProvider>
        </WalletProvider>
        {SMARTSUPP_KEY && (
          <Script id="smartsupp-loader" strategy="lazyOnload">
            {`var _smartsupp = _smartsupp || {};
_smartsupp.key = ${JSON.stringify(SMARTSUPP_KEY)};
window.smartsupp||(function(d) {
  var s,c,o=smartsupp=function(){ o._.push(arguments)};o._=[];
  s=d.getElementsByTagName('script')[0];c=d.createElement('script');
  c.type='text/javascript';c.charset='utf-8';c.async=true;
  c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
})(document);`}
          </Script>
        )}
      </body>
    </html>
  );
}
