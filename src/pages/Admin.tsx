import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { DotsThree } from '@phosphor-icons/react'
import { api, type AdminLogItem, type AdminOrg, type AdminStats, type AdminUser, type PlatformSettings } from '../lib/api'
import { useApp } from '../lib/store'
import { fmtSize } from '../lib/util'
import { Logo, Menu, MenuItem, Modal, ghost, input, primary } from '../components/ui'

const TABS = [['overview', 'Overview'], ['orgs', 'Workspaces'], ['users', 'Users'], ['settings', 'Platform settings'], ['log', 'Admin log']] as const
type Tab = (typeof TABS)[number][0]
const date = (s: string) => new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

export default function Admin() {
  const { db } = useApp()
  const [tab, setTab] = useState<Tab>('overview')
  if (!db.user?.isAdmin) {
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div><p className="text-5xl font-semibold">404</p><p className="mt-3 text-slate-500">This page does not exist.</p><Link to="/" className={`${ghost} mt-8`}>Go home</Link></div>
      </div>
    )
  }
  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 pb-20 md:px-8">
      <header className="flex items-center justify-between py-5">
        <span className="flex items-center gap-2.5 font-semibold"><Logo />OrbitDocs <span className="font-normal text-slate-400">Admin</span></span>
        <Link to={db.org ? '/app' : '/'} className="text-sm text-slate-500 hover:text-slate-900">Back to workspace</Link>
      </header>
      <nav className="-mx-4 flex gap-1 overflow-x-auto border-b border-slate-100 px-4 md:mx-0 md:px-0" aria-label="Admin sections">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} aria-current={tab === k ? 'page' : undefined}
            className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium ${tab === k ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>{label}</button>
        ))}
      </nav>
      <div className="mt-8">
        {tab === 'overview' && <Overview />}
        {tab === 'orgs' && <Orgs />}
        {tab === 'users' && <Users />}
        {tab === 'settings' && <SettingsTab />}
        {tab === 'log' && <Log />}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p></div>
}

function Bars({ title, data }: { title: string; data: { day: string; n: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.n))
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <h3 className="text-sm font-medium">{title} <span className="font-normal text-slate-400">last 7 days</span></h3>
      <div className="mt-4 flex items-end gap-2">
        {data.map((d) => (
          <div key={d.day} className="flex flex-1 flex-col items-center gap-1" title={`${d.day}: ${d.n}`}>
            <span className="text-xs text-slate-500">{d.n}</span>
            <div className="w-full rounded-t bg-brand/70" style={{ height: `${Math.max(3, Math.round((d.n / max) * 72))}px` }} />
            <span className="text-[10px] text-slate-400">{d.day.slice(8)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Overview() {
  const { say } = useApp()
  const [s, setS] = useState<AdminStats>()
  useEffect(() => { api.admin.stats().then(setS).catch((e: Error) => say(e.message)) }, [say])
  if (!s) return <p className="text-sm text-slate-400">Loading</p>
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Users" value={String(s.users)} /><Stat label="Workspaces" value={String(s.orgs)} />
        <Stat label="Files" value={String(s.files)} /><Stat label="Storage used" value={fmtSize(s.bytes)} />
      </div>
      <p className="text-sm text-slate-500">Storage provider: <span className="font-medium text-slate-900">{s.storage.provider}</span>, bucket {s.storage.bucket}. Default quota {s.settings.defaultQuotaMB} MB per workspace, {s.settings.maxFileMB} MB per file, sign ups {s.settings.registrationOpen ? 'open' : 'closed'}.</p>
      <div className="grid gap-3 md:grid-cols-2"><Bars title="New users" data={s.signups} /><Bars title="Uploads" data={s.uploads} /></div>
      <section>
        <h3 className="mb-3 text-sm font-medium text-slate-500">Largest workspaces</h3>
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
          {s.top.length === 0 && <li className="px-4 py-6 text-sm text-slate-400">No files yet.</li>}
          {s.top.map((t) => <li key={t.id} className="flex justify-between px-4 py-3 text-sm"><span>{t.name}</span><span className="text-slate-500">{fmtSize(t.bytes)}</span></li>)}
        </ul>
      </section>
    </div>
  )
}

function Badge({ tone, children }: { tone: 'green' | 'red' | 'amber' | 'gray'; children: ReactNode }) {
  const c = { green: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-700', amber: 'bg-amber-50 text-amber-700', gray: 'bg-slate-100 text-slate-600' }[tone]
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${c}`}>{children}</span>
}

function Frame({ q, setQ, page, setPage, total, children }: { q: string; setQ: (s: string) => void; page: number; setPage: (n: number) => void; total: number; children: ReactNode }) {
  return (
    <div>
      <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Search" aria-label="Search" className={`${input} mb-4 max-w-sm`} />
      <div className="overflow-x-auto rounded-2xl border border-slate-200">{children}</div>
      <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
        <span>{total} total</span>
        <span className="flex gap-2">
          <button className={ghost} disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <button className={ghost} disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>Next</button>
        </span>
      </div>
    </div>
  )
}
const th = 'whitespace-nowrap px-4 py-3 font-medium'
const td = 'px-4 py-3 align-middle'

function Orgs() {
  const { say } = useApp()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ items: AdminOrg[]; total: number }>()
  const [quotaFor, setQuotaFor] = useState<AdminOrg | null>(null)
  const load = useCallback(() => api.admin.orgs(q, page).then(setData).catch((e: Error) => say(e.message)), [q, page, say])
  useEffect(() => { const t = window.setTimeout(load, 200); return () => window.clearTimeout(t) }, [load])

  async function act(fn: () => Promise<unknown>, ok: string) {
    try { await fn(); say(ok); await load() } catch (e) { say((e as Error).message) }
  }
  async function saveQuota(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const mb = Number(new FormData(e.currentTarget).get('mb'))
    if (!Number.isInteger(mb) || mb < 1) return say('Enter a whole number of MB.')
    const id = quotaFor!.id
    setQuotaFor(null)
    await act(() => api.admin.patchOrg(id, { quotaMB: mb }), 'Storage limit updated')
  }

  return (
    <Frame q={q} setQ={setQ} page={page} setPage={setPage} total={data?.total ?? 0}>
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className={th}>Workspace</th><th className={th}>Owner</th><th className={th}>Members</th><th className={th}>Files</th><th className={th}>Storage</th><th className={th}>Status</th><th className="w-12" /></tr></thead>
        <tbody>
          {!data && <tr><td colSpan={7} className="px-4 py-6 text-slate-400">Loading</td></tr>}
          {data?.items.map((o) => {
            const pct = Math.min(100, Math.round((o.bytes / o.quotaBytes) * 100))
            return (
              <tr key={o.id} className="border-t border-slate-100">
                <td className={td}><p className="font-medium">{o.name}</p><p className="text-xs text-slate-400">{o.slug}, created {date(o.createdAt)}</p></td>
                <td className={td}>{o.owner ? <><p>{o.owner.name}</p><p className="text-xs text-slate-400">@{o.owner.username}</p></> : '-'}</td>
                <td className={td}>{o.members}</td>
                <td className={td}>{o.files}</td>
                <td className={td}>
                  <div className="w-40"><div className="h-1.5 rounded-full bg-slate-100"><div className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : 'bg-brand'}`} style={{ width: `${pct}%` }} /></div>
                    <p className="mt-1 text-xs text-slate-500">{fmtSize(o.bytes)} of {fmtSize(o.quotaBytes)}{o.customQuota ? ' (custom)' : ''}</p></div>
                </td>
                <td className={td}>{o.suspended ? <Badge tone="red">Suspended</Badge> : <Badge tone="green">Active</Badge>}</td>
                <td className="px-2 py-2">
                  <Menu className="grid size-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" label={<DotsThree size={22} weight="bold" />}>
                    {(close) => <>
                      <MenuItem icon={null} onClick={() => { close(); act(() => api.admin.patchOrg(o.id, { suspended: !o.suspended }), o.suspended ? 'Workspace restored' : 'Workspace suspended') }}>{o.suspended ? 'Unsuspend' : 'Suspend'}</MenuItem>
                      <MenuItem icon={null} onClick={() => { close(); setQuotaFor(o) }}>Set storage limit</MenuItem>
                      {o.customQuota && <MenuItem icon={null} onClick={() => { close(); act(() => api.admin.patchOrg(o.id, { quotaMB: null }), 'Using the default limit') }}>Use default limit</MenuItem>}
                      <MenuItem icon={null} danger onClick={() => { close(); if (window.prompt(`This permanently deletes the workspace and all its files.\nType "${o.name}" to confirm.`) === o.name) act(() => api.admin.deleteOrg(o.id), 'Workspace deleted') }}>Delete workspace</MenuItem>
                    </>}
                  </Menu>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {quotaFor && (
        <Modal title={`Storage limit for ${quotaFor.name}`} onClose={() => setQuotaFor(null)}>
          <form onSubmit={saveQuota} className="mt-4">
            <label className="block text-sm font-medium">Limit in MB<input name="mb" type="number" min={1} defaultValue={Math.round(quotaFor.quotaBytes / 1048576)} className={`${input} mt-1.5`} /></label>
            <div className="mt-5 flex justify-end gap-2"><button type="button" className={ghost} onClick={() => setQuotaFor(null)}>Cancel</button><button className={primary}>Save</button></div>
          </form>
        </Modal>
      )}
    </Frame>
  )
}

function Users() {
  const { say, db } = useApp()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ items: AdminUser[]; total: number }>()
  const load = useCallback(() => api.admin.users(q, page).then(setData).catch((e: Error) => say(e.message)), [q, page, say])
  useEffect(() => { const t = window.setTimeout(load, 200); return () => window.clearTimeout(t) }, [load])
  async function act(fn: () => Promise<unknown>, ok: string) {
    try { await fn(); say(ok); await load() } catch (e) { say((e as Error).message) }
  }
  return (
    <Frame q={q} setQ={setQ} page={page} setPage={setPage} total={data?.total ?? 0}>
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className={th}>User</th><th className={th}>Email</th><th className={th}>Workspaces</th><th className={th}>Joined</th><th className={th}>Status</th><th className="w-12" /></tr></thead>
        <tbody>
          {!data && <tr><td colSpan={6} className="px-4 py-6 text-slate-400">Loading</td></tr>}
          {data?.items.map((u) => (
            <tr key={u.id} className="border-t border-slate-100">
              <td className={td}><p className="font-medium">{u.name}</p><p className="text-xs text-slate-400">@{u.username}</p></td>
              <td className={td}><p>{u.email}</p>{!u.emailVerified && <p className="text-xs text-amber-600">Not verified</p>}</td>
              <td className={td}>{u.workspaces}</td>
              <td className={`${td} whitespace-nowrap text-slate-500`}>{date(u.createdAt)}</td>
              <td className={td}>{u.suspended ? <Badge tone="red">Suspended</Badge> : <Badge tone="green">Active</Badge>}</td>
              <td className="px-2 py-2">
                {u.id !== db.user!.id && (
                  <Menu className="grid size-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" label={<DotsThree size={22} weight="bold" />}>
                    {(close) => <>
                      <MenuItem icon={null} onClick={() => { close(); act(() => api.admin.patchUser(u.id, { suspended: !u.suspended }), u.suspended ? 'User restored' : 'User suspended') }}>{u.suspended ? 'Unsuspend' : 'Suspend'}</MenuItem>
                      {!u.emailVerified && <MenuItem icon={null} onClick={() => { close(); act(() => api.admin.patchUser(u.id, { emailVerified: true }), 'Marked as verified') }}>Mark email verified</MenuItem>}
                      <MenuItem icon={null} danger onClick={() => { close(); if (window.confirm(`Delete @${u.username} permanently?`)) act(() => api.admin.deleteUser(u.id), 'User deleted') }}>Delete user</MenuItem>
                    </>}
                  </Menu>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  )
}

function SettingsTab() {
  const { say } = useApp()
  const [s, setS] = useState<PlatformSettings>()
  const [busy, setBusy] = useState(false)
  useEffect(() => { api.admin.settings().then(setS).catch((e: Error) => say(e.message)) }, [say])
  if (!s) return <p className="text-sm text-slate-400">Loading</p>
  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try { setS(await api.admin.saveSettings(s!)); say('Settings saved') } catch (x) { say((x as Error).message) } finally { setBusy(false) }
  }
  return (
    <form onSubmit={save} className="max-w-md space-y-5">
      <label className="block text-sm font-medium">Default storage per workspace (MB)
        <input type="number" min={1} value={s.defaultQuotaMB} onChange={(e) => setS({ ...s, defaultQuotaMB: Number(e.target.value) })} className={`${input} mt-1.5`} />
      </label>
      <label className="block text-sm font-medium">Largest allowed file (MB, up to 50)
        <input type="number" min={1} max={50} value={s.maxFileMB} onChange={(e) => setS({ ...s, maxFileMB: Number(e.target.value) })} className={`${input} mt-1.5`} />
      </label>
      <label className="flex items-center gap-3 text-sm font-medium">
        <input type="checkbox" checked={s.registrationOpen} onChange={(e) => setS({ ...s, registrationOpen: e.target.checked })} className="size-4 accent-brand" />
        Allow new sign ups
      </label>
      <p className="text-sm text-slate-500">Changing the default only affects workspaces without a custom limit. Turn sign ups off to stop new accounts while keeping existing ones working.</p>
      <button disabled={busy} className={primary}>{busy ? 'Saving' : 'Save settings'}</button>
    </form>
  )
}

function Log() {
  const { say } = useApp()
  const [items, setItems] = useState<AdminLogItem[]>()
  useEffect(() => { api.admin.log().then((r) => setItems(r.items)).catch((e: Error) => say(e.message)) }, [say])
  return (
    <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
      {!items && <li className="px-4 py-6 text-sm text-slate-400">Loading</li>}
      {items?.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">No admin actions yet.</li>}
      {items?.map((l) => (
        <li key={l.id} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
          <p className="min-w-0 break-words"><span className="font-medium">{l.action}</span> <span className="text-slate-400">{l.detail}</span></p>
          <time className="shrink-0 text-xs text-slate-400" dateTime={l.at}>{date(l.at)}</time>
        </li>
      ))}
    </ul>
  )
}
