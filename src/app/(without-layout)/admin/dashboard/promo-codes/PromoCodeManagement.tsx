'use client'

import { useState, useTransition, useOptimistic } from 'react'
import { PromoCode, createPromoCode, updatePromoCode, deletePromoCode, togglePromoCodeStatus } from './action'

interface PromoCodeManagementProps {
  initialPromoCodes: PromoCode[]
}

type OptimisticAction =
  | { type: 'create'; promoCode: Omit<PromoCode, 'id' | 'usage_count' | 'created_at' | 'updated_at'> }
  | { type: 'update'; id: string; updates: Partial<PromoCode> }
  | { type: 'delete'; id: string }
  | { type: 'toggle'; id: string; isActive: boolean }

function optimisticReducer(state: PromoCode[], action: OptimisticAction): PromoCode[] {
  switch (action.type) {
    case 'create':
      return [{
        ...action.promoCode,
        id: 'temp-' + Date.now(),
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, ...state]
    case 'update':
      return state.map(promo =>
        promo.id === action.id
          ? { ...promo, ...action.updates, updated_at: new Date().toISOString() }
          : promo
      )
    case 'delete':
      return state.filter(promo => promo.id !== action.id)
    case 'toggle':
      return state.map(promo =>
        promo.id === action.id
          ? { ...promo, is_active: action.isActive }
          : promo
      )
    default:
      return state
  }
}

export default function PromoCodeManagement({ initialPromoCodes }: PromoCodeManagementProps) {
  const [promoCodes, setOptimisticPromoCodes] = useOptimistic(initialPromoCodes, optimisticReducer)
  const [isPending, startTransition] = useTransition()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (formData: FormData) => {
    const promoCodeData = {
      code: (formData.get('code') as string).toUpperCase(),
      description: formData.get('description') as string,
      type: formData.get('type') as 'percentage' | 'fixed_amount',
      value: parseFloat(formData.get('value') as string),
      usage_limit: formData.get('usage_limit')
        ? parseInt(formData.get('usage_limit') as string)
        : null,
      is_active: formData.get('is_active') === 'on'
    }

    startTransition(() => {
      setOptimisticPromoCodes({ type: 'create', promoCode: promoCodeData })
    })

    const result = await createPromoCode(formData)
    if (!result.success) {
      setError(result.error || 'Erreur lors de la création')
      // Recharger la page pour annuler l'update optimistic en cas d'erreur
    } else {
      setShowCreateForm(false)
      setError(null)
    }
  }

  const handleUpdate = async (id: string, formData: FormData) => {
    const updates = {
      code: (formData.get('code') as string).toUpperCase(),
      description: formData.get('description') as string,
      type: formData.get('type') as 'percentage' | 'fixed_amount',
      value: parseFloat(formData.get('value') as string),
      usage_limit: formData.get('usage_limit')
        ? parseInt(formData.get('usage_limit') as string)
        : null,
      is_active: formData.get('is_active') === 'on'
    }

    startTransition(() => {
      setOptimisticPromoCodes({ type: 'update', id, updates })
    })

    const result = await updatePromoCode(id, formData)
    if (!result.success) {
      setError(result.error || 'Erreur lors de la mise à jour')
    } else {
      setEditingId(null)
      setError(null)
    }
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus

    startTransition(() => {
      setOptimisticPromoCodes({ type: 'toggle', id, isActive: newStatus })
    })

    const result = await togglePromoCodeStatus(id, newStatus)
    if (!result.success) {
      setError(result.error || 'Erreur lors du changement de statut')
    } else {
      setError(null)
    }
  }

  const isExhausted = (usageLimit: number | null, usageCount: number) => {
    if (!usageLimit) return false
    return usageCount >= usageLimit
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des codes promo</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-md font-medium"
          disabled={isPending}
        >
          + Nouveau code promo
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Créer un nouveau code promo</h3>
          <PromoCodeForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            isPending={isPending}
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remise</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Création</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {promoCodes.map((promoCode) => (
              <tr key={promoCode.id} className={isPending ? 'opacity-50' : ''}>
                {editingId === promoCode.id ? (
                  <PromoCodeEditRow
                    promoCode={promoCode}
                    onSubmit={(formData) => handleUpdate(promoCode.id, formData)}
                    onCancel={() => setEditingId(null)}
                    isPending={isPending}
                  />
                ) : (
                  <PromoCodeRow
                    promoCode={promoCode}
                    onEdit={() => setEditingId(promoCode.id)}
                    onToggle={() => handleToggle(promoCode.id, promoCode.is_active)}
                    isExhausted={isExhausted}
                    isPending={isPending}
                  />
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {promoCodes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Aucun code promo trouvé. Créez-en un pour commencer.
        </div>
      )}
    </div>
  )
}

// Composant pour le formulaire de création
function PromoCodeForm({
  onSubmit,
  onCancel,
  isPending,
  initialData
}: {
  onSubmit: (formData: FormData) => void
  onCancel: () => void
  isPending: boolean
  initialData?: PromoCode
}) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
        <input
          type="text"
          name="code"
          required
          defaultValue={initialData?.code}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: WELCOME10"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input
          type="text"
          name="description"
          defaultValue={initialData?.description || ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Description du code promo"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type de remise *</label>
        <select
          name="type"
          required
          defaultValue={initialData?.type}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="percentage">Pourcentage</option>
          <option value="fixed_amount">Montant fixe (€)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Valeur *</label>
        <input
          type="number"
          name="value"
          required
          step="0.01"
          min="0"
          defaultValue={initialData?.value}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="10 ou 15.50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Limite d'utilisation</label>
        <input
          type="number"
          name="usage_limit"
          min="1"
          defaultValue={initialData?.usage_limit || ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Illimité si vide"
        />
      </div>



      <div className="flex items-center">
        <input
          type="checkbox"
          name="is_active"
          id="is_active"
          defaultChecked={initialData?.is_active ?? true}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
          Code actif
        </label>
      </div>

      <div className="md:col-span-2 flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md disabled:opacity-50"
        >
          {isPending ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}

// Composant pour l'édition en ligne
function PromoCodeEditRow({
  promoCode,
  onSubmit,
  onCancel,
  isPending
}: {
  promoCode: PromoCode
  onSubmit: (formData: FormData) => void
  onCancel: () => void
  isPending: boolean
}) {
  return (
    <>
      <td colSpan={7} className="px-6 py-4">
        <PromoCodeForm
          onSubmit={onSubmit}
          onCancel={onCancel}
          isPending={isPending}
          initialData={promoCode}
        />
      </td>
    </>
  )
}

// Composant pour l'affichage d'une ligne
function PromoCodeRow({
  promoCode,
  onEdit,
  onToggle,
  isExhausted,
  isPending
}: {
  promoCode: PromoCode
  onEdit: () => void
  onToggle: () => void
  isExhausted: (limit: number | null, count: number) => boolean
  isPending: boolean
}) {
  const exhausted = isExhausted(promoCode.usage_limit, promoCode.usage_count)
  const inactive = !promoCode.is_active || exhausted

  return (
    <>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{promoCode.code}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">{promoCode.description || '-'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {promoCode.type === 'percentage' ? `${promoCode.value}%` : `${promoCode.value}€`}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {promoCode.usage_count} / {promoCode.usage_limit || '∞'}
        </div>
        {exhausted && (
          <div className="text-xs text-red-600">Épuisé</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={onToggle}
          disabled={isPending}
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${inactive
            ? 'bg-red-100 text-red-800'
            : 'bg-green-100 text-green-800'
            }`}
        >
          {inactive ? 'Inactif' : 'Actif'}
        </button>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">{new Date(promoCode.created_at).toLocaleDateString('fr-FR')}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
        <button
          onClick={onEdit}
          disabled={isPending}
          className="text-neutral-800 hover:text-neutral-900 disabled:opacity-50"
        >
          Modifier
        </button>
      </td>
    </>
  )
}
