import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { api, type Usage } from '../lib/api'
import { useApp } from '../lib/store'
import { fmtSize } from '../lib/util'
import { input, primary } from '../components/ui'

export default function Settings() {
  const { db, setDb, say } = useApp()
  const org = db.org!
  const [name, setName] = useState(org.name)
  const [desc, setDesc] = useState(org.description ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [usage, setUsage] = useState<Usage>()
  useEffect(() => { api.usage().then(setUsage).catch(() => undefined) }, [])

  async function save(e: FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) return setErr('Enter an organization name.')
    setBusy(true); setErr('')
    try { setDb(await api.updateOrg(name.trim(), desc.trim())); say('Settings saved') } catch (x) { setErr((x as Error).message) } finally { setBusy(false) }
  }
  async function logo(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!f.type.startsWith('image/') || f.size > 1_000_000) return say('Choose an image under 1 MB.')
    try { setDb(await api.setLogo(f)); say('Logo updated') } catch (x) { say((x as Error).message) }
  }

  return (
    <div className="px-4 pb-28 pt-8 md:px-10">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Settings</h1>
      <p className="mt-1.5 text-sm text-slate-500">{org.name}</p>
      <div className="mt-10 flex max-w-xl items-center gap-4">
        {org.logoUrl
          ? <img src={org.logoUrl} alt="" className="size-16 rounded-2xl object-cover" />
          : <div className="grid size-16 place-items-center rounded-2xl bg-brand-soft text-xl font-semibold text-brand">{org.name[0].toUpperCase()}</div>}
        <label className="cursor-pointer text-sm font-medium text-brand">Change logo<input type="file" accept="image/*" className="sr-only" onChange={logo} /></label>
      </div>
      {usage && (
        <div className="mt-8 max-w-xl">
          <div className="flex justify-between text-sm"><span className="font-medium">Storage</span><span className="text-slate-500">{fmtSize(usage.used)} of {fmtSize(usage.quota)}</span></div>
          <div className="mt-2 h-2 rounded-full bg-slate-100"><div className={`h-full rounded-full ${usage.used / usage.quota > 0.9 ? 'bg-red-500' : 'bg-brand'}`} style={{ width: `${Math.min(100, (usage.used / usage.quota) * 100)}%` }} /></div>
          <p className="mt-2 text-xs text-slate-400">Files in the trash still count until you delete them forever. Each file can be up to {fmtSize(usage.maxFileBytes)}.</p>
        </div>
      )}
      <form onSubmit={save} className="mt-8 max-w-xl space-y-5" noValidate>
        <label className="block text-sm font-medium">Organization name<input value={name} onChange={(e) => setName(e.target.value)} className={`${input} mt-1.5`} /></label>
        <label className="block text-sm font-medium">Description<textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className={`${input} mt-1.5 h-auto py-2.5`} /></label>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-slate-400">Type</dt><dd className="mt-1">{org.type}</dd></div>
          <div><dt className="text-slate-400">URL name</dt><dd className="mt-1">{org.slug}</dd></div>
        </dl>
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <button disabled={busy} className={primary}>{busy ? 'Saving' : 'Save changes'}</button>
      </form>
    </div>
  )
}
