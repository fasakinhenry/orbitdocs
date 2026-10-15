import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useApp } from '../lib/store'
import { AuthShell, ghost, input, primary } from '../components/ui'

export function Forgot() {
  const [sent, setSent] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email')).trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email address.')
    setBusy(true); setErr('')
    try { await api.forgot(email); setSent(email) } catch (x) { setErr((x as Error).message) } finally { setBusy(false) }
  }

  if (sent) {
    return (
      <AuthShell title="Check your inbox" sub={`If an account exists for ${sent}, we sent a link to reset the password. It expires in 1 hour.`}>
        <Link to="/signin" className={`${ghost} mt-8`}>Back to sign in</Link>
      </AuthShell>
    )
  }
  return (
    <AuthShell title="Reset your password" sub="Enter your email and we will send you a reset link.">
      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <label className="block text-sm font-medium">Email<input name="email" type="email" autoComplete="email" className={`${input} mt-1.5`} /></label>
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <button disabled={busy} className={`${primary} h-11 w-full`}>{busy ? 'Sending' : 'Send reset link'}</button>
      </form>
      <Link to="/signin" className="mt-6 text-sm text-slate-500 hover:text-slate-900">Back to sign in</Link>
    </AuthShell>
  )
}

export function Reset() {
  const { token = '' } = useParams()
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const pw = String(f.get('password'))
    if (pw.length < 8) return setErr('Use at least 8 characters for your password.')
    if (pw !== String(f.get('confirm'))) return setErr('The two passwords do not match.')
    setBusy(true); setErr('')
    try { await api.reset(token, pw); setDone(true) } catch (x) { setErr((x as Error).message) } finally { setBusy(false) }
  }

  if (done) {
    return (
      <AuthShell title="Password updated" sub="You can now sign in with your new password. Other devices have been signed out.">
        <Link to="/signin" className={`${primary} mt-8 h-11`}>Sign in</Link>
      </AuthShell>
    )
  }
  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <label className="block text-sm font-medium">New password<input name="password" type="password" autoComplete="new-password" className={`${input} mt-1.5`} /></label>
        <label className="block text-sm font-medium">Confirm password<input name="confirm" type="password" autoComplete="new-password" className={`${input} mt-1.5`} /></label>
        {err && <p role="alert" className="text-sm text-red-600">{err} {err.includes('expired') && <Link to="/forgot" className="font-medium text-brand">Request a new link</Link>}</p>}
        <button disabled={busy} className={`${primary} h-11 w-full`}>{busy ? 'Saving' : 'Update password'}</button>
      </form>
    </AuthShell>
  )
}

export function Verify() {
  const { token = '' } = useParams()
  const { setDb } = useApp()
  const [state, setState] = useState<'working' | 'ok' | string>('working')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    api.verifyEmail(token).then((d) => { if (d) setDb(d); setState('ok') }).catch((e: Error) => setState(e.message))
  }, [token, setDb])

  if (state === 'working') return <AuthShell title="Verifying your email" />
  if (state === 'ok') {
    return (
      <AuthShell title="Email verified" sub="You are all set.">
        <Link to="/app" className={`${primary} mt-8 h-11`}>Continue</Link>
      </AuthShell>
    )
  }
  return (
    <AuthShell title="Link unavailable" sub={state}>
      <Link to="/signin" className={`${ghost} mt-8`}>Go to sign in</Link>
    </AuthShell>
  )
}
