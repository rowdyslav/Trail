import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '../lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({
  children,
  className,
  variant = 'primary',
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-[1.25rem] px-5 py-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-emerald-300',
        variant === 'primary' &&
          'bg-gradient-to-br from-emerald-700 to-emerald-500 text-white shadow-[0_12px_32px_rgba(15,82,56,0.24)] hover:scale-[1.01]',
        variant === 'secondary' && 'bg-emerald-100 text-emerald-950 hover:bg-emerald-200',
        variant === 'ghost' && 'bg-transparent text-emerald-900 hover:bg-white/70',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
