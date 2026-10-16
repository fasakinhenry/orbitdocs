import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { api, empty, type DB } from './api'
import Loading from '../pages/Loading'

interface Ctx { db: DB; setDb: (d: DB) => void; say: (m: string) => void }
const AppCtx = createContext<Ctx | null>(null)

export function Provider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(empty)
  const [ready, setReady] = useState(false)
  const [msg, setMsg] = useState('')
  const timer = useRef<number>(0)
  const say = useCallback((m: string) => {
    setMsg(m)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMsg(''), 3600)
  }, [])

  useEffect(() => {
    api.bootstrap().then(setDb).catch(() => setDb(empty())).finally(() => setReady(true))
  }, [])

  return (
    <AppCtx.Provider value={{ db, setDb, say }}>
      {ready ? children : <Loading />}
      {msg && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg">
          {msg}
        </div>
      )}
    </AppCtx.Provider>
  )
}

export function useApp() {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp must be used inside Provider')
  return c
}
