import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowCounterClockwise, CaretDown, Clock, DotsThree, FileDoc, FileImage, FilePdf, FilePpt, FileText, FileVideo, FileXls,
  Files, FolderPlus, FolderSimple, List, MagnifyingGlass, Plus, SignOut, Star, Trash, UploadSimple, X, DownloadSimple, UsersThree, GearSix, ShieldCheck, Eye, CaretUpDown, Check, PaperPlaneTilt, CheckCircle, ArrowUUpLeft, Pulse, type Icon,
} from '@phosphor-icons/react'
import { api, type Doc, type Status } from '../lib/api'
import { useApp } from '../lib/store'
import { ago, fmtSize } from '../lib/util'
import People from './People'
import Activity from './Activity'
import Settings from './Settings'
import Notifications from '../components/Notifications'
import Preview from '../components/Preview'
import { Logo, Menu, MenuItem, Modal, ghost, input, primary } from '../components/ui'

const VIEWS = { all: 'Documents', recent: 'Recent', starred: 'Starred', people: 'People', approvals: 'Approvals', activity: 'Activity', trash: 'Trash', settings: 'Settings' } as const
type View = keyof typeof VIEWS
const NAV: [View, Icon][] = [['all', Files], ['recent', Clock], ['starred', Star], ['people', UsersThree], ['approvals', CheckCircle], ['activity', Pulse], ['trash', Trash], ['settings', GearSix]]
const ADMIN_ONLY: View[] = ['trash', 'approvals', 'activity', 'settings']
type SortKey = 'name' | 'modified' | 'size'

const BADGE: Record<Status, string> = {
  approved: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  draft: 'bg-slate-100 text-slate-600',
}

function FileIcon({ name, size = 22 }: { name: string; size?: number }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const map: [string[], Icon, string][] = [
    [['pdf'], FilePdf, 'text-red-500'], [['doc', 'docx'], FileDoc, 'text-brand'], [['xls', 'xlsx', 'csv'], FileXls, 'text-emerald-600'],
    [['ppt', 'pptx'], FilePpt, 'text-orange-500'], [['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'], FileImage, 'text-violet-500'], [['mp4', 'mov', 'webm'], FileVideo, 'text-pink-500'],
  ]
  const [, I, c] = map.find(([e]) => e.includes(ext)) ?? [[], FileText, 'text-slate-500']
  return <I size={size} className={`shrink-0 ${c}`} />
}

export default function Dashboard() {
  const { db, setDb, say } = useApp()
  const nav = useNavigate()
  const { view: v } = useParams()
  const admin = db.org!.role !== 'member'
  const view = (v && v in VIEWS && (!ADMIN_ONLY.includes(v as View) || admin) ? v : 'all') as View
  const bare = view === 'people' || view === 'activity' || view === 'settings'
  const [sp, setSp] = useSearchParams()
  const folderId = sp.get('folder') ?? ''
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: 'modified', dir: -1 })
  const [sel, setSel] = useState<string[]>([])
  const [drawer, setDrawer] = useState(false)
  const [folderModal, setFolderModal] = useState(false)
  const [folderErr, setFolderErr] = useState('')
  const [preview, setPreview] = useState<Doc | null>(null)
  const [shown, setShown] = useState(50)
  const file = useRef<HTMLInputElement>(null)
  const org = db.org!
  const user = db.user!
  const folderName = (id: string) => db.folders.find((f) => f.id === id)?.name ?? 'Unsorted'
  const live = db.docs.filter((d) => !d.trashed)

  const rows = useMemo(() => {
    let r = db.docs.filter((d) => (view === 'trash' ? d.trashed : !d.trashed))
    if (view === 'starred') r = r.filter((d) => d.starred)
    if (view === 'approvals') r = r.filter((d) => d.status === 'pending')
    if (folderId) r = r.filter((d) => d.folderId === folderId)
    if (q.trim()) r = r.filter((d) => d.name.toLowerCase().includes(q.trim().toLowerCase()))
    r = [...r].sort((a, b) => (sort.k === 'name' ? a.name.localeCompare(b.name) : a[sort.k] - b[sort.k]) * sort.dir)
    return view === 'recent' ? r.slice(0, 20) : r
  }, [db.docs, view, folderId, q, sort])

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const allSel = rows.length > 0 && rows.every((r) => sel.includes(r.id))
  const sortBy = (k: SortKey) => setSort((s) => ({ k, dir: s.k === k ? (-s.dir as 1 | -1) : 1 }))

  async function patch(ids: string[], p: Partial<Doc>, msg: string) {
    try { setDb(await api.patchDocs(ids, p)); setSel([]); say(msg) } catch (e) { say((e as Error).message) }
  }
  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const fs = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!fs.length) return
    if (fs.length > 5) return say('Upload up to 5 files at a time.')
    try {
      setDb(await api.upload(fs, folderId || db.folders[0]?.id || ''))
      say(`${fs.length === 1 ? '1 file' : `${fs.length} files`} uploaded`)
    } catch (e) { say((e as Error).message) }
  }
  async function addFolder(name: string) {
    if (!name.trim()) return setFolderErr('Give the folder a name.')
    if (db.folders.some((f) => f.name.toLowerCase() === name.trim().toLowerCase())) return setFolderErr('A folder with this name already exists.')
    try { setDb(await api.createFolder(name.trim())); setFolderModal(false); setFolderErr(''); say('Folder created') } catch (e) { setFolderErr((e as Error).message) }
  }
  async function setStatus(ids: string[], status: Status, msg: string) {
    try { setDb(await (status === 'pending' ? api.submit(ids) : api.setStatus(ids, status))); setSel([]); say(msg) } catch (e) { say((e as Error).message) }
  }
  async function switchOrg(id: string) {
    if (id === org.id) return
    try { setDb(await api.switchOrg(id)); setSel([]); setSp({}); nav('/app') } catch (e) { say((e as Error).message) }
  }
  async function acceptMine(id: string) {
    try { setDb(await api.acceptMine(id)); setSel([]); setSp({}); say('You joined the workspace'); nav('/app') } catch (e) { say((e as Error).message) }
  }
  async function purge(ids: string[]) {
    try { setDb(await api.purge(ids)); setSel([]); say('Deleted forever') } catch (e) { say((e as Error).message) }
  }
  async function signOut() { setDb(await api.signOut()); nav('/') }

  const hour = new Date().getHours()
  const greeting = `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, ${user.name.split(' ')[0]}`
  const recent = [...live].sort((a, b) => b.modified - a.modified).slice(0, 3)
  const showHome = view === 'all' && !folderId && !q.trim()

  const Th = ({ k, children, cls = '' }: { k: SortKey; children: string; cls?: string }) => (
    <th className={`px-4 py-3 font-medium ${cls}`} aria-sort={sort.k === k ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button className="inline-flex items-center gap-1 hover:text-slate-900" onClick={() => sortBy(k)}>
        {children}<CaretDown size={12} className={sort.k === k && sort.dir === 1 ? 'rotate-180' : ''} />
      </button>
    </th>
  )

  return (
    <div className="flex h-dvh bg-white">
      {drawer && <div className="fixed inset-0 z-30 bg-slate-900/30 md:hidden" onClick={() => setDrawer(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-slate-100 bg-slate-50 p-4 transition-transform md:static md:translate-x-0 ${drawer ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold"><Logo size={22} />OrbitDocs</span>
          <button className="md:hidden" aria-label="Close menu" onClick={() => setDrawer(false)}><X size={20} /></button>
        </div>
        <Menu className="mt-6 flex w-full items-center gap-3 rounded-xl bg-white p-2.5 text-left shadow-sm ring-1 ring-slate-100" panel="left-0 right-0 mt-2"
          label={<>
            {org.logoUrl
              ? <img src={org.logoUrl} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
              : <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-sm font-semibold text-brand">{org.name[0].toUpperCase()}</span>}
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{org.name}</span><span className="block truncate text-xs text-slate-400">{org.type}</span></span>
            <CaretUpDown size={16} className="shrink-0 text-slate-400" />
          </>}>
          {(close) => <>
            {db.orgs.map((o) => (
              <MenuItem key={o.id} icon={o.id === org.id ? <Check size={18} className="text-brand" /> : <span className="size-[18px]" />} onClick={() => { close(); switchOrg(o.id) }}>{o.name}</MenuItem>
            ))}
            {db.invites.map((i) => <MenuItem key={i.id} icon={<Plus size={18} />} onClick={() => { close(); acceptMine(i.id) }}>Join {i.orgName}</MenuItem>)}
            <div className="my-1 border-t border-slate-100" />
            <MenuItem icon={<Plus size={18} />} onClick={() => { close(); nav('/onboarding?new=1') }}>New workspace</MenuItem>
          </>}
        </Menu>
        <nav className="mt-6 space-y-1" aria-label="Library">
          {NAV.filter(([k]) => !ADMIN_ONLY.includes(k) || admin).map(([k, I]) => (
            <Link key={k} to={k === 'all' ? '/app' : `/app/${k}`} onClick={() => { setDrawer(false); setSel([]) }}
              aria-current={view === k ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${view === k ? 'bg-brand-soft text-brand' : 'text-slate-600 hover:bg-white'}`}>
              <I size={20} weight={view === k ? 'fill' : 'regular'} />{VIEWS[k]}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <Menu className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-white" panel="bottom-full left-0 mb-2 w-full"
            label={<>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-medium text-white">{user.name[0].toUpperCase()}</span>
              <span className="min-w-0"><span className="block truncate text-sm font-medium">{user.name}</span><span className="block truncate text-xs text-slate-400">@{user.username}</span></span>
            </>}>
            {(close) => <>
              {user.isAdmin && <MenuItem icon={<ShieldCheck size={18} />} onClick={() => { close(); nav('/admin') }}>Admin dashboard</MenuItem>}
              <MenuItem icon={<SignOut size={18} />} onClick={signOut}>Sign out</MenuItem>
            </>}
          </Menu>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3 md:px-10">
          <button className="-ml-1 grid size-10 place-items-center md:hidden" aria-label="Open menu" onClick={() => setDrawer(true)}><List size={22} /></button>
          <div className={`relative max-w-md flex-1 ${bare ? 'invisible' : ''}`}>
            <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents" aria-label="Search documents" className={`${input} h-10 pl-10`} />
          </div>
          <div className="ml-auto"><Notifications key={org.id} /></div>
          <div className={bare ? 'invisible' : ''}>
            <Menu className={primary} label={<><Plus size={16} weight="bold" />New</>}>
              {(close) => <>
                <MenuItem icon={<UploadSimple size={18} />} onClick={() => { close(); file.current?.click() }}>Upload files</MenuItem>
                {admin && <MenuItem icon={<FolderPlus size={18} />} onClick={() => { close(); setFolderModal(true) }}>New folder</MenuItem>}
              </>}
            </Menu>
          </div>
          <input ref={file} type="file" multiple className="sr-only" onChange={onFiles} tabIndex={-1} />
        </header>

        {view === 'people' ? <People /> : view === 'activity' ? <Activity /> : view === 'settings' ? <Settings /> : <div className="px-4 pb-28 pt-8 md:px-10">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{view === 'all' ? greeting : VIEWS[view]}</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {folderId
              ? <><button className="hover:text-slate-900" onClick={() => setSp({})}>All documents</button> / <span className="text-slate-900">{folderName(folderId)}</span></>
              : org.name}
          </p>

          {showHome && db.folders.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 text-sm font-medium text-slate-500">Folders</h2>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {db.folders.map((f) => (
                  <button key={f.id} onClick={() => setSp({ folder: f.id })} className="rounded-2xl bg-slate-50 p-4 text-left transition-colors hover:bg-slate-100">
                    <FolderSimple size={30} weight="fill" className="text-brand/60" />
                    <p className="mt-4 truncate text-sm font-medium">{f.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{live.filter((d) => d.folderId === f.id).length} files, {ago(f.updated)}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {showHome && recent.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 text-sm font-medium text-slate-500">Recent</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {recent.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-50"><FileIcon name={d.name} /></div>
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{d.name}</p><p className="text-xs text-slate-400">{ago(d.modified)}, {fmtSize(d.size)}</p></div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10">
            <h2 className="mb-3 text-sm font-medium text-slate-500">{view === 'all' ? 'All files' : `${rows.length} ${rows.length === 1 ? 'file' : 'files'}`}</h2>
            {rows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-16 text-center">
                <FolderSimple size={36} className="mx-auto text-slate-300" />
                <p className="mt-4 font-medium">{live.length === 0 && view === 'all' ? 'Your library is empty' : q ? 'No matches' : 'Nothing here yet'}</p>
                <p className="mx-auto mt-1 max-w-xs text-sm text-slate-500">
                  {live.length === 0 && view === 'all' ? 'Upload your first document to get started.' : q ? 'Try a different name.' : view === 'trash' ? 'Deleted files show up here.' : view === 'starred' ? 'Star a file to find it fast.' : view === 'approvals' ? 'Files sent for review will show up here.' : 'Upload a file to this view.'}
                </p>
                {live.length === 0 && view === 'all' && <button className={`${primary} mt-6`} onClick={() => file.current?.click()}><UploadSimple size={16} />Upload files</button>}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="w-10 px-4 py-3"><input type="checkbox" aria-label="Select all" checked={allSel} onChange={() => setSel(allSel ? [] : rows.map((r) => r.id))} className="size-4 accent-brand" /></th>
                      <Th k="name">Name</Th>
                      <th className="hidden px-4 py-3 font-medium lg:table-cell">Folder</th>
                      <th className="hidden px-4 py-3 font-medium md:table-cell">Owner</th>
                      <Th k="modified" cls="hidden md:table-cell">Modified</Th>
                      <Th k="size" cls="hidden sm:table-cell">Size</Th>
                      <th className="hidden px-4 py-3 font-medium sm:table-cell">Status</th>
                      <th className="w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, shown).map((d) => (
                      <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="px-4 py-3"><input type="checkbox" aria-label={`Select ${d.name}`} checked={sel.includes(d.id)} onChange={() => toggle(d.id)} className="size-4 accent-brand" /></td>
                        <td className="max-w-0 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <FileIcon name={d.name} />
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 truncate font-medium">{d.name}{d.starred && <Star size={13} weight="fill" className="shrink-0 text-amber-400" />}</p>
                              <p className="text-xs text-slate-400 md:hidden">{ago(d.modified)}, {fmtSize(d.size)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">{folderName(d.folderId)}</td>
                        <td className="hidden px-4 py-3 text-slate-500 md:table-cell">{d.owner}</td>
                        <td className="hidden whitespace-nowrap px-4 py-3 text-slate-500 md:table-cell" title={new Date(d.modified).toLocaleString()}>{ago(d.modified)}</td>
                        <td className="hidden whitespace-nowrap px-4 py-3 text-slate-500 sm:table-cell">{fmtSize(d.size)}</td>
                        <td className="hidden px-4 py-3 sm:table-cell"><span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${BADGE[d.status]}`}>{d.status}</span></td>
                        <td className="px-2 py-2">
                          <Menu className="grid size-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" label={<DotsThree size={22} weight="bold" />} panel="right-0 mt-1" >
                            {(close) => d.trashed ? <>
                              <MenuItem icon={<ArrowCounterClockwise size={18} />} onClick={() => { close(); patch([d.id], { trashed: false }, 'Restored') }}>Restore</MenuItem>
                              <MenuItem icon={<Trash size={18} />} danger onClick={() => { close(); purge([d.id]) }}>Delete forever</MenuItem>
                            </> : <>
                              <MenuItem icon={<Eye size={18} />} onClick={() => { close(); setPreview(d) }}>Preview</MenuItem>
                              <MenuItem icon={<DownloadSimple size={18} />} onClick={() => { close(); api.download(d.id).catch((e: Error) => say(e.message)) }}>Download</MenuItem>
                              <MenuItem icon={<Star size={18} weight={d.starred ? 'fill' : 'regular'} />} onClick={() => { close(); patch([d.id], { starred: !d.starred }, d.starred ? 'Removed star' : 'Starred') }}>{d.starred ? 'Remove star' : 'Star'}</MenuItem>
                              {d.status === 'draft' && d.ownerId === user.id && <MenuItem icon={<PaperPlaneTilt size={18} />} onClick={() => { close(); setStatus([d.id], 'pending', 'Submitted for approval') }}>Submit for approval</MenuItem>}
                              {admin && d.status !== 'approved' && <MenuItem icon={<CheckCircle size={18} />} onClick={() => { close(); setStatus([d.id], 'approved', 'Approved') }}>Approve</MenuItem>}
                              {admin && d.status === 'pending' && <MenuItem icon={<ArrowUUpLeft size={18} />} onClick={() => { close(); setStatus([d.id], 'draft', 'Returned to draft') }}>Return to draft</MenuItem>}
                              {admin && <MenuItem icon={<Trash size={18} />} danger onClick={() => { close(); patch([d.id], { trashed: true }, 'Moved to trash') }}>Move to trash</MenuItem>}
                            </>}
                          </Menu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > shown && <button className="w-full border-t border-slate-100 py-3 text-sm font-medium text-brand hover:bg-slate-50" onClick={() => setShown((n) => n + 50)}>Show more ({rows.length - shown} left)</button>}
              </div>
            )}
          </section>
        </div>}

        {sel.length > 0 && (
          <div className="fixed bottom-6 left-1/2 z-30 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-1 rounded-xl bg-slate-900 p-1.5 text-sm text-white shadow-xl">
            <span className="px-3">{sel.length} selected</span>
            {view === 'trash' ? <>
              <button className="rounded-lg px-3 py-2 hover:bg-white/10" onClick={() => patch(sel, { trashed: false }, 'Restored')}>Restore</button>
              <button className="rounded-lg px-3 py-2 text-red-300 hover:bg-white/10" onClick={() => purge(sel)}>Delete forever</button>
            </> : <>
              {admin && <button className="rounded-lg px-3 py-2 hover:bg-white/10" onClick={() => setStatus(sel, 'approved', 'Approved')}>Approve</button>}
              <button className="rounded-lg px-3 py-2 hover:bg-white/10" onClick={() => patch(sel, { starred: true }, 'Starred')}>Star</button>
              {admin && <button className="rounded-lg px-3 py-2 text-red-300 hover:bg-white/10" onClick={() => patch(sel, { trashed: true }, 'Moved to trash')}>Trash</button>}
            </>}
            <button aria-label="Clear selection" className="grid size-9 place-items-center rounded-lg hover:bg-white/10" onClick={() => setSel([])}><X size={16} /></button>
          </div>
        )}
      </main>

      {preview && <Preview doc={preview} onClose={() => setPreview(null)} />}
      {folderModal && (
        <Modal title="New folder" onClose={() => { setFolderModal(false); setFolderErr('') }}>
          <form className="mt-4" onSubmit={(e) => { e.preventDefault(); addFolder(String(new FormData(e.currentTarget).get('name') ?? '')) }}>
            <input name="name" autoFocus placeholder="Folder name" aria-label="Folder name" className={input} />
            {folderErr && <p role="alert" className="mt-2 text-sm text-red-600">{folderErr}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={ghost} onClick={() => { setFolderModal(false); setFolderErr('') }}>Cancel</button>
              <button className={primary}>Create folder</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
