import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { db } from '@/lib/db';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OppScan — Opportunity Intelligence',
  description: 'Scan the web for trending opportunities, events, and market gaps',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const stats = db.getStats();
  const lastScan = stats.lastScan?.completed_at ?? null;

  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex bg-slate-950">
        <Sidebar total={stats.total} lastScan={lastScan} />
        <main className="flex-1 min-h-screen overflow-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
