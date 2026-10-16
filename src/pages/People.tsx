import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from '@phosphor-icons/react'
import { api, type Invite, type JoinLink, type Member, type Role } from '../lib/api'
import { useApp } from '../lib/store'
import { ghost, input, primary } from '../components/ui'

const ROLE_LABEL: Record<Role, string> = { owner: 'Owner', admin: 'Admin', member: 'Member' }

export default function People() {
  const { db, setDb, say } = useApp()
  const nav = useNavigate()
  const org = db.org!
  const me = db.user!
  const admin = org.role !== 'member'
  const owner = org.role === 'owner'
  const [data, setData] = useState<{ members: Member[]; invites: Invite[] }>()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [links, setLinks] = useState<JoinLink[]>([])
  const [days, setDays] = useState('7')
  const [requests, setRequests] = useState<{ id: string; name: string; username: string }[]>([])
  const [suggestions, setSuggestions] = useState<{ name: string; username: string; email: string }[]>([])

  const load = useCallback(() => {
    if (admin) api.links().then((r) => setLinks(r.items)).catch(() => undefined)
    if (admin) api.requests().then((r) => setRequests(r.items)).catch(() => undefined)
    return api.members().then(setData).catch((e: Error) => say(e.message))
  }, [say, admin])
  useEffect(() => { load() }, [load])

  async function act(fn: () => Promise<unknown>, ok: string) {
    try { await fn(); say(ok); await load() } catch (e) { say((e as Error).message) }
  }
  async function leave() {
    if (org.role === 'owner') return say('The organization owner cannot leave.')
    if (!window.confirm(`Leave ${org.name}? You will need a new invitation or join link to return.`)) return
    try { setDb(await api.leaveOrg()); nav('/app'); say(`You left ${org.name}`) } catch (e) { say((e as Error).message) }
  }
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    const to = String(f.get('to')).trim()
    const isEmail = to.includes('@') && !to.startsWith('@')
    if (isEmail ? !/^\S+@\S+\.\S+$/.test(to) : !/^@?[a-zA-Z0-9_]{3,20}$/.test(to)) return setErr('Enter an email address or a username.')
    setBusy(true); setErr('')
    try {
      const result = await api.invite(isEmail ? { email: to } : { username: to.replace(/^@/, '') }, String(f.get('role')) as 'admin' | 'member')
      form.reset()
      say(result.emailSent === false
        ? `Invite successful, but email delivery failed. They can accept it in OrbitDocs.`
        : `Invitation sent to ${isEmail ? to : `@${to.replace(/^@/, '')}`}`)
      await load()
    } catch (x) { setErr((x as Error).message) } finally { setBusy(false) }
  }
  function search(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.trim()
    if (value.length < 2) return setSuggestions([])
    api.memberSearch(value).then((r) => setSuggestions(r.items)).catch(() => setSuggestions([]))
  }

  return (
    <div className="px-4 pb-28 pt-8 md:px-10">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">People</h1>
      <div className="mt-1.5 flex flex-wrap items-center gap-3">
        <p className="text-sm text-slate-500">{org.name}{org.description ? ` · ${org.description}` : ''}</p>
        {!owner && <button className="text-sm font-medium text-red-600 hover:text-red-700" onClick={() => void leave()}>Leave organization</button>}
      </div>

      {admin && (
        <form onSubmit={send} className="mt-10 max-w-2xl" noValidate>
          <h2 className="mb-3 text-sm font-medium text-slate-500">Invite someone</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:flex-1">
              <input name="to" autoCapitalize="none" placeholder="Email or @username" aria-label="Email or username" onChange={search} className={`${input} w-full`} />
              {suggestions.length > 0 && <ul className="absolute left-0 right-0 top-12 z-10 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">{suggestions.map((s) => <li key={s.email}><button type="button" className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50" onClick={(e) => { const input = e.currentTarget.form?.elements.namedItem('to') as HTMLInputElement | null; if (input) { input.value = s.email }; setSuggestions([]) }}>{s.name} <span className="text-slate-400">@{s.username} · {s.email}</span></button></li>)}</ul>}
            </div>
            <select name="role" aria-label="Role" className={`${input} sm:w-36`}>
              <option value="member">Member</option>
              {owner && <option value="admin">Admin</option>}
            </select>
            <button disabled={busy} className={`${primary} h-11`}>{busy ? 'Sending' : 'Send invite'}</button>
          </div>
          {err && <p role="alert" className="mt-2 text-sm text-red-600">{err}</p>}
        </form>
      )}

      {admin && (
        <section className="mt-10 max-w-2xl">
          <h2 className="mb-1 text-sm font-medium text-slate-500">Invite link</h2>
          <p className="mb-3 text-sm text-slate-500">Anyone with the link can join as a member. Good for group chats.</p>
          <div className="flex gap-2">
            <select aria-label="Link expiry" value={days} onChange={(e) => setDays(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
              <option value="1">Expires in 1 day</option><option value="7">Expires in 7 days</option><option value="30">Expires in 30 days</option>
            </select>
            <button className={ghost} onClick={() => act(() => api.createLink(Number(days)), 'Link created')}>Create link</button>
          </div>
          {links.length > 0 && (
            <ul className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200">
              {links.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{l.url}</p>
                    <p className="text-xs text-slate-400">{l.uses} joined, expires {new Date(l.expires).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <button className="text-sm font-medium text-brand" onClick={() => navigator.clipboard.writeText(l.url).then(() => say('Link copied'), () => say('Copy failed. Select the link and copy it.'))}>Copy</button>
                  <button className="text-sm font-medium text-slate-500 hover:text-red-600" onClick={() => act(() => api.revokeLink(l.id), 'Link revoked')}>Revoke</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="mt-10 max-w-2xl">
        <h2 className="mb-3 text-sm font-medium text-slate-500">{data ? `${data.members.length} ${data.members.length === 1 ? 'member' : 'members'}` : 'Members'}</h2>
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
          {!data && <li className="px-4 py-6 text-sm text-slate-400">Loading</li>}
          {data?.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-medium">{m.name[0].toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.name}{m.id === me.id && <span className="ml-2 text-xs font-normal text-slate-400">You</span>}</p>
                <p className="truncate text-xs text-slate-400">@{m.username}{m.email ? ` \u00b7 ${m.email}` : ''}</p>
              </div>
              {admin && m.role !== 'owner' ? (
                <select aria-label={`Role for ${m.name}`} value={m.role} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
                  onChange={(e) => act(() => api.setRole(m.id, e.target.value as 'admin' | 'member'), 'Role updated')}>
                  <option value="member">Member</option>
                  {(owner || m.role === 'member') && <option value="admin">Admin</option>}
                </select>
              ) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{ROLE_LABEL[m.role]}</span>
              )}
              {admin && m.role !== 'owner' && m.id !== me.id && (owner || m.role === 'member') && (
                <button aria-label={`Remove ${m.name}`} className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-red-600"
                  onClick={() => { if (window.confirm(`Remove ${m.name} from ${org.name}?`)) act(() => api.removeMember(m.id), 'Member removed') }}>
                  <X size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {admin && data && data.invites.length > 0 && (
        <section className="mt-10 max-w-2xl">
          <h2 className="mb-3 text-sm font-medium text-slate-500">Pending invitations</h2>
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {data.invites.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{i.to}</p>
                  <p className="text-xs text-slate-400">{i.role === 'admin' ? 'Admin' : 'Member'}, expires {new Date(i.expires).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                </div>
                <button className="text-sm font-medium text-slate-500 hover:text-red-600" onClick={() => act(() => api.revokeInvite(i.id), 'Invitation revoked')}>Revoke</button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {admin && requests.length > 0 && (
        <section className="mt-10 max-w-2xl">
          <h2 className="mb-3 text-sm font-medium text-slate-500">Join requests</h2>
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {requests.map((r) => <li key={r.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{r.name}</p><p className="text-xs text-slate-400">@{r.username}</p></div>
              <button className="text-sm font-medium text-brand" onClick={() => act(() => api.decideRequest(r.id, 'approved'), 'Request approved')}>Approve</button>
              <button className="text-sm text-slate-500 hover:text-red-600" onClick={() => act(() => api.decideRequest(r.id, 'rejected'), 'Request declined')}>Decline</button>
            </li>)}
          </ul>
        </section>
      )}
    </div>
  )
}
