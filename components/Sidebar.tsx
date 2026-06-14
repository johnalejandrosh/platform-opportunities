'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Dashboard', icon: '⚡' },
  { href: '/opportunities', label: 'Opportunities', icon: '🎯' },
  { href: '/timeline', label: 'Timeline', icon: '📅' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ total, lastScan }: { total: number; lastScan: string | null }) {
  const pathname = usePathname();

  function timeAgo(iso: string | null): string {
    if (!iso) return 'Never';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <aside className="w-60 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      <div className="px-5 py-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-lg">🔭</div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">OppScan</h1>
            <p className="text-slate-500 text-xs">Opportunity Intelligence</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span>Opportunities</span>
            <span className="text-slate-300 font-medium">{total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Last scan</span>
            <span className="text-slate-300 font-medium">{timeAgo(lastScan)}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
