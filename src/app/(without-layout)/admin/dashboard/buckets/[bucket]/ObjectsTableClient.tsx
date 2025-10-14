'use client'

import React from 'react'

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

interface Obj { name: string; lastModified: Date; etag: string; size: number }

export default function ObjectsTableClient({ bucketName, initialObjects, deleteManyAction, deleteAllAction }: { bucketName: string; initialObjects: Obj[]; deleteManyAction: (formData: FormData) => Promise<void>; deleteAllAction: (formData: FormData) => Promise<void>; }) {
  const [selected, setSelected] = React.useState<string[]>([])
  const [filter, setFilter] = React.useState('')
  const objects = React.useMemo(() => {
    if (!filter.trim()) return initialObjects
    return initialObjects.filter(o => o.name.toLowerCase().includes(filter.toLowerCase()))
  }, [initialObjects, filter])
  const allChecked = selected.length === objects.length && objects.length > 0
  function toggleAll() {
    setSelected(allChecked ? [] : objects.map(o => o.name))
  }
  function toggleOne(name: string) {
    setSelected(sel => sel.includes(name) ? sel.filter(n => n !== name) : [...sel, name])
  }
  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Filtrer par nom..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border border-neutral-300 rounded px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <form action={(formData: FormData) => {
          formData.set('objectNames', selected.join('|'))
          return deleteManyAction(formData)
        }} onSubmit={(e) => {
          if (selected.length === 0) {
            e.preventDefault()
            return
          }
          if (!confirm(`Supprimer ${selected.length} objet(s) sélectionné(s) ?`)) {
            e.preventDefault()
          }
        }}>
          <input type="hidden" name="bucketName" value={bucketName} />
          <input type="hidden" name="objectNames" />
          <button
            type="submit"
            disabled={selected.length === 0}
            className="px-4 py-2 text-sm font-medium rounded bg-red-600 text-white disabled:opacity-40 hover:bg-red-700 transition"
          >Supprimer la sélection</button>
        </form>
        <form action={(formData: FormData) => deleteAllAction(formData)} onSubmit={(e) => {
          if (!confirm('Supprimer TOUS les objets de ce bucket ? Cette action est définitive.')) {
            e.preventDefault()
          }
        }}>
          <input type="hidden" name="bucketName" value={bucketName} />
          <button
            type="submit"
            disabled={initialObjects.length === 0}
            className="px-4 py-2 text-sm font-medium rounded bg-red-900 text-white disabled:opacity-40 hover:bg-red-950 transition"
          >Tout supprimer</button>
        </form>
      </div>
      <div className="overflow-x-auto border border-neutral-200 rounded-xl">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-700 bg-neutral-50">
              <th className="py-2 pl-3 pr-4 font-medium"><input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Sélectionner tout" /></th>
              <th className="py-2 pr-4 font-medium">Nom</th>
              <th className="py-2 pr-4 font-medium">Taille</th>
              <th className="py-2 pr-4 font-medium">Modifié</th>
            </tr>
          </thead>
          <tbody>
            {objects.map(obj => {
              const checked = selected.includes(obj.name)
              return (
                <tr key={obj.etag} className="border-t last:border-b-0 hover:bg-neutral-50">
                  <td className="py-2 pl-3 pr-4"><input type="checkbox" checked={checked} onChange={() => toggleOne(obj.name)} aria-label={`Sélectionner ${obj.name}`} /></td>
                  <td className="py-2 pr-4 max-w-xs truncate" title={obj.name}>{obj.name}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{formatBytes(obj.size)}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{new Date(obj.lastModified).toLocaleString('fr-FR')}</td>
                </tr>
              )
            })}
            {objects.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-neutral-500">Aucun objet trouvé.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-neutral-500 mt-2">{selected.length} sélectionné(s)</p>
      )}
    </div>
  )
}
