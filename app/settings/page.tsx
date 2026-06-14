'use client';

import { useState, useEffect } from 'react';

const SCAN_SOURCES = [
  { id: 'hackernews', label: 'Hacker News', desc: 'Top tech stories and discussions', icon: '🟠', free: true },
  { id: 'github', label: 'GitHub Trending', desc: 'Trending AI repositories', icon: '🐙', free: true },
  { id: 'devto', label: 'Dev.to', desc: 'Developer articles and tutorials', icon: '👩‍💻', free: true },
];

export default function SettingsPage() {
  const [githubToken, setGithubToken] = useState('');
  const [rapidApiKey, setRapidApiKey] = useState('');
  const [sources, setSources] = useState<string[]>(['hackernews', 'github', 'devto']);
  const [keywords, setKeywords] = useState('ai, machine learning, llm, startup, saas');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        setGithubToken(d.github_token || '');
        setRapidApiKey(d.rapidapi_key || '');
        setSources(JSON.parse(d.scan_sources || '["hackernews","github","devto"]'));
        setKeywords((JSON.parse(d.priority_keywords || '[]') as string[]).join(', '));
        setLoading(false);
      });
  }, []);

  function toggleSource(id: string) {
    setSources(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  async function handleSave() {
    setSaving(true);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        github_token: githubToken,
        rapidapi_key: rapidApiKey,
        scan_sources: JSON.stringify(sources),
        priority_keywords: JSON.stringify(keywords.split(',').map(k => k.trim()).filter(Boolean)),
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <div className="p-6 text-slate-500">Loading…</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Configure data sources and API keys</p>
      </div>

      <div className="space-y-6">
        {/* Scan Sources */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Scan Sources</h2>
          <div className="space-y-3">
            {SCAN_SOURCES.map(src => (
              <label key={src.id} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={sources.includes(src.id)}
                    onChange={() => toggleSource(src.id)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${sources.includes(src.id) ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${sources.includes(src.id) ? 'ml-5' : 'ml-1'}`} />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-lg">{src.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{src.label}</span>
                      {src.free && <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded">Free</span>}
                    </div>
                    <p className="text-slate-500 text-xs">{src.desc}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* API Keys */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-1">API Keys</h2>
          <p className="text-slate-500 text-xs mb-4">Keys are stored locally in SQLite. Never sent to external services.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 font-medium mb-1.5">
                GitHub Personal Access Token
                <span className="text-slate-600 font-normal ml-2 text-xs">Optional — increases rate limit from 60 to 5000 req/hour</span>
              </label>
              <input
                type="password"
                value={githubToken}
                onChange={e => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-slate-600 text-xs mt-1">
                Create at github.com → Settings → Developer settings → Personal access tokens
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-300 font-medium mb-1.5">
                RapidAPI Key
                <span className="text-slate-600 font-normal ml-2 text-xs">For Google Trends, Twitter trends, and more</span>
              </label>
              <input
                type="password"
                value={rapidApiKey}
                onChange={e => setRapidApiKey(e.target.value)}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-slate-600 text-xs mt-1">
                Get your key at rapidapi.com — subscribe to Google Trends API and Twitter API
              </p>
            </div>
          </div>
        </section>

        {/* Keywords */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-1">Priority Keywords</h2>
          <p className="text-slate-500 text-xs mb-3">Items matching these keywords get higher relevance scores</p>
          <textarea
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            rows={3}
            placeholder="ai, machine learning, startup, saas, api"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
          />
          <p className="text-slate-600 text-xs mt-1">Comma separated keywords</p>
        </section>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-emerald-400 text-sm font-medium">✓ Saved!</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
