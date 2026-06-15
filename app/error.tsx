'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-6">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-white text-xl font-bold">Algo salió mal</h2>
      <p className="text-slate-400 text-sm max-w-sm">
        {error.message || 'Ocurrió un error inesperado. Intenta de nuevo.'}
      </p>
      <button
        onClick={unstable_retry}
        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
