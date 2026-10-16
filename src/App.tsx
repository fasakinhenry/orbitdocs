import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { useApp } from './lib/store'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Invite from './pages/Invite'
import Join from './pages/Join'
import Admin from './pages/Admin'
import { Forgot, Reset, Verify } from './pages/Recover'
import Profile from './pages/Profile'
import Organizations from './pages/Organizations'

function Guard({ children, needOrg, allowOrg }: { children: ReactNode; needOrg?: boolean; allowOrg?: boolean }) {
  const { db } = useApp()
  const [sp] = useSearchParams()
  if (!db.signedIn) return <Navigate to="/signin" replace />
  if (needOrg && !db.org) return <Navigate to="/onboarding" replace />
  if (!needOrg && !allowOrg && db.org && !sp.get('new')) return <Navigate to="/app" replace />
  return <>{children}</>
}

function Home() {
  const { db } = useApp()
  return db.signedIn ? <Navigate to="/app" replace /> : <Landing />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<Auth mode="signin" />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/reset/:token" element={<Reset />} />
      <Route path="/verify/:token" element={<Verify />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/profile" element={<Guard allowOrg><Profile /></Guard>} />
      <Route path="/organizations" element={<Organizations />} />
      <Route path="/join/:token" element={<Join />} />
      <Route path="/invite/:token" element={<Invite />} />
      <Route path="/onboarding" element={<Guard><Onboarding /></Guard>} />
      <Route path="/app/:view?" element={<Guard needOrg><Dashboard /></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
