import { Link } from 'react-router-dom'
import { ArrowLeft, House, RocketLaunch } from '@phosphor-icons/react'
import Seo from '../components/Seo'
import { Logo, ghost, primary } from '../components/ui'

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center overflow-hidden bg-slate-50 px-5 py-12">
      <Seo title="Page not found | OrbitDocs" description="The OrbitDocs page you requested could not be found." />
      <div className="w-full max-w-xl text-center">
        <Link to="/" className="inline-flex items-center gap-2 font-semibold text-slate-900"><Logo />OrbitDocs</Link>
        <div className="relative mx-auto mt-14 h-48 w-72" aria-hidden="true">
          <div className="absolute inset-x-8 bottom-4 h-2 rounded-full bg-brand/10 blur-sm" />
          <div className="absolute left-1/2 top-4 -translate-x-1/2 animate-[float_3s_ease-in-out_infinite]">
            <div className="relative grid size-28 place-items-center rounded-[2rem] bg-brand shadow-xl shadow-brand/25">
              <RocketLaunch size={56} weight="duotone" className="text-white" />
              <span className="absolute -bottom-6 left-1/2 h-9 w-5 -translate-x-1/2 rounded-b-full bg-gradient-to-b from-amber-300 to-transparent opacity-80" />
            </div>
          </div>
          <span className="absolute left-4 top-16 size-2 rounded-full bg-brand/40 animate-pulse" />
          <span className="absolute right-5 top-5 size-3 rounded-full bg-brand/30 animate-pulse [animation-delay:500ms]" />
          <span className="absolute right-1 top-28 size-2 rounded-full bg-brand/50 animate-pulse [animation-delay:900ms]" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">404 error</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">This page drifted out of orbit</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-500">The link may be outdated, or the page may have moved to another workspace.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className={primary}><House size={17} />Go home</Link>
          <button type="button" className={ghost} onClick={() => window.history.back()}><ArrowLeft size={17} />Go back</button>
        </div>
      </div>
    </main>
  )
}
