import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

const base = 'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-60'
export const primary = `${base} bg-brand text-white hover:bg-brand-dark`
export const ghost = `${base} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`
export const input = 'h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm placeholder:text-slate-400 hover:border-slate-300 focus:border-brand'

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#287BFF" />
      <path d="M12 9h6.5l3.5 3.5V22a1 1 0 0 1-1 1H12a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1z" fill="#fff" />
      <ellipse cx="16" cy="16" rx="11" ry="4.4" transform="rotate(-32 16 16)" fill="none" stroke="#fff" strokeWidth="1.6" strokeDasharray="14 40" strokeDashoffset="-6" />
    </svg>
  )
}

export function Menu({ label, className, panel = 'right-0 mt-2', onOpen, children }: {
  label: ReactNode; className: string; panel?: string; onOpen?: () => void; children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const click = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', click)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', click); document.removeEventListener('keydown', key) }
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button type="button" className={className} aria-haspopup="menu" aria-expanded={open} onClick={() => { if (!open) onOpen?.(); setOpen(!open) }}>{label}</button>
      {open && (
        <div role="menu" className={`absolute z-30 min-w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-lg ${panel}`}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function MenuItem({ icon, danger, onClick, children }: { icon: ReactNode; danger?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button role="menuitem" type="button" onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-slate-50 ${danger ? 'text-red-600' : 'text-slate-700'}`}>
      {icon}{children}
    </button>
  )
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/30 p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function AuthShell({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-12">
      <Link to="/" className="mb-10 flex items-center gap-2.5 font-semibold"><Logo />OrbitDocs</Link>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {sub && <p className="mt-2 text-sm text-slate-500">{sub}</p>}
      {children}
    </div>
  )
}
