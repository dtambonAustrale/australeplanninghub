'use client';

import { RefreshCw } from 'lucide-react';

export default function Header({ title, onSync, syncing }) {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{title || 'Assiduity'}</h1>
          <p className="text-xs text-gray-500">
            {process.env.NEXT_PUBLIC_ORGANIZATION_NAME || 'Australe Formation'}
          </p>
        </div>
        {onSync && (
          <button
            onClick={onSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-[#0d6efd] text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Synchronisation…' : 'Synchroniser'}
          </button>
        )}
      </div>
    </header>
  );
}
