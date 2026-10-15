import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ImageSquare } from '@phosphor-icons/react'
import { api } from '../lib/api'
import { useApp } from '../lib/store'
import { slugify } from '../lib/util'
import { AuthShell, Logo, ghost, input, primary } from '../components/ui'

const TYPES = ['Student community', 'Nonprofit', 'Startup', 'Company', 'Educational institution', 'Professional community', 'Other']

function OnboardingForm() {
  const { setDb } = useApp()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [touched, setTouched] = useState(false)
  const [logo, setLogo] = useState<string>()
  const [logoFile, setLogoFile] = useState<File>()
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')

  function pickLogo(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) return setErr('Choose an image file for the logo.')
    if (f.size > 1_000_000) return setErr('Logo must be under 1 MB.')
    setErr('')
    setLogoFile(f)
    const r = new FileReader()
    r.onload = () => setLogo(String(r.result))
    r.readAsDataURL(f)
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (name.trim().length < 2) return setErr('Enter your organization name.')
    if (!/^[a-z0-9-]{3,30}$/.test(slug)) return setErr('The URL name needs 3 to 30 lowercase letters, numbers, or hyphens.')
    setBusy(true); setErr('')
    try {
      setDb(await api.createOrg({ name: name.trim(), slug, type: String(f.get('type')), description: String(f.get('description') ?? '').trim(), visibility }, logoFile))
      nav('/app')
    } catch (x) {
      setErr((x as Error).message); setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <div className="mb-10 flex items-center gap-2.5 font-semibold"><Logo />OrbitDocs</div>
      <h1 className="text-2xl font-semibold tracking-tight">Set up your organization</h1>
      <p className="mt-2 text-sm text-slate-500">This is where your team's documents will live. You can change everything later.</p>
      <PendingInvites />
      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        <div className="flex items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-50 text-slate-400">
            {logo ? <img src={logo} alt="Logo preview" className="size-full object-cover" /> : <ImageSquare size={26} />}
          </div>
          <label className="cursor-pointer text-sm font-medium text-brand">
            {logo ? 'Change logo' : 'Upload logo'}
            <input type="file" accept="image/*" className="sr-only" onChange={pickLogo} />
          </label>
        </div>
        <label className="block text-sm font-medium">Organization name
          <input value={name} className={`${input} mt-1.5`} placeholder="FUTA Techies"
            onChange={(e) => { setName(e.target.value); if (!touched) setSlug(slugify(e.target.value)) }} />
        </label>
        <label className="block text-sm font-medium">URL name
          <input value={slug} className={`${input} mt-1.5`} onChange={(e) => { setTouched(true); setSlug(slugify(e.target.value)) }} />
        </label>
        <label className="block text-sm font-medium">Type
          <select name="type" className={`${input} mt-1.5`}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        </label>
        <label className="block text-sm font-medium">Organization visibility
          <select value={visibility} onChange={(e) => setVisibility(e.target.value as 'public' | 'private')} className={`${input} mt-1.5`}>
            <option value="public">Public - discoverable and open to join requests</option>
            <option value="private">Private - invite or join link only</option>
          </select>
        </label>
        <label className="block text-sm font-medium">Description <span className="font-normal text-slate-400">(optional)</span>
          <textarea name="description" rows={3} className={`${input} mt-1.5 h-auto py-2.5`} />
        </label>
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <button disabled={busy} className={`${primary} h-11 w-full`}>{busy ? 'Creating' : 'Create workspace'}</button>
      </form>
    </div>
  )
}

export default function Onboarding() {
  const { db } = useApp()
  const [sp] = useSearchParams()
  const create = !db.org?.personal || !sp.get('new') || !!sp.get('create')
  if (!sp.get('new') || !db.org?.personal) return <OnboardingForm />
  if (create) return <OnboardingForm />
  return <OnboardingChoice />
}

function OnboardingChoice() {
  const { db, setDb, say } = useApp()
  const nav = useNavigate()
  const joinToken = sessionStorage.getItem('orbitdocs.join')
  const inviteToken = sessionStorage.getItem('orbitdocs.invite')
  const [orgName, setOrgName] = useState('')
  const [invite, setInvite] = useState<{ token: string }>()
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (joinToken) api.joinPreview(joinToken).then((x) => setOrgName(x.orgName)).catch(() => sessionStorage.removeItem('orbitdocs.join'))
    if (inviteToken) api.invitePreview(inviteToken).then(() => setInvite({ token: inviteToken })).catch(() => sessionStorage.removeItem('orbitdocs.invite'))
  }, [joinToken, inviteToken])
  async function join() {
    if (!joinToken && !invite) return
    setBusy(true)
    try {
      sessionStorage.removeItem('orbitdocs.join'); sessionStorage.removeItem('orbitdocs.invite'); sessionStorage.removeItem('orbitdocs.inviteEmail')
      setDb(await (joinToken ? api.join(joinToken) : api.acceptInvite(invite!.token))); nav('/app')
    }
    catch (e) { say((e as Error).message); setBusy(false) }
  }
  return (
    <AuthShell title="Welcome to OrbitDocs" sub="Your personal workspace is ready. Choose what you want to do next.">
      <div className="mt-8 space-y-3">
        {(orgName || invite) && <button className={`${primary} h-11 w-full`} disabled={busy} onClick={join}>{busy ? 'Joining' : `Join ${orgName || 'the invited organization'}`}</button>}
        <button className={`${primary} h-11 w-full`} onClick={() => nav('/onboarding?new=1&create=1')}>Create an organization</button>
        <button className={`${ghost} h-11 w-full`} onClick={() => nav('/app')}>Use my personal workspace</button>
      </div>
    </AuthShell>
  )
}

function PendingInvites() {
  const { db, setDb, say } = useApp()
  const nav = useNavigate()
  if (!db.invites.length) return null
  async function accept(id: string) {
    try { setDb(await api.acceptMine(id)); nav('/app') } catch (e) { say((e as Error).message) }
  }
  return (
    <div className="mt-6 rounded-2xl bg-brand-soft p-4">
      <p className="text-sm font-medium">You have {db.invites.length === 1 ? 'an invitation' : 'invitations'}</p>
      <ul className="mt-2 space-y-2">
        {db.invites.map((i) => (
          <li key={i.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{i.orgName}</span>
            <button className="shrink-0 font-medium text-brand" onClick={() => accept(i.id)}>Join</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
