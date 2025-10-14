'use client'

import React from 'react'

interface GalleryAmz {
  id: number;
  created_at: string;
  link: string;
  date: string;
  title: string;
  code: string;
}

function formatDateISO(d: string) {
  try {
    return new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return d
  }
}

export default function GalleriesManagment({ galleries, error, createAction, updateAction, deleteAction }: { galleries: GalleryAmz[], error: string | null, createAction: (formData: FormData)=>Promise<any>, updateAction: (formData: FormData)=>Promise<any>, deleteAction: (formData: FormData)=>Promise<any> }) {
  const [createError, setCreateError] = React.useState<string | null>(null)
  const [rowErrors, setRowErrors] = React.useState<Record<number,string>>({})
  const [isSubmittingRow, setIsSubmittingRow] = React.useState<Record<number,boolean>>({})
  const [isDeletingRow, setIsDeletingRow] = React.useState<Record<number,boolean>>({})
  const [isCreating, setIsCreating] = React.useState(false)

  async function handleCreate(formData: FormData) {
    setIsCreating(true)
    setCreateError(null)
    const res = await createAction(formData)
    if (!res?.ok) {
      setCreateError(res?.error || 'Erreur inconnue')
    }
    setIsCreating(false)
  }

  async function handleUpdate(formData: FormData) {
    const idRaw = formData.get('id')
    const id = idRaw ? Number(idRaw) : 0
    setRowErrors(prev => ({ ...prev, [id]: '' }))
    setIsSubmittingRow(prev => ({ ...prev, [id]: true }))
    const res = await updateAction(formData)
    if (!res?.ok) {
      setRowErrors(prev => ({ ...prev, [id]: res?.error || 'Erreur inconnue' }))
    }
    setIsSubmittingRow(prev => ({ ...prev, [id]: false }))
  }

  async function handleDelete(formData: FormData) {
    const idRaw = formData.get('id')
    const id = idRaw ? Number(idRaw) : 0
    if (!id) return
    if (!confirm('Supprimer cette galerie définitivement ?')) return
    setIsDeletingRow(prev => ({ ...prev, [id]: true }))
    const res = await deleteAction(formData)
    if (!res?.ok) {
      setRowErrors(prev => ({ ...prev, [id]: res?.error || 'Erreur inconnue' }))
    }
    setIsDeletingRow(prev => ({ ...prev, [id]: false }))
  }

  async function handleDeleteById(id: number) {
    if (!id) return
    if (!confirm('Supprimer cette galerie définitivement ?')) return
    setIsDeletingRow(prev => ({ ...prev, [id]: true }))
    const fd = new FormData()
    fd.set('id', String(id))
    const res = await deleteAction(fd)
    if (!res?.ok) {
      setRowErrors(prev => ({ ...prev, [id]: res?.error || 'Erreur inconnue' }))
    }
    setIsDeletingRow(prev => ({ ...prev, [id]: false }))
  }
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Galeries Amazon</h1>
          <p className="text-sm text-neutral-600 mt-1">Vue d'ensemble des galeries</p>
        </div>
      </div>
      {error && (
        <div className="mb-6 p-4 rounded-md bg-red-50">
          <p className="text-sm text-red-800">Erreur : {error}</p>
        </div>
      )}
  <form action={handleCreate} className="mb-6 space-y-3 bg-neutral-50 border border-neutral-200 rounded-xl p-4">
        <h2 className="text-sm font-medium text-neutral-700">Créer une nouvelle galerie</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input name="title" required placeholder="Titre" className="border border-neutral-300 rounded px-3 py-2 text-sm" />
          <input name="code" required placeholder="Code" className="border border-neutral-300 rounded px-3 py-2 text-sm" />
          <input name="date" type="date" placeholder="Date de l'événement" className="border border-neutral-300 rounded px-3 py-2 text-sm" />
          <input name="link" placeholder="Lien Amazon" className="border border-neutral-300 rounded px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={isCreating} className="px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium disabled:opacity-40">{isCreating ? 'Création...' : 'Créer'}</button>
        {createError && <p className="text-xs text-red-600">{createError}</p>}
      </form>
      <div className="overflow-x-auto border border-neutral-200 rounded-xl">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left bg-neutral-50 text-neutral-700">
              <th className="py-2 px-3 font-medium">Titre</th>
              <th className="py-2 px-3 font-medium">Code</th>
              <th className="py-2 px-3 font-medium">Date événement</th>
              <th className="py-2 px-3 font-medium">Lien</th>
              <th className="py-2 px-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {galleries.map(g => (
              <tr key={g.id} className="border-t last:border-b-0 hover:bg-neutral-50 align-top">
                <td className="py-2 px-3" colSpan={5}>
                  <form action={handleUpdate} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-start">
                    <input type="hidden" name="id" value={g.id} />
                    <input name="title" defaultValue={g.title} className="border border-neutral-300 rounded px-2 py-1 w-full text-xs" />
                    <input name="code" defaultValue={g.code} className="border border-neutral-300 rounded px-2 py-1 w-full text-xs font-mono" />
                    <input name="date" type="date" defaultValue={g.date?.split('T')[0]} className="border border-neutral-300 rounded px-2 py-1 w-full text-xs" />
                    <input name="link" defaultValue={g.link || ''} placeholder="Lien" className="border border-neutral-300 rounded px-2 py-1 w-full text-xs" />
                    <div className="flex gap-2">
                      <button type="submit" disabled={isSubmittingRow[g.id]} className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium disabled:opacity-40">{isSubmittingRow[g.id] ? '...' : 'Sav.'}</button>
                      <button type="button" onClick={() => handleDeleteById(g.id)} disabled={isDeletingRow[g.id]} className="px-2 py-1 rounded bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-40">{isDeletingRow[g.id] ? '...' : 'Supprimer'}</button>
                    </div>
                    {rowErrors[g.id] && <p className="col-span-full text-xs text-red-600">{rowErrors[g.id]}</p>}
                  </form>
                </td>
              </tr>
            ))}
            {galleries.length === 0 && !error && (
              <tr><td colSpan={5} className="py-8 text-center text-neutral-500">Aucune galerie disponible.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
