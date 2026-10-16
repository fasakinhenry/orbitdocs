import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApp } from '../lib/store'
import { input, primary } from '../components/ui'

export default function Profile() {
  const { db, setDb, say } = useApp()
  const nav = useNavigate()
  const user = db.user!
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio ?? '')
  const [links, setLinks] = useState({ ...(user.socialLinks ?? {}) })
  const [publicProfile, setPublicProfile] = useState(user.profilePublic !== false)
  const [defaultView, setDefaultView] = useState<'list' | 'grid'>(user.defaultView ?? 'list')
  const [busy, setBusy] = useState(false)

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const r = await api.updateProfile({ name: name.trim(), bio: bio.trim(), socialLinks: links, profilePublic: publicProfile, defaultView })
      setDb({ ...db, user: r.user })
      say('Profile saved')
    } catch (e) { say((e as Error).message) } finally { setBusy(false) }
  }

  async function avatar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const r = await api.uploadAvatar(file)
      setDb({ ...db, user: r.user })
      say('Profile picture updated')
    } catch (x) { say((x as Error).message) }
  }

  async function removeAccount() {
    if (!window.confirm('This permanently deletes your profile, account, and personal workspace. Continue?')) return
    try {
      await api.deleteProfile()
      setDb(await api.signOut())
      nav('/')
    } catch (e) { say((e as Error).message) }
  }

  async function leaveOrganization(id: string, name: string) {
    if (!window.confirm(`Leave ${name}? You will lose access to its documents and members.`)) return
    try {
      localStorage.setItem('orbitdocs.org', id)
      setDb(await api.leaveOrg())
      say(`You left ${name}`)
    } catch (e) { say((e as Error).message) }
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-8 md:px-10">
      <button className="text-sm text-slate-500 hover:text-slate-900" onClick={() => nav('/app')}>Back to workspace</button>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-1.5 text-sm text-slate-500">Manage your public profile and social links.</p>
      <section className="mt-8 rounded-2xl border border-slate-200 p-5">
        <h2 className="font-semibold">Your organizations</h2>
        <p className="mt-1 text-sm text-slate-500">Switch between your personal workspace and the organizations you belong to.</p>
        <ul className="mt-4 space-y-2">
          {db.orgs.map((org) => (
            <li key={org.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-sm font-semibold text-brand">{org.name[0].toUpperCase()}</span>
              <button type="button" className="min-w-0 flex-1 truncate text-left text-sm font-medium hover:text-brand" onClick={async () => { setDb(await api.switchOrg(org.id)); nav('/app') }}>{org.name}</button>
              <span className="text-xs capitalize text-slate-400">{org.personal ? 'Personal' : org.role}</span>
              {!org.personal && org.role !== 'owner' && <button type="button" className="text-xs font-medium text-red-600 hover:text-red-700" onClick={() => void leaveOrganization(org.id, org.name)}>Leave</button>}
            </li>
          ))}
        </ul>
        <button type="button" className="mt-4 text-sm font-medium text-brand hover:text-brand-dark" onClick={() => nav('/organizations')}>Explore organizations</button>
      </section>
      <div className="mt-8 flex items-center gap-4">
        {user.avatarUrl
          ? <img src={user.avatarUrl} alt="" className="size-16 rounded-full object-cover" />
          : <span className="grid size-16 place-items-center rounded-full bg-slate-900 text-xl font-medium text-white">{user.name[0].toUpperCase()}</span>}
        <label className="cursor-pointer text-sm font-medium text-brand">Change picture<input type="file" accept="image/*" className="sr-only" onChange={avatar} /></label>
      </div>
      <form onSubmit={save} className="mt-8 space-y-5">
        <label className="block text-sm font-medium">Name<input value={name} onChange={(e) => setName(e.target.value)} className={`${input} mt-1.5`} /></label>
        <label className="block text-sm font-medium">Bio<textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className={`${input} mt-1.5 h-auto py-2.5`} /></label>
        {(['website', 'twitter', 'linkedin', 'instagram'] as const).map((key) => (
          <label key={key} className="block text-sm font-medium capitalize">{key}
            <input value={links[key] ?? ''} onChange={(e) => setLinks({ ...links, [key]: e.target.value })} placeholder={`https://${key}.com/...`} className={`${input} mt-1.5`} />
          </label>
        ))}
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={publicProfile} onChange={(e) => setPublicProfile(e.target.checked)} />Make my profile public</label>
        <label className="block text-sm font-medium">Default file view
          <select value={defaultView} onChange={(e) => setDefaultView(e.target.value as 'list' | 'grid')} className={`${input} mt-1.5`}>
            <option value="list">List / details</option>
            <option value="grid">Grid</option>
          </select>
        </label>
        <button disabled={busy} className={primary}>{busy ? 'Saving' : 'Save profile'}</button>
      </form>
      <section className="mt-14 border-t border-red-100 pt-8">
        <h2 className="text-base font-semibold text-red-700">Delete profile</h2>
        <p className="mt-1.5 text-sm text-slate-500">Permanently delete your account and personal workspace. You must delete organizations you own first.</p>
        <button type="button" className="mt-4 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50" onClick={removeAccount}>Delete my profile</button>
      </section>
    </div>
  )
}
