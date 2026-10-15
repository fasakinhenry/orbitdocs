import { useEffect, useState } from 'react'
import { api, type ActivityItem } from '../lib/api'
import { useApp } from '../lib/store'
import { ago } from '../lib/util'

const TEXT: Record<string, string> = {
  'org.create': 'created the workspace', 'org.logo': 'updated the workspace logo', 'folder.create': 'created a folder',
  'document.upload': 'uploaded', 'document.trash': 'moved to trash', 'document.restore': 'restored',
  'document.purge': 'permanently deleted', 'document.submit': 'sent for approval', 'document.approved': 'approved',
  'document.draft': 'returned to draft', 'document.pending': 'marked as pending',
  'invite.send': 'invited', 'invite.revoke': 'revoked an invitation', 'invite.accept': 'accepted an invitation',
  'member.role': 'changed a role:', 'member.remove': 'removed',
}

export default function Activity() {
  const { say } = useApp()
  const [items, setItems] = useState<ActivityItem[]>()
  useEffect(() => { api.activity().then((r) => setItems(r.items)).catch((e: Error) => say(e.message)) }, [say])

  return (
    <div className="px-4 pb-28 pt-8 md:px-10">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Activity</h1>
      <p className="mt-1.5 text-sm text-slate-500">The latest 50 changes in this workspace.</p>
      <ul className="mt-10 max-w-2xl divide-y divide-slate-100 rounded-2xl border border-slate-200">
        {!items && <li className="px-4 py-6 text-sm text-slate-400">Loading</li>}
        {items?.length === 0 && <li className="px-4 py-10 text-center text-sm text-slate-500">No activity yet.</li>}
        {items?.map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
            <p className="min-w-0">
              <span className="font-medium">{a.actor}</span>{' '}
              <span className="text-slate-600">{TEXT[a.action] ?? a.action}</span>
              {a.detail && <span className="text-slate-400"> {a.detail}</span>}
            </p>
            <time className="shrink-0 text-xs text-slate-400" dateTime={a.at}>{ago(Date.parse(a.at))}</time>
          </li>
        ))}
      </ul>
    </div>
  )
}
