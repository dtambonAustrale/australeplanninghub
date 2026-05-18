import clsx from 'clsx';

const colorMap = {
  success: 'bg-green-100 text-green-800 border-green-200',
  danger: 'bg-red-100 text-red-800 border-red-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  primary: 'bg-blue-100 text-blue-800 border-blue-200',
  default: 'bg-gray-100 text-gray-700 border-gray-200',
};

export default function Badge({ children, color = 'default', className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        colorMap[color] || colorMap.default,
        className
      )}
    >
      {children}
    </span>
  );
}
