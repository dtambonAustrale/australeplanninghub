import clsx from 'clsx';

const variants = {
  primary: 'bg-[#0d6efd] hover:bg-blue-700 text-white border-transparent shadow-sm',
  success: 'bg-[#198754] hover:bg-green-700 text-white border-transparent shadow-sm',
  danger: 'bg-[#dc3545] hover:bg-red-700 text-white border-transparent shadow-sm',
  outline: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-2 font-medium rounded-xl border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#0d6efd]',
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        (disabled || loading) && 'opacity-60 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
