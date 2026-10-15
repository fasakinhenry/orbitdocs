import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApp } from '../lib/store'
import { Logo, input, primary } from '../components/ui'

export default function Auth({ mode }: { mode: 'signin' | 'signup' }) {
  const { setDb, say } = useApp()
  const invEmail = sessionStorage.getItem('orbitdocs.inviteEmail') ?? ''
  const nav = useNavigate()
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const up = mode === 'signup'

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const name = String(f.get('name') ?? '').trim()
    const username = String(f.get('username') ?? '').trim().toLowerCase()
    const email = String(f.get('email')).trim().toLowerCase()
    const pw = String(f.get('password'))
    if (up && name.length < 2) return setErr('Enter your name.')
    if (up && !/^[a-z0-9_]{3,20}$/.test(username)) return setErr('Username needs 3 to 20 letters, numbers, or underscores.')
    if (up && !/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email address.')
    if (!up && email.length < 3) return setErr('Enter your email or username.')
    if (pw.length < 8) return setErr('Use at least 8 characters for your password.')
    setBusy(true); setErr('')
    try {
      let d = up ? await api.signUp(name, username, email, pw) : await api.signIn(email, pw)
      const inv = sessionStorage.getItem('orbitdocs.invite')
      if (inv) {
        sessionStorage.removeItem('orbitdocs.invite'); sessionStorage.removeItem('orbitdocs.inviteEmail')
        try { d = await api.acceptInvite(inv) } catch (x) { say((x as Error).message) }
      }
      const jn = sessionStorage.getItem('orbitdocs.join')
      if (jn) {
        sessionStorage.removeItem('orbitdocs.join')
        try { d = await api.join(jn) } catch (x) { say((x as Error).message) }
      }
      setDb(d)
      nav(d.org ? '/app' : '/onboarding')
    } catch (x) {
      setErr((x as Error).message)
    } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-12">
      <Link to="/" className="mb-10 flex items-center gap-2.5 font-semibold"><Logo />OrbitDocs</Link>
      <h1 className="text-2xl font-semibold tracking-tight">{up ? 'Create your account' : 'Welcome back'}</h1>
      <p className="mt-2 text-sm text-slate-500">{up ? 'Start with your own workspace. Invite your team later.' : 'Sign in to your workspace.'}</p>
      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        {up && <label className="block text-sm font-medium">Full name<input name="name" autoComplete="name" className={`${input} mt-1.5`} /></label>}
        {up && <label className="block text-sm font-medium">Username<input name="username" autoComplete="off" autoCapitalize="none" placeholder="ada_lovelace" className={`${input} mt-1.5`} /></label>}
        <label className="block text-sm font-medium">{up ? 'Email' : 'Email or username'}<input name="email" type={up ? 'email' : 'text'} autoCapitalize="none" autoComplete={up ? 'email' : 'username'} defaultValue={invEmail} className={`${input} mt-1.5`} /></label>
        <label className="block text-sm font-medium">Password<input name="password" type="password" autoComplete={up ? 'new-password' : 'current-password'} className={`${input} mt-1.5`} /></label>
        {!up && <div className="-mt-2 text-right"><Link to="/forgot" className="text-sm text-slate-500 hover:text-slate-900">Forgot password?</Link></div>}
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <button disabled={busy} className={`${primary} h-11 w-full`}>{busy ? 'Please wait' : up ? 'Create account' : 'Sign in'}</button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        {up ? 'Already have an account? ' : 'New to OrbitDocs? '}
        <Link to={up ? '/signin' : '/signup'} className="font-medium text-brand">{up ? 'Sign in' : 'Create an account'}</Link>
      </p>
    </div>
  )
}
