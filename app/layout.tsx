import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const metadata: Metadata = {
  title: { default: 'Avitary — пространство любимых историй', template: '%s · Avitary' },
  description: 'Открывайте аниме, собирайте личную коллекцию и делитесь впечатлениями в Avitary.',
  applicationName: 'Avitary',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#6f67d9',
  width: 'device-width',
  initialScale: 1,
};

const themeScript = `(()=>{try{const saved=localStorage.getItem('avitary-theme');const theme=saved==='light'||saved==='dark'?saved:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=theme}catch(_){document.documentElement.dataset.theme='light'}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
