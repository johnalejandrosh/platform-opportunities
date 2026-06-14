'use client';

import { useState, useEffect } from 'react';
import OpportunityCard from '@/components/OpportunityCard';
import type { Opportunity } from '@/lib/db';

const CATEGORIES = ['all', 'trend', 'market', 'tool', 'event', 'conference', 'keyword'];
const ORDER_OPTIONS = [
  { value: 'created_at', label: 'Newest' },
  { value: 'relevance_score', label: 'Most Relevant' },
  { value: 'event_date', label: 'Event Date' },
];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [orderBy, setOrderBy] = useState('created_at');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: '60',
      orderBy,
      orderDir: orderBy === 'event_date' ? 'ASC' : 'DESC',
    });
    if (category !== 'all') params.set('category', category);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (showBookmarked) params.set('bookmarked', 'true');

    fetch(`/api/opportunities?${params}`)
      .then(r => r.json())
      .then(d => { setOpportunities(d.opportunities); setLoading(false); })
      .catch(() => setLoading(false));
  }, [category, orderBy, debouncedSearch, showBookmarked]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Opportunities</h1>
          <p className="text-slate-500 text-sm mt-0.5">{opportunities.length} found</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add Manual
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="flex-1 min-w-48">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search opportunities…"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                category === cat
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Order */}
        <select
          value={orderBy}
          onChange={e => setOrderBy(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          {ORDER_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Bookmarked toggle */}
        <button
          onClick={() => setShowBookmarked(!showBookmarked)}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            showBookmarked ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white bg-slate-800'
          }`}
        >
          🔖 Saved
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-40 animate-pulse" />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-20 text-slate-600">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-lg font-medium text-slate-400">No opportunities found</p>
          <p className="text-sm mt-1">Try adjusting filters or run a scan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {opportunities.map((op: Opportunity) => (
            <OpportunityCard key={op.id} opportunity={op} />
          ))}
        </div>
      )}

      {/* Add manual modal */}
      {addOpen && <AddManualModal onClose={() => setAddOpen(false)} onAdded={(op) => { setOpportunities(prev => [op, ...prev]); setAddOpen(false); }} />}
    </div>
  );
}

function AddManualModal({ onClose, onAdded }: { onClose: () => void; onAdded: (op: Opportunity) => void }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'market', url: '', event_date: '', tags: '' });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }),
    });
    const data = await res.json();
    onAdded(data.opportunity);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-lg">Add Opportunity</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl">×</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Title *" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" rows={3} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
              {['trend','market','tool','event','conference','keyword'].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
            <input type="date" value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})} placeholder="Event date" className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
          </div>
          <input value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="URL" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="Tags (comma separated)" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-700 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 rounded-lg text-sm text-white font-medium transition-colors">
              {saving ? 'Saving…' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
