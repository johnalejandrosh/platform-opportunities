import { db } from '@/lib/db';
import ScanButton from '@/components/ScanButton';
import OpportunityCard from '@/components/OpportunityCard';
import type { Opportunity } from '@/lib/db';

const CATEGORY_TABS = ['all', 'trend', 'market', 'tool', 'event', 'conference'];

function StatCard({ value, label, sub, accent }: { value: string | number; label: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className={`text-3xl font-bold ${accent ?? 'text-white'}`}>{value}</div>
      <div className="text-slate-400 text-sm mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const stats = db.getStats();
  const topRelevant = db.getOpportunities({ limit: 6, orderBy: 'relevance_score', orderDir: 'DESC' });
  const marketOps = db.getOpportunities({ limit: 4, category: 'market', orderBy: 'relevance_score', orderDir: 'DESC' });
  const recent = db.getOpportunities({ limit: 4, orderBy: 'created_at', orderDir: 'DESC' });

  const upcomingEvents = db.getOpportunities({
    limit: 8,
    orderBy: 'event_date',
    orderDir: 'ASC',
    category: 'conference',
  }).filter((o: Opportunity) => o.event_date);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <ScanButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard value={stats.total} label="Total Opportunities" sub="All time" />
        <StatCard value={stats.upcomingEvents} label="Upcoming Events" sub="Conferences & meetups" accent="text-emerald-400" />
        <StatCard value={stats.todayCount} label="Added Today" sub="From scans" accent="text-cyan-400" />
        <StatCard value={stats.bookmarked} label="Bookmarked" sub="Your watchlist" accent="text-indigo-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="xl:col-span-2 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">🔥 Highest Relevance</h2>
              <a href="/opportunities?orderBy=relevance_score" className="text-indigo-400 text-xs hover:text-indigo-300">View all →</a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topRelevant.map((op: Opportunity) => <OpportunityCard key={op.id} opportunity={op} />)}
            </div>
          </section>

          {marketOps.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-semibold">💰 Market Opportunities</h2>
                <a href="/opportunities?category=market" className="text-indigo-400 text-xs hover:text-indigo-300">View all →</a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {marketOps.map((op: Opportunity) => <OpportunityCard key={op.id} opportunity={op} />)}
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">🕐 Recently Added</h2>
              <a href="/opportunities" className="text-indigo-400 text-xs hover:text-indigo-300">View all →</a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recent.map((op: Opportunity) => <OpportunityCard key={op.id} opportunity={op} />)}
            </div>
          </section>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Upcoming events */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h2 className="text-white font-semibold mb-4">📅 Upcoming Events</h2>
            {upcomingEvents.length === 0 ? (
              <p className="text-slate-600 text-sm">No upcoming events. Run a scan to find conferences.</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((op: Opportunity) => {
                  const date = new Date(op.event_date!);
                  const month = date.toLocaleDateString('en-US', { month: 'short' });
                  const day = date.getDate();
                  const daysUntil = Math.ceil((date.getTime() - Date.now()) / 86400000);
                  return (
                    <div key={op.id} className="flex gap-3 items-start">
                      <div className="bg-slate-800 rounded-lg px-2 py-1 text-center min-w-[44px]">
                        <div className="text-xs text-slate-400 uppercase leading-none">{month}</div>
                        <div className="text-white font-bold text-lg leading-tight">{day}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        {op.url ? (
                          <a href={op.url} target="_blank" rel="noopener noreferrer" className="text-slate-200 text-sm font-medium hover:text-indigo-300 line-clamp-1">
                            {op.title}
                          </a>
                        ) : (
                          <p className="text-slate-200 text-sm font-medium line-clamp-1">{op.title}</p>
                        )}
                        <p className="text-slate-500 text-xs">
                          {daysUntil > 0 ? `in ${daysUntil} days` : daysUntil === 0 ? 'Today!' : 'Past'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <a href="/timeline" className="block mt-4 text-center text-xs text-indigo-400 hover:text-indigo-300">
              Full timeline →
            </a>
          </div>

          {/* Category breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h2 className="text-white font-semibold mb-3">📊 By Category</h2>
            <div className="space-y-2">
              {CATEGORY_TABS.filter(c => c !== 'all' && stats.byCategory[c]).map(cat => {
                const count = stats.byCategory[cat] ?? 0;
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                const colors: Record<string, string> = {
                  trend: 'bg-cyan-500', market: 'bg-amber-500', tool: 'bg-blue-500',
                  event: 'bg-emerald-500', conference: 'bg-violet-500', keyword: 'bg-pink-500',
                };
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 capitalize">{cat}</span>
                      <span className="text-slate-300 font-medium">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full">
                      <div className={`h-full ${colors[cat] ?? 'bg-indigo-500'} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-indigo-950 border border-indigo-900 rounded-xl p-4">
            <h2 className="text-indigo-200 font-semibold text-sm mb-2">💡 Getting Started</h2>
            <ul className="space-y-1.5 text-xs text-indigo-400">
              <li>• Click ⚡ Scan Now to pull live data from HN, GitHub & Dev.to</li>
              <li>• Bookmark opportunities you want to track</li>
              <li>• Add your GitHub token in Settings for higher API rate limits</li>
              <li>• Use Timeline to see conferences by month</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
