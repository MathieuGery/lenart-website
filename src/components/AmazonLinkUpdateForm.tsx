'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type AmazonLinkUpdateFormProps = {
  orderId: string
  currentAmazonLink: string | null
}

export default function AmazonLinkUpdateForm({ orderId, currentAmazonLink }: AmazonLinkUpdateFormProps) {
  const [amazonLink, setAmazonLink] = useState(currentAmazonLink || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('amazonLink', amazonLink)

      // Utiliser l'action serveur pour mettre à jour le lien Amazon
      const response = await fetch(`/api/orders/${orderId}/update-amazon-link`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la mise à jour du lien Amazon')
      }

      setSuccess('Lien Amazon mis à jour avec succès')

      // Rafraîchir la page pour afficher le nouveau lien
      router.refresh()
    } catch (error) {
      console.error('Erreur:', error)
      setError(error instanceof Error ? error.message : 'Une erreur est survenue lors de la mise à jour du lien Amazon')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-md">
          <p className="text-xs text-green-800">{success}</p>
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="amazonLink" className="block text-sm font-medium text-gray-700 mb-1">
          Lien Amazon
        </label>
        <input
          type="text"
          id="amazonLink"
          value={amazonLink}
          onChange={(e) => setAmazonLink(e.target.value)}
          placeholder="https://amazon.fr/dp/..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-neutral-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Ajoutez ici le lien vers l'album photos Amazon
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2
          ${isLoading
            ? 'bg-neutral-400 cursor-not-allowed'
            : 'bg-neutral-800 hover:bg-neutral-700 focus:ring-neutral-500'
          }`}
      >
        {isLoading ? 'Mise à jour...' : 'Mettre à jour le lien Amazon'}
      </button>
    </form>
  )
}
