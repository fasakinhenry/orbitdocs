import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, type InvitePreview } from '../lib/api'
import { useApp } from '../lib/store'
import { Logo, ghost, primary } from '../components/ui'

export default function Invite() {
  const { token = '' } = useParams()
  const { db, setDb } = useApp()
  const nav = useNavigate()
  const [info, setInfo] = useState<InvitePreview>()
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { api.invitePreview(token).then(setInfo).catch((e: Error) => setErr(e.message)) }, [token])

  function keep() {
    sessionStorage.setItem('orbitdocs.invite', token)
    sessionStorage.setItem('orbitdocs.inviteEmail', info!.email)
  }
  async function accept() {
    setBusy(true); setErr('')
    try { setDb(await api.acceptInvite(token)); nav('/app') } catch (e) { setErr((e as Error).message); setBusy(false) }
  }

  const me = db.user
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-12">
      <Link to="/" className="mb-10 flex items-center gap-2.5 font-semibold"><Logo />OrbitDocs</Link>
      {!info && !err && <p className="text-sm text-slate-400">Checking your invitation</p>}
      {!info && err && (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">Invitation unavailable</h1>
          <p role="alert" className="mt-2 text-sm text-slate-500">{err}</p>
          <Link to="/" className={`${ghost} mt-8`}>Back to home</Link>
        </>
      )}
      {info && (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">Join {info.orgName}</h1>
          <p className="mt-2 text-sm text-slate-500">You were invited as {info.role === 'admin' ? 'an admin' : 'a member'} with {info.email}.</p>
          {err && <p role="alert" className="mt-4 text-sm text-red-600">{err}</p>}
          <div className="mt-8 space-y-3">
            {me && me.email === info.email ? (
              <button className={`${primary} h-11 w-full`} disabled={busy} onClick={accept}>{busy ? 'Joining' : 'Accept invitation'}</button>
            ) : me ? (
              <>
                <p className="text-sm text-slate-500">You are signed in as {me.email}. Switch to {info.email} to accept.</p>
                <button className={`${primary} h-11 w-full`} onClick={async () => setDb(await api.signOut())}>Sign out</button>
              </>
            ) : (
              <>
                <Link to={info.hasAccount ? '/signin' : '/signup'} onClick={keep} className={`${primary} h-11 w-full`}>{info.hasAccount ? 'Sign in to accept' : 'Create account to accept'}</Link>
                <Link to={info.hasAccount ? '/signup' : '/signin'} onClick={keep} className="block text-center text-sm text-slate-500 hover:text-slate-900">
                  {info.hasAccount ? 'Use a new account instead' : 'I already have an account'}
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
