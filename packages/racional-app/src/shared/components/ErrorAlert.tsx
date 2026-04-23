interface Props {
  message: string
}

export default function ErrorAlert({ message }: Props) {
  return (
    <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-3">
      <svg
        className="shrink-0 mt-0.5 text-red-500 dark:text-red-400"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className="text-sm text-red-600 dark:text-red-400 leading-snug">{message}</p>
    </div>
  )
}
