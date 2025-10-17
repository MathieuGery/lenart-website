'use client'

import { useState } from 'react'
import { EnvelopeIcon } from '@heroicons/react/24/outline'

type SendEmailButtonProps = {
  orderId: string
  orderNumber: string
  customerName: string
  email: string
  amazonLink: string | null
  formuleName: string
}

export default function SendEmailButton({
  orderId,
  orderNumber,
  customerName,
  email,
  amazonLink,
  formuleName
}: SendEmailButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Vérifier si le bouton peut être activé (lien Amazon présent)
  const isDisabled = !amazonLink || isLoading

  async function handleSendEmail() {
    if (!amazonLink) {
      setError('Le lien Amazon doit être renseigné avant d\'envoyer l\'email')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Appeler notre route API qui elle-même appellera la fonction Edge Supabase
      const response = await fetch(`/api/orders/${orderId}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          orderNumber,
          customerName,
          amazonLink,
          formuleName
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de l\'envoi de l\'email')
      }

      setSuccess('Email envoyé avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      setError(error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'envoi de l\'email')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
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

      <button
        type="button"
        onClick={handleSendEmail}
        disabled={isDisabled}
        className={`w-full inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2
          ${isDisabled
            ? 'bg-neutral-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          }`}
      >
        <EnvelopeIcon className="h-4 w-4 mr-2" />
        {isLoading ? 'Envoi en cours...' : 'Envoyer le lien par email'}
      </button>

      {!amazonLink && (
        <p className="mt-2 text-xs text-gray-500">
          Vous devez d'abord ajouter un lien Amazon pour pouvoir envoyer l'email
        </p>
      )}
    </div>
  )
}
