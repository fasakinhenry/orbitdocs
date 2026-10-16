import { Logo } from '../components/ui'

export default function Loading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 px-6" aria-label="Loading OrbitDocs">
      <div className="text-center">
        <div className="orbit-loader relative mx-auto size-28" aria-hidden="true">
          <div className="absolute inset-5 grid place-items-center rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"><Logo size={48} /></div>
          <span className="orbit-dot orbit-dot-one" />
          <span className="orbit-dot orbit-dot-two" />
          <span className="orbit-dot orbit-dot-three" />
        </div>
        <p className="mt-6 text-sm font-semibold text-slate-700">Getting your workspace ready</p>
        <p className="mt-1.5 text-sm text-slate-400">OrbitDocs is loading your files securely.</p>
      </div>
    </main>
  )
}
