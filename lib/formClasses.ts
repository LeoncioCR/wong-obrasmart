export const inputClasses =
  "h-11 w-full rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export const textareaClasses =
  "w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export const labelClasses =
  "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export const errorClasses = "mt-1.5 text-sm text-red-600 dark:text-red-400";

export const fieldErrorClasses = (hasError: boolean) =>
  `${
    hasError
      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
      : "border-zinc-300 focus:border-red-600"
  }`;