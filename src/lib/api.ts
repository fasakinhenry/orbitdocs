// OrbitDocs API client. Talks to the backend at VITE_API_URL.
// The UI works with one snapshot (DB) of the active organization, which is refetched after every change.
export type Status = 'approved' | 'pending' | 'draft'
export type Role = 'owner' | 'admin' | 'member'
export interface User { id: string; name: string; username: string; email: string; emailVerified: boolean; isAdmin: boolean; avatarUrl?: string | null; bio?: string; socialLinks?: Record<string, string>; profilePublic?: boolean }
export interface Org { id: string; name: string; slug: string; type: string; description?: string; role: Role; logoUrl: string | null; visibility?: 'public' | 'private'; personal?: boolean }
export interface Note { id: string; text: string; at: string; read: boolean }
export interface Folder { id: string; name: string; updated: number }
export interface Doc {
  id: string; name: string; folderId: string; owner: string; ownerId: string; size: number
  modified: number; status: Status; starred: boolean; trashed: boolean
}
export interface MyInvite { id: string; orgName: string; role: string; expires: string }
export interface JoinLink { id: string; url: string; expires: string; uses: number; maxUses: number | null }
export interface Usage { used: number; quota: number; maxFileBytes: number }
export interface PlatformSettings { defaultQuotaMB: number; maxFileMB: number; registrationOpen: boolean }
export interface AdminStats {
  users: number; orgs: number; files: number; bytes: number
  signups: { day: string; n: number }[]; uploads: { day: string; n: number }[]
  top: { id: string; name: string; bytes: number }[]
  storage: { provider: string; bucket: string; endpoint: string }; settings: PlatformSettings
}
export interface AdminOrg {
  id: string; name: string; slug: string; type: string; createdAt: string; suspended: boolean
  members: number; files: number; bytes: number; quotaBytes: number; customQuota: boolean
  owner: { name: string; email: string; username: string } | null
}
export interface AdminUser { id: string; name: string; username: string; email: string; emailVerified: boolean; suspended: boolean; createdAt: string; workspaces: number }
export interface AdminLogItem { id: string; action: string; detail: string; at: string }
export interface DB { signedIn: boolean; user?: User; org?: Org; orgs: Org[]; invites: MyInvite[]; folders: Folder[]; docs: Doc[] }

export interface ActivityItem { id: string; actor: string; action: string; detail: string; at: string }
export interface Member { id: string; name: string; username: string; email?: string; role: Role }
export interface Invite { id: string; to: string; role: 'admin' | 'member'; expires: string }
export interface InvitePreview { orgName: string; email: string; role: string; hasAccount: boolean }
interface Me { user: User; organizations: Org[] }
interface ApiDoc extends Omit<Doc, 'modified'> { modified: string }
interface ApiFolder { id: string; name: string; updated: string }

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5000/api'
const ORG_KEY = 'orbitdocs.org'
let token: string | null = null
let me: Me | null = null

export const empty = (): DB => ({ signedIn: false, orgs: [], invites: [], folders: [], docs: [] })

async function refresh() {
  try {
    const r = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
    if (!r.ok) return false
    token = ((await r.json()) as { accessToken: string }).accessToken
    return true
  } catch { return false }
}

async function raw(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  let res: Response
  try { res = await fetch(BASE + path, { ...init, headers, credentials: 'include' }) }
  catch { throw new Error('Could not reach the server. Check your connection and try again.') }
  if (res.status === 401 && retry && !path.startsWith('/auth/') && (await refresh())) return raw(path, init, false)
  if (!res.ok) {
    let msg = 'Something went wrong. Try again.'
    try {
      const b = (await res.json()) as { error?: { message?: string; fields?: Record<string, string[]> } }
      const first = b.error?.fields && Object.values(b.error.fields).flat()[0]
      msg = first ?? b.error?.message ?? msg
    } catch { /* keep default message */ }
    throw new Error(msg)
  }
  return res
}

async function call<T = void>(path: string, init?: RequestInit): Promise<T> {
  const r = await raw(path, init)
  return (r.status === 204 ? undefined : await r.json()) as T
}
const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) })
const orgId = () => {
  const id = localStorage.getItem(ORG_KEY)
  if (!id) throw new Error('No organization selected.')
  return id
}

// Lists are fetched page by page (100 at a time, up to 2,000 files) so large libraries are not cut off.
async function fetchAll(base: string, view: 'all' | 'trash') {
  const out: ApiDoc[] = []
  for (let page = 1; page <= 20; page++) {
    const r = await call<{ items: ApiDoc[]; total: number }>(`${base}/documents?view=${view}&limit=100&page=${page}`)
    out.push(...r.items)
    if (!r.items.length || out.length >= r.total) break
  }
  return out
}

async function snapshot(m: Me): Promise<DB> {
  me = m
  const invites = (await call<{ items: MyInvite[] }>('/invites/mine').catch(() => ({ items: [] as MyInvite[] }))).items
  const org = m.organizations.find((o) => o.id === localStorage.getItem(ORG_KEY)) ?? m.organizations[0]
  if (!org) return { signedIn: true, user: m.user, orgs: [], invites, folders: [], docs: [] }
  localStorage.setItem(ORG_KEY, org.id)
  const b = `/orgs/${org.id}`
  const [f, live, trash] = await Promise.all([
    call<{ items: ApiFolder[] }>(`${b}/folders`),
    fetchAll(b, 'all'),
    org.role === 'member' ? Promise.resolve([] as ApiDoc[]) : fetchAll(b, 'trash'),
  ])
  return {
    signedIn: true, user: m.user, org, orgs: m.organizations, invites,
    folders: f.items.map((x) => ({ id: x.id, name: x.name, updated: Date.parse(x.updated) })),
    docs: [...live, ...trash].map((d) => ({ ...d, modified: Date.parse(d.modified) })),
  }
}
const reload = () => snapshot(me!)
const fetchMe = () => call<Me>('/auth/me')

export const api = {
  async bootstrap() { return (await refresh()) ? snapshot(await fetchMe()) : empty() },
  async signUp(name: string, username: string, email: string, password: string) {
    token = (await call<{ accessToken: string }>('/auth/register', json('POST', { name, username, email, password }))).accessToken
    return snapshot(await fetchMe())
  },
  async signIn(email: string, password: string) {
    token = (await call<{ accessToken: string }>('/auth/login', json('POST', { identifier: email, password }))).accessToken
    return snapshot(await fetchMe())
  },
  async signOut() {
    await call('/auth/logout', { method: 'POST' }).catch(() => undefined)
    token = null; me = null
    return empty()
  },
  async createOrg(org: { name: string; slug: string; type: string; description: string; visibility?: 'public' | 'private' }, logo?: File) {
    const o = await call<Org>('/orgs', json('POST', org))
    localStorage.setItem(ORG_KEY, o.id)
    if (logo) {
      const fd = new FormData()
      fd.append('logo', logo)
      await call(`/orgs/${o.id}/logo`, { method: 'POST', body: fd }).catch(() => undefined)
    }
    return snapshot(await fetchMe())
  },
  async upload(files: File[], folderId: string) {
    const fd = new FormData()
    fd.append('folderId', folderId)
    files.forEach((f) => fd.append('files', f))
    await call(`/orgs/${orgId()}/documents`, { method: 'POST', body: fd })
    return reload()
  },
  async createFolder(name: string) {
    await call(`/orgs/${orgId()}/folders`, json('POST', { name }))
    return reload()
  },
  async deleteFolder(folderId: string) {
    await call(`/orgs/${orgId()}/folders/${folderId}`, { method: 'DELETE' })
    return reload()
  },
  setFolderAccess(folderId: string, access: { userId: string; view: boolean; upload: boolean; edit: boolean; delete: boolean }) {
    return call(`/orgs/${orgId()}/folders/${folderId}/access`, json('PATCH', access))
  },
  async patchDocs(ids: string[], patch: Partial<Doc>) {
    const b = `/orgs/${orgId()}/documents`
    if (patch.starred !== undefined) await call(`${b}/star`, json('POST', { ids, starred: patch.starred }))
    if (patch.trashed !== undefined) await call(`${b}/${patch.trashed ? 'trash' : 'restore'}`, json('POST', { ids }))
    return reload()
  },
  async submit(ids: string[]) {
    await call(`/orgs/${orgId()}/documents/submit`, json('POST', { ids }))
    return reload()
  },
  async setStatus(ids: string[], status: Status) {
    await call(`/orgs/${orgId()}/documents/status`, json('POST', { ids, status }))
    return reload()
  },
  activity() { return call<{ items: ActivityItem[] }>(`/orgs/${orgId()}/activity`) },
  async purge(ids: string[]) {
    await call(`/orgs/${orgId()}/documents`, json('DELETE', { ids }))
    return reload()
  },
  members() { return call<{ members: Member[]; invites: Invite[] }>(`/orgs/${orgId()}/members`) },
  memberSearch(q: string) { return call<{ items: { name: string; username: string; email: string }[] }>(`/orgs/${orgId()}/member-search?q=${encodeURIComponent(q)}`) },
  requests() { return call<{ items: { id: string; userId: string; name: string; username: string; createdAt: string }[] }>(`/orgs/${orgId()}/requests`) },
  decideRequest(id: string, status: 'approved' | 'rejected') { return call(`/orgs/${orgId()}/requests/${id}`, json('PATCH', { status })) },
  invite(target: { email?: string; username?: string }, role: 'admin' | 'member') { return call(`/orgs/${orgId()}/invites`, json('POST', { ...target, role })) },
  usage() { return call<Usage>(`/orgs/${orgId()}/usage`) },
  links() { return call<{ items: JoinLink[] }>(`/orgs/${orgId()}/links`) },
  createLink(days: number) { return call<JoinLink>(`/orgs/${orgId()}/links`, json('POST', { days })) },
  revokeLink(id: string) { return call(`/orgs/${orgId()}/links/${id}`, { method: 'DELETE' }) },
  joinPreview(t: string) { return call<{ orgName: string }>(`/join/${t}`) },
  async join(t: string) {
    const { orgId: id } = await call<{ orgId: string }>(`/join/${t}`, { method: 'POST' })
    localStorage.setItem(ORG_KEY, id)
    return snapshot(await fetchMe())
  },
  async acceptMine(id: string) {
    const r = await call<{ orgId: string }>(`/invites/mine/${id}/accept`, { method: 'POST' })
    localStorage.setItem(ORG_KEY, r.orgId)
    return snapshot(await fetchMe())
  },
  admin: {
    stats: () => call<AdminStats>('/admin/stats'),
    orgs: (q: string, page: number) => call<{ items: AdminOrg[]; total: number }>(`/admin/orgs?q=${encodeURIComponent(q)}&page=${page}`),
    patchOrg: (id: string, body: { suspended?: boolean; quotaMB?: number | null }) => call(`/admin/orgs/${id}`, json('PATCH', body)),
    deleteOrg: (id: string) => call(`/admin/orgs/${id}`, { method: 'DELETE' }),
    users: (q: string, page: number) => call<{ items: AdminUser[]; total: number }>(`/admin/users?q=${encodeURIComponent(q)}&page=${page}`),
    patchUser: (id: string, body: { suspended?: boolean; emailVerified?: boolean }) => call(`/admin/users/${id}`, json('PATCH', body)),
    deleteUser: (id: string) => call(`/admin/users/${id}`, { method: 'DELETE' }),
    settings: () => call<PlatformSettings>('/admin/settings'),
    saveSettings: (b: PlatformSettings) => call<PlatformSettings>('/admin/settings', json('PATCH', b)),
    log: () => call<{ items: AdminLogItem[] }>('/admin/log'),
  },
  revokeInvite(id: string) { return call(`/orgs/${orgId()}/invites/${id}`, { method: 'DELETE' }) },
  setRole(userId: string, role: 'admin' | 'member') { return call(`/orgs/${orgId()}/members/${userId}`, json('PATCH', { role })) },
  removeMember(userId: string) { return call(`/orgs/${orgId()}/members/${userId}`, { method: 'DELETE' }) },
  invitePreview(token: string) { return call<InvitePreview>(`/invites/${token}`) },
  async acceptInvite(token: string) {
    const { orgId: id } = await call<{ orgId: string }>(`/invites/${token}/accept`, { method: 'POST' })
    localStorage.setItem(ORG_KEY, id)
    return snapshot(await fetchMe())
  },
  forgot(email: string) { return call('/auth/forgot', json('POST', { email })) },
  reset(token: string, password: string) { return call('/auth/reset', json('POST', { token, password })) },
  resendVerification() { return call('/auth/verify/send', { method: 'POST' }) },
  updateProfile(profile: { name: string; bio: string; socialLinks: Record<string, string>; profilePublic: boolean }) {
    return call<{ user: User }>('/profile', json('PATCH', profile))
  },
  deleteProfile() { return call('/profile', { method: 'DELETE' }) },
  async uploadAvatar(file: File) {
    const fd = new FormData()
    fd.append('avatar', file)
    return call<{ user: User }>('/profile/avatar', { method: 'POST', body: fd })
  },
  publicProfile(username: string) { return call<User>(`/profile/${encodeURIComponent(username)}`) },
  publicOrganizations() { return call<{ items: { id: string; name: string; slug: string; type: string; description: string; logoUrl: string | null }[] }>('/organizations/public') },
  requestToJoin(orgId: string) { return call(`/organizations/${orgId}/request`, { method: 'POST' }) },
  async verifyEmail(t: string) {
    await call('/auth/verify', json('POST', { token: t }))
    return token ? snapshot(await fetchMe()) : null
  },
  async session() { return snapshot(await fetchMe()) },
  async updateOrg(name: string, description: string, visibility: 'public' | 'private') {
    await call(`/orgs/${orgId()}`, json('PATCH', { name, description, visibility }))
    return snapshot(await fetchMe())
  },
  async deleteOrg() {
    await call(`/orgs/${orgId()}`, { method: 'DELETE' })
    localStorage.removeItem(ORG_KEY)
    return snapshot(await fetchMe())
  },
  async setLogo(file: File) {
    const fd = new FormData()
    fd.append('logo', file)
    await call(`/orgs/${orgId()}/logo`, { method: 'POST', body: fd })
    return snapshot(await fetchMe())
  },
  async switchOrg(id: string) { localStorage.setItem(ORG_KEY, id); return snapshot(me!) },
  notifications() { return call<{ unread: number; items: Note[] }>(`/orgs/${orgId()}/notifications`) },
  markRead() { return call(`/orgs/${orgId()}/notifications/read`, { method: 'POST' }) },
  async previewUrl(id: string) {
    return (await call<{ url: string }>(`/orgs/${orgId()}/documents/${id}/download?inline=1`)).url
  },
  async download(id: string) {
    const { url } = await call<{ url: string }>(`/orgs/${orgId()}/documents/${id}/download`)
    window.open(url, '_blank', 'noopener')
  },
}
