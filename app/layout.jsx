import './globals.css';
import AppChrome from '@/components/AppChrome';
import { WalletProvider } from '@/lib/wallet';

export const metadata = {
  title: 'Tesla Capital',
  description: 'Tesla Capital — invest, trade crypto, and manage Tesla vehicle inventory.',
  manifest: '/manifest.json',
  icons: {
    icon: '/assets/tesla-logo-192.png',
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
        <WalletProvider>
          <AppChrome>{children}</AppChrome>
        </WalletProvider>
      </body>
    </html>
  );
}
