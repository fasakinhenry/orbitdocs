import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useApp } from '../lib/store'
import { AuthShell, primary } from '../components/ui'

export default function Join() {
  const { token = '' } = useParams()
  const { db, setDb } = useApp()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { api.joinPreview(token).then((r) => setName(r.orgName)).catch((e: Error) => setErr(e.message)) }, [token])

  async function join() {
    setBusy(true); setErr('')
    try { setDb(await api.join(token)); nav('/app') } catch (e) { setErr((e as Error).message); setBusy(false) }
  }

  if (!name) {
    return <AuthShell title={err ? 'Link unavailable' : 'Checking your link'} sub={err || undefined}>{err && <Link to="/" className="mt-8 text-sm font-medium text-brand">Back to home</Link>}</AuthShell>
  }
  return (
    <AuthShell title={`Join ${name}`} sub="You were invited with a link. You will join as a member.">
      {err && <p role="alert" className="mt-4 text-sm text-red-600">{err}</p>}
      <div className="mt-8 space-y-3">
        {db.user ? (
          <button className={`${primary} h-11 w-full`} disabled={busy} onClick={join}>{busy ? 'Joining' : 'Join workspace'}</button>
        ) : (
          <>
            <Link to="/signup" onClick={() => sessionStorage.setItem('orbitdocs.join', token)} className={`${primary} h-11 w-full`}>Create account to join</Link>
            <Link to="/signin" onClick={() => sessionStorage.setItem('orbitdocs.join', token)} className="block text-center text-sm text-slate-500 hover:text-slate-900">I already have an account</Link>
          </>
        )}
      </div>
    </AuthShell>
  )
}
