import type { Metadata, Viewport } from 'next';
import { Fira_Code, Inter, Noto_Sans_Devanagari } from 'next/font/google';
import { Nav } from '@/components/Nav';
import { SettingsProvider, settingsBootScript } from '@/lib/settings';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const devanagari = Noto_Sans_Devanagari({ subsets: ['devanagari'], variable: '--font-devanagari', display: 'swap' });
const fira = Fira_Code({ subsets: ['latin'], variable: '--font-fira', display: 'swap' });

export const metadata: Metadata = {
  title: 'AwaazForm — Your voice. Your form. Your access.',
  description: 'Complete Google Forms and PDFs by voice or text. Every answer is read back and filled only after you confirm.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${devanagari.variable} ${fira.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: settingsBootScript }} />
      </head>
      <body>
        <SettingsProvider>
          <Nav />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
        </SettingsProvider>
      </body>
    </html>
  );
}
