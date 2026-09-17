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
    statusBarStyle: 'black-translucent',
  },
};

export const viewport = {
  themeColor: '#0a0e18',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PageLoader />
        <WalletProvider>
          <AppChrome>{children}</AppChrome>
        </WalletProvider>
      </body>
    </html>
  );
}
