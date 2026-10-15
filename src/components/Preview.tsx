import { useEffect, useState } from 'react'
import { DownloadSimple, X } from '@phosphor-icons/react'
import { api, type Doc } from '../lib/api'
import { ghost } from './ui'

const IMAGES = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']

export default function Preview({ doc, onClose }: { doc: Doc; onClose: () => void }) {
  const ext = doc.name.split('.').pop()?.toLowerCase() ?? ''
  const kind = ext === 'pdf' ? 'pdf' : IMAGES.includes(ext) ? 'img' : null
  const [url, setUrl] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => { if (kind) api.previewUrl(doc.id).then(setUrl).catch((e: Error) => setErr(e.message)) }, [doc.id, kind])
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [onClose])

  return (
    <div role="dialog" aria-modal="true" aria-label={`Preview of ${doc.name}`} className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{doc.name}</p>
        <button className={ghost} onClick={() => api.download(doc.id).catch(() => undefined)}><DownloadSimple size={16} />Download</button>
        <button aria-label="Close preview" className="grid size-10 place-items-center rounded-lg hover:bg-slate-100" onClick={onClose}><X size={20} /></button>
      </div>
      <div className="min-h-0 flex-1 bg-slate-50">
        {!kind && <p className="grid h-full place-items-center px-6 text-center text-sm text-slate-500">This file type cannot be previewed. Download it to open it.</p>}
        {kind && err && <p role="alert" className="grid h-full place-items-center px-6 text-center text-sm text-red-600">{err}</p>}
        {kind && !err && !url && <p className="grid h-full place-items-center text-sm text-slate-400">Loading preview</p>}
        {kind === 'pdf' && url && <iframe src={url} title={doc.name} className="size-full border-0" />}
        {kind === 'img' && url && <div className="grid size-full place-items-center overflow-auto p-4"><img src={url} alt={doc.name} className="max-h-full max-w-full object-contain" /></div>}
      </div>
    </div>
  )
}
