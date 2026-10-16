import { Link } from 'react-router-dom'
import Seo from '../components/Seo'

const CONTENT = {
  privacy: {
    title: 'Privacy Policy | OrbitDocs',
    heading: 'Privacy policy',
    intro: 'This plain-language summary explains how OrbitDocs handles information used to provide the service.',
    sections: [
      ['Information we use', 'We use account details, workspace memberships, profile information, notifications, and file metadata to provide OrbitDocs. Files are stored in the configured storage provider.'],
      ['How we use it', 'We use information to authenticate accounts, operate workspaces, enforce permissions, deliver invitations and notifications, protect the service, and improve reliability.'],
      ['Your choices', 'You can update your profile, control profile visibility, leave organizations where permitted, and delete your account from Profile settings. Organization owners can delete organizations they own.'],
      ['Third parties', 'OrbitDocs may use infrastructure providers such as MongoDB, an S3-compatible storage provider, hosting providers, and email delivery services. They receive only information needed to provide their service.'],
      ['Contact', 'For privacy questions or account requests, contact the OrbitDocs administrator for your deployment.'],
    ],
  },
  terms: {
    title: 'Terms of Service | OrbitDocs',
    heading: 'Terms of service',
    intro: 'By using OrbitDocs, you agree to use it responsibly and to protect the people and information in your workspaces.',
    sections: [
      ['Your account', 'Keep your credentials secure and provide accurate account information. You are responsible for activity performed through your account.'],
      ['Your content', 'You retain responsibility for the files and information you upload. Do not upload content you are not permitted to store or share.'],
      ['Workspace permissions', 'Owners and folder managers are responsible for assigning access carefully. Do not use invitations, join links, or permissions to bypass another person’s privacy.'],
      ['Availability', 'OrbitDocs is provided as an evolving service. We work to keep it reliable, but maintenance, provider failures, and outages can occur.'],
      ['Acceptable use', 'Do not use OrbitDocs for unlawful activity, abuse, credential attacks, malware distribution, or attempts to access data outside your permissions.'],
    ],
  },
  cookies: {
    title: 'Cookie Policy | OrbitDocs',
    heading: 'Cookie policy',
    intro: 'OrbitDocs keeps browser storage deliberately small and focused on the product experience.',
    sections: [
      ['Essential session cookies', 'The backend uses an httpOnly refresh cookie to restore your signed-in session. It cannot be read by page scripts and is required for authentication.'],
      ['Local browser storage', 'The app stores your selected workspace, cookie-consent choice, and other non-sensitive interface preferences in your browser.'],
      ['No advertising cookies', 'OrbitDocs does not use advertising cookies or sell personal information through cookies.'],
      ['Managing cookies', 'You can clear cookies and local storage in your browser. Clearing them may sign you out and reset workspace preferences.'],
    ],
  },
}

export default function Policy({ kind }: { kind: keyof typeof CONTENT }) {
  const page = CONTENT[kind]
  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-5 py-10 md:px-8">
      <Seo title={page.title} description={page.intro} path={`/${kind}`} />
      <Link to="/" className="text-sm font-medium text-brand hover:underline">Back to OrbitDocs</Link>
      <main className="mt-12">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{page.heading}</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-slate-500">{page.intro}</p>
        <div className="mt-10 space-y-8">
          {page.sections.map(([heading, body]) => <section key={heading}><h2 className="text-lg font-semibold">{heading}</h2><p className="mt-2 leading-relaxed text-slate-600">{body}</p></section>)}
        </div>
      </main>
      <footer className="mt-16 flex gap-4 border-t border-slate-100 pt-6 text-sm text-slate-500">
        <Link to="/privacy" className="hover:text-slate-900">Privacy</Link><Link to="/terms" className="hover:text-slate-900">Terms</Link><Link to="/cookies" className="hover:text-slate-900">Cookies</Link>
      </footer>
    </div>
  )
}
