import { Link } from 'react-router-dom'
import { FileDoc, FilePdf, FolderSimple, Globe, LinkSimple, LockKey, MagnifyingGlass, UserCircle, UsersThree } from '@phosphor-icons/react'
import { Logo, ghost, primary } from '../components/ui'

const FEATURES = [
  { icon: FolderSimple, title: 'One home for every file', text: 'Documents belong to your organization, so nothing disappears when a volunteer or team lead moves on.' },
  { icon: LockKey, title: 'Permissions that make sense', text: 'Set organization roles and folder-level access for viewing, uploading, editing, and deleting.' },
  { icon: MagnifyingGlass, title: 'Find it in seconds', text: 'Search, filter, and sort across folders, uploaders, and approval status, even from your phone.' },
]

const STEPS = [
  ['Start with your personal workspace', 'Sign up and get a private workspace immediately. Create an organization only when you are ready.'],
  ['Bring people in your way', 'Invite by email or username, share a join link, or let people discover your public organization.'],
  ['Keep everything in one place', 'Upload from any device, send files for review, and control access folder by folder.'],
]

function Preview() {
  return (
    <div aria-hidden="true" className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {['Partnerships', 'Events', 'Design', 'Archive'].map((n) => (
          <div key={n} className="rounded-2xl bg-slate-50 p-4"><FolderSimple size={26} weight="fill" className="text-brand/60" /><p className="mt-3 text-sm font-medium">{n}</p></div>
        ))}
      </div>
      <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 text-left text-sm">
        {[['Partnership proposal.pdf', 'Pending'], ['Event plan.docx', 'Approved'], ['Brand guidelines.pdf', 'Approved']].map(([n, st]) => (
          <div key={n} className="flex items-center gap-3 px-4 py-3">
            {n.endsWith('pdf') ? <FilePdf size={20} className="text-red-500" /> : <FileDoc size={20} className="text-brand" />}
            <span className="flex-1 truncate">{n}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${st === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{st}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Landing() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-5 md:px-8">
      <header className="flex items-center justify-between py-6">
        <Link to="/" className="flex items-center gap-2.5 font-semibold"><Logo />OrbitDocs</Link>
        <nav className="flex items-center gap-2">
          <Link to="/signup" className={`${primary} hidden sm:inline-flex`}>Get started</Link>
          <Link to="/signin" className={ghost}>Sign in</Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="mx-auto max-w-3xl py-20 text-center md:py-32">
          <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-6xl">Your team's knowledge, in one orbit.</h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-500 text-pretty">
            Organize documents, collaborate with your team, and protect the knowledge your organization builds.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/signup" className={`${primary} h-12 px-6 text-base`}>Get started</Link>
            <Link to="/organizations" className={`${ghost} h-12 px-6 text-base`}>Explore organizations</Link>
          </div>
        </section>
        <Preview />
        <section className="mt-20 grid gap-10 border-t border-slate-100 py-16 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <div className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><Icon size={22} /></div>
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
            </div>
          ))}
        </section>
        <section className="border-t border-slate-100 py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-brand">Built for how communities work</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Start solo. Grow into a community.</h2>
            <p className="mt-3 text-slate-500">OrbitDocs gives every person a private starting point, then makes it simple to find, join, and manage the organizations that matter to them.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              { icon: UserCircle, title: 'Your profile, your identity', text: 'Add a profile picture, bio, and social links. Choose whether your profile is public.' },
              { icon: Globe, title: 'Public or private organizations', text: 'Make a community discoverable with join requests, or keep it private behind invitations and links.' },
              { icon: LinkSimple, title: 'Join without the friction', text: 'People can join from an organization link, see where they are going, and keep their personal workspace too.' },
              { icon: UsersThree, title: 'Clear roles for every team', text: 'Owners and admins can delegate responsibility, approve requests, and give members exactly the access they need.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl bg-slate-50 p-5">
                <Icon size={24} className="text-brand" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="border-t border-slate-100 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Up and running in minutes</h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3">
            {STEPS.map(([t, d], i) => (
              <li key={t}><span className="text-sm font-medium text-brand">Step {i + 1}</span><h3 className="mt-2 font-semibold">{t}</h3><p className="mt-2 text-sm leading-relaxed text-slate-500">{d}</p></li>
            ))}
          </ol>
          <div className="mt-12"><Link to="/signup" className={`${primary} h-12 px-6 text-base`}>Get started</Link></div>
          <div className="mt-6"><Link to="/organizations" className="text-sm font-medium text-brand hover:text-brand-dark">Explore public organizations</Link></div>
        </section>
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 py-6 text-sm text-slate-400">
        <span>OrbitDocs</span>
        <span>Made for FUTA Techies and every team like it.</span>
      </footer>
    </div>
  )
}
