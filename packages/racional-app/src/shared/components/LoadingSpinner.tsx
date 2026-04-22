export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'w-4 h-4', md: 'w-7 h-7', lg: 'w-11 h-11' }
  return (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-slate-200 dark:border-gray-700 border-t-brand-400`}
    />
  )
}
