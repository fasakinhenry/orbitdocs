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
  const [busy, setBusy] = useState(false)

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const r = await api.updateProfile({ name: name.trim(), bio: bio.trim(), socialLinks: links, profilePublic })
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

  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-8 md:px-10">
      <button className="text-sm text-slate-500 hover:text-slate-900" onClick={() => nav('/app')}>Back to workspace</button>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-1.5 text-sm text-slate-500">Manage your public profile and social links.</p>
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
        <button disabled={busy} className={primary}>{busy ? 'Saving' : 'Save profile'}</button>
      </form>
    </div>
  )
}
