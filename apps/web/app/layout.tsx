import type { Metadata, Viewport } from 'next';
import { Fira_Code, Inter, Noto_Sans_Devanagari } from 'next/font/google';
import { Nav } from '@/components/Nav';
import { PwaProvider } from '@/components/PwaProvider';
import { SettingsProvider, settingsBootScript } from '@/lib/settings';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const devanagari = Noto_Sans_Devanagari({ subsets: ['devanagari'], variable: '--font-devanagari', display: 'swap' });
const fira = Fira_Code({ subsets: ['latin'], variable: '--font-fira', display: 'swap' });
// Devanagari covers Hindi and Marathi.
const fonts = [inter, devanagari, fira].map((f) => f.variable).join(' ');

export const metadata: Metadata = {
  applicationName: 'AwaazForm',
  appleWebApp: { capable: true, title: 'AwaazForm', statusBarStyle: 'default' },
  icons: { apple: '/icons/apple-touch-icon.png' },
  formatDetection: { telephone: false },
  title: 'AwaazForm — Your voice. Your form. Your access.',
  description: 'Fill Google Forms, Microsoft Forms, PDFs and Word files by voice in English and 12 Indian languages. Every answer is read back and filled only after you confirm.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#624de3' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fonts} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: settingsBootScript }} />
      </head>
      <body>
        <SettingsProvider>
          <PwaProvider>
          <Nav />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          </PwaProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
