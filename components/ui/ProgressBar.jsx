import clsx from 'clsx';

export default function ProgressBar({ value = 0, max = 100, label, showPercent = true, color = 'primary', className }) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  const colorMap = {
    primary: 'bg-[#0d6efd]',
    success: 'bg-[#198754]',
    warning: 'bg-[#f59f00]',
    danger: 'bg-[#dc3545]',
  };

  return (
    <div className={clsx('w-full', className)}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-gray-600">{label}</span>}
          {showPercent && (
            <span className="text-sm font-medium text-gray-800">
              {value} / {max} ({percent}%)
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={clsx('h-2.5 rounded-full transition-all duration-500', colorMap[color] || colorMap.primary)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
