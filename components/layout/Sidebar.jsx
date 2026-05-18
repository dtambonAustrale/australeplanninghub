'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, CalendarCheck, Bell, RefreshCw, Database } from 'lucide-react';
import clsx from 'clsx';

const nav = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Planning', href: '/#planning', icon: CalendarCheck },
  { label: 'Relances', href: '/#reminders', icon: Bell },
  { label: 'Synchronisation', href: '/#sync', icon: RefreshCw },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed inset-y-0 left-0 w-64 flex flex-col z-30"
      style={{ backgroundColor: '#071525' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-xl bg-[#0d6efd] flex items-center justify-center">
          <Database className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">
            {process.env.NEXT_PUBLIC_APP_NAME || 'Assiduity'}
          </p>
          <p className="text-white/50 text-xs leading-tight">
            {process.env.NEXT_PUBLIC_ORGANIZATION_NAME || 'Australe Formation'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#0d6efd] text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-white/30 text-xs">v0.1.0 — Assiduity</p>
      </div>
    </aside>
  );
}
