import { useState } from 'react'
import { Link } from 'react-router-dom'

const KEY = 'orbitdocs.cookie-consent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(KEY))
  if (!visible) return null
  function accept() {
    localStorage.setItem(KEY, 'accepted')
    setVisible(false)
  }
  return (
    <aside role="dialog" aria-label="Cookie notice" aria-describedby="cookie-copy" className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl md:inset-x-auto md:left-6 md:max-w-md">
      <p className="text-sm font-semibold">A small note about cookies</p>
      <p id="cookie-copy" className="mt-1.5 text-sm leading-relaxed text-slate-500">OrbitDocs uses essential browser storage to keep you signed in and remember your workspace and preferences. See our <Link to="/cookies" className="font-medium text-brand hover:underline">Cookie policy</Link>.</p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <Link to="/privacy" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Privacy</Link>
        <button type="button" className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark" onClick={accept}>Got it</button>
      </div>
    </aside>
  )
}
