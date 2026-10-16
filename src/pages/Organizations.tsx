import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useApp } from '../lib/store'
import { ghost, primary } from '../components/ui'
import Seo from '../components/Seo'

export default function Organizations() {
  const { db, say } = useApp()
  const [items, setItems] = useState<{ id: string; name: string; type: string; description: string }[]>([])
  useEffect(() => { api.publicOrganizations().then((r) => setItems(r.items)).catch((e: Error) => say(e.message)) }, [say])
  async function request(id: string) {
    try { await api.requestToJoin(id); say('Join request sent') } catch (e) { say((e as Error).message) }
  }
  const joined = new Set(db.orgs.filter((org) => !org.personal).map((org) => org.id))
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <Seo title="Explore organizations | OrbitDocs" description="Discover public OrbitDocs organizations and find communities to join." path="/organizations" />
      <Link to={db.signedIn ? '/app' : '/'} className="text-sm text-slate-500 hover:text-slate-900">{db.signedIn ? 'Back to workspace' : 'Back home'}</Link>
      <h1 className="mt-8 text-2xl font-semibold tracking-tight">Public organizations</h1>
      <p className="mt-2 text-sm text-slate-500">Discover communities and request to join.</p>
      <ul className="mt-8 divide-y divide-slate-100 rounded-2xl border border-slate-200">
        {items.map((o) => <li key={o.id} className="flex items-center gap-4 p-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft font-semibold text-brand">{o.name[0].toUpperCase()}</div>
          <div className="min-w-0 flex-1"><p className="font-medium">{o.name}</p><p className="text-sm text-slate-500">{o.description || o.type}</p></div>
          {joined.has(o.id)
            ? <span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">Joined</span>
            : <button className={primary} onClick={() => request(o.id)}>Request to join</button>}
        </li>)}
        {!items.length && <li className="p-8 text-center text-sm text-slate-400">No public organizations found.</li>}
      </ul>
      {!db.signedIn && <Link to="/signin" className={`${ghost} mt-8`}>Sign in</Link>}
    </div>
  )
}
