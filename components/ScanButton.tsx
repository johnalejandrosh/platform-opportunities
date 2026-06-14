'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ScanButton() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ newCount: number; sources: string[] } | null>(null);
  const router = useRouter();

  async function handleScan() {
    setScanning(true);
    setResult(null);
    try {
      const res = await fetch('/api/scan', { method: 'POST' });
      const data = await res.json();
      setResult({ newCount: data.newCount, sources: data.sources });
      router.refresh();
    } catch {
      setResult({ newCount: 0, sources: [] });
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className="text-sm text-emerald-400 font-medium">
          +{result.newCount} new from {result.sources.join(', ')}
        </span>
      )}
      <button
        onClick={handleScan}
        disabled={scanning}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {scanning ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Scanning…
          </>
        ) : (
          <>
            <span>⚡</span>
            Scan Now
          </>
        )}
      </button>
    </div>
  );
}
