'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';

const colorMap = {
  primary: {
    bg: 'bg-blue-50',
    icon: 'bg-[#0d6efd] text-white',
    value: 'text-[#0d6efd]',
  },
  success: {
    bg: 'bg-green-50',
    icon: 'bg-[#198754] text-white',
    value: 'text-[#198754]',
  },
  danger: {
    bg: 'bg-red-50',
    icon: 'bg-[#dc3545] text-white',
    value: 'text-[#dc3545]',
  },
  warning: {
    bg: 'bg-yellow-50',
    icon: 'bg-[#f59f00] text-white',
    value: 'text-[#f59f00]',
  },
};

export default function StatCard({ title, value, icon: Icon, color = 'primary', subtitle }) {
  const colors = colorMap[color] || colorMap.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={clsx(
        'bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_12px_0_rgba(13,110,253,0.07)] hover:shadow-[0_6px_24px_0_rgba(13,110,253,0.13)] transition-shadow duration-200',
        colors.bg
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{title}</p>
          <p className={clsx('text-3xl font-bold', colors.value)}>{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colors.icon)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
