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
  const [visibility, setVisibility] = useState<'public' | 'private'>(org.visibility ?? 'public')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [usage, setUsage] = useState<Usage>()
  const [members, setMembers] = useState<{ id: string; name: string }[]>([])
  const [folderId, setFolderId] = useState('')
  const [memberId, setMemberId] = useState('')
  const [permissions, setPermissions] = useState({ view: true, upload: false, edit: false, delete: false })
  useEffect(() => { api.usage().then(setUsage).catch(() => undefined) }, [])
  useEffect(() => { if (org.role !== 'member') api.members().then((x) => setMembers(x.members.map((m) => ({ id: m.id, name: m.name })))).catch(() => undefined) }, [org.role])

  async function save(e: FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) return setErr('Enter an organization name.')
    setBusy(true); setErr('')
    try { setDb(await api.updateOrg(name.trim(), desc.trim(), visibility)); say('Settings saved') } catch (x) { setErr((x as Error).message) } finally { setBusy(false) }
  }
  async function logo(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!f.type.startsWith('image/') || f.size > 1_000_000) return say('Choose an image under 1 MB.')
    try { setDb(await api.setLogo(f)); say('Logo updated') } catch (x) { say((x as Error).message) }
  }

  async function deleteOrganization() {
    if (!window.confirm(`This permanently deletes "${org.name}" and all of its files. Continue?`)) return
    try { setDb(await api.deleteOrg()); say('Organization deleted') } catch (x) { say((x as Error).message) }
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
        <label className="block text-sm font-medium">Organization visibility
          <select value={visibility} onChange={(e) => setVisibility(e.target.value as 'public' | 'private')} className={`${input} mt-1.5`}>
            <option value="public">Public - discoverable and open to join requests</option>
            <option value="private">Private - invite or join link only</option>
          </select>
        </label>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-slate-400">Type</dt><dd className="mt-1">{org.type}</dd></div>
          <div><dt className="text-slate-400">URL name</dt><dd className="mt-1">{org.slug}</dd></div>
        </dl>
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <button disabled={busy} className={primary}>{busy ? 'Saving' : 'Save changes'}</button>
      </form>
      {org.role !== 'member' && (
        <section className="mt-12 max-w-xl">
          <h2 className="text-base font-semibold">Folder access</h2>
          <p className="mt-1 text-sm text-slate-500">Set access limits for individual members.</p>
          <div className="mt-4 space-y-3">
            <select value={folderId} onChange={(e) => setFolderId(e.target.value)} className={input}>
              <option value="">Select a folder</option>
              {db.folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className={input}>
              <option value="">Select a member</option>
              {members.filter((m) => m.id !== db.user?.id).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {(['view', 'upload', 'edit', 'delete'] as const).map((key) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={permissions[key]} onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })} />{key}</label>)}
            </div>
            <button type="button" className={primary} disabled={!folderId || !memberId} onClick={() => api.setFolderAccess(folderId, { userId: memberId, ...permissions }).then(() => say('Folder access updated')).catch((e: Error) => say(e.message))}>Save folder access</button>
          </div>
        </section>
      )}
      {org.role === 'owner' && (
        <section className="mt-14 max-w-xl border-t border-red-100 pt-8">
          <h2 className="text-base font-semibold text-red-700">Delete organization</h2>
          <p className="mt-1.5 text-sm text-slate-500">Permanently delete this organization and all of its folders, files, members, and invitations.</p>
          <button type="button" className="mt-4 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50" onClick={deleteOrganization}>Delete organization</button>
        </section>
      )}
    </div>
  )
}
