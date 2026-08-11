import type { ReactNode } from "react";

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-zinc-500 dark:text-zinc-400"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

type LoadingStateProps = {
  message: string;
};

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
      <Spinner />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
    </div>
  );
}

type EmptyStateProps = {
  message: string;
  primaryCta?: ReactNode;
  secondaryCta?: ReactNode;
};

export function EmptyState({ message, primaryCta, secondaryCta }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <svg
        className="h-10 w-10 text-zinc-300 dark:text-zinc-700"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 13h6m-6-4h6m2 11H7a2 2 0 01-2-2V5a2 2 0 012-2h6l6 6v11a2 2 0 01-2 2z"
        />
      </svg>
      <p className="max-w-xs text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
      {(primaryCta || secondaryCta) && (
        <div className="flex w-full max-w-xs flex-col gap-2">
          {primaryCta}
          {secondaryCta}
        </div>
      )}
    </div>
  );
}

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
      <p role="alert" className="max-w-xs text-sm text-red-600 dark:text-red-400">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          ลองใหม่อีกครั้ง
        </button>
      )}
    </div>
  );
}
