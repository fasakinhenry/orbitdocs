import { useCallback, useEffect, useState } from 'react'
import { Bell } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { api, type Note } from '../lib/api'
import { ago } from '../lib/util'
import { Menu } from './ui'

export default function Notifications() {
  const nav = useNavigate()
  const [data, setData] = useState<{ unread: number; items: Note[] }>({ unread: 0, items: [] })
  const load = useCallback(() => api.notifications().then(setData).catch(() => undefined), [])
  useEffect(() => {
    load()
    const t = window.setInterval(load, 60000)
    return () => window.clearInterval(t)
  }, [load])

  return (
    <Menu className="relative grid size-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100" panel="fixed right-2 top-16 w-[calc(100vw-1rem)] max-w-80 md:absolute md:right-0 md:top-full md:mt-2"
      onOpen={() => { load(); if (data.unread) api.markRead().then(() => setData((d) => ({ ...d, unread: 0 }))).catch(() => undefined) }}
      label={<>
        <Bell size={22} />
        <span className="sr-only">Notifications{data.unread ? `, ${data.unread} unread` : ''}</span>
        {data.unread > 0 && <span aria-hidden="true" className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-4 text-white">{data.unread > 9 ? '9+' : data.unread}</span>}
      </>}>
      {(close) => data.items.length === 0
        ? <p className="px-3 py-6 text-center text-sm text-slate-400">You are all caught up.</p>
        : <ul className="max-h-96 overflow-y-auto">
            {data.items.map((n) => (
              <li key={n.id}>
                <button type="button" className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-slate-50" onClick={() => {
                  close()
                  if (/approval|submitted|approved|returned|deletion/i.test(n.text)) nav('/app/approvals')
                  else if (/invited|joined|left|request/i.test(n.text)) nav('/app/people')
                  else nav('/app')
                }}>
                <span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-brand'}`} />
                <div><p className="text-slate-700">{n.text}</p><p className="mt-0.5 text-xs text-slate-400">{ago(Date.parse(n.at))}</p></div>
                </button>
              </li>
            ))}
          </ul>}
    </Menu>
  )
}
