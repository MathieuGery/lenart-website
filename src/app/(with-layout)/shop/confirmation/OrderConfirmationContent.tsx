'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { FadeIn } from '@/components/FadeIn'
import { Button } from '@/components/Button'
import { cancelOrder, getOrderDetails } from './action'

const CART_STORAGE_KEY = 'shop-cart-items'

type OrderDetails = {
  id: string
  order_number: string
  first_name: string
  last_name: string
  email: string
  phone: string
  status: string
  created_at: string
  formule_name: string
  base_price: number
  extra_photos_count: number
  total_price: number
  items: Array<{
    id: string
    image_name: string
    image_url?: string
  }>
}

export default function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('orderNumber')

  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoadingOrder, setIsLoadingOrder] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  const emptyCart = () => {
    localStorage.removeItem(CART_STORAGE_KEY)
  }

  // Récupérer les détails de la commande
  useEffect(() => {
    if (!orderNumber) return

    const fetchOrderDetails = async () => {
      try {
        const result = await getOrderDetails(orderNumber)

        if (result.success && result.order) {
          setOrder(result.order)
        } else {
          setError(result.error || 'Impossible de récupérer les détails de la commande')
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des détails:', err)
        setError('Une erreur est survenue lors de la récupération des détails de la commande')
      } finally {
        setIsLoadingOrder(false)
      }
    }

    fetchOrderDetails()
    emptyCart() // On vide le panier après la confirmation de commande
  }, [orderNumber])

  // Gérer l'annulation de la commande
  const handleCancelOrder = async () => {
    if (!orderNumber) return

    // Vérifier que l'email est renseigné
    if (!confirmEmail) {
      setEmailError('Veuillez saisir votre adresse email')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')
    setEmailError('')

    try {
      // Appel de l'action serveur pour annuler la commande avec l'email de vérification
      const result = await cancelOrder(orderNumber, confirmEmail)

      if (result.success) {
        setSuccess(result.message || 'Commande annulée avec succès')
        setShowConfirmation(false)
        // Fermer la fenêtre de confirmation
        // Recharger la page pour mettre à jour le statut de la commande
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        // Si l'erreur concerne l'email, l'afficher dans le champ d'email
        if (result.error?.toLowerCase().includes('email')) {
          setEmailError(result.error || 'Email incorrect')
          setShowConfirmation(true) // Garder la fenêtre ouverte
        } else {
          setError(result.error || 'Une erreur est survenue')
          setShowConfirmation(false)
        }
      }
    } catch (err) {
      setError('Une erreur inattendue s\'est produite')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingOrder) {
    return <div className="text-center py-8">Chargement des détails de la commande...</div>
  }

  if (!order) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        {error || "La commande n'a pas pu être trouvée"}
      </div>
    )
  }

  // Déterminer le statut de la commande pour l'affichage
  const getStatusBadge = () => {
    switch (order.status) {
      case 'waiting-for-payment':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">En attente de paiement</span>
      case 'pending':
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">En cours de traitement</span>
      case 'canceled':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">Annulée</span>
      case 'completed':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Complétée</span>
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">{order.status}</span>
    }
  }

  return (
    <FadeIn>
      <div className="bg-white p-8 rounded-lg max-w-2xl mx-auto">
        <h2 className="text-2xl font-medium text-gray-900 mb-1">Détails de la commande</h2>
        <div className="flex items-center mb-6">
          <span className="text-gray-500 mr-2">Statut :</span>
          {getStatusBadge()}
        </div>

        {/* Informations générales */}
        <div className="border-t border-b py-4 my-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Numéro de commande</h3>
              <p className="font-medium text-gray-900 mt-1">{order.order_number}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date</h3>
              <p className="font-medium text-gray-900 mt-1">
                {new Date(order.created_at).toLocaleString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'UTC' // Use UTC to avoid timezone adjustments
                })}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Client</h3>
              <p className="font-medium text-gray-900 mt-1">{order.first_name} {order.last_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="font-medium text-gray-900 mt-1">
                {order.email.replace(
                  /(.{2})(.*)(@)(.*)(\..*)/,
                  (_, start, middle, at, domainName, tld) =>
                    start + '*'.repeat(Math.min(middle.length, 5)) + at +
                    domainName.substring(0, 1) + '*'.repeat(Math.max(domainName.length - 1, 2)) + tld
                )}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Téléphone</h3>
              <p className="font-medium text-gray-900 mt-1">{order.phone}</p>
            </div>
          </div>
        </div>

        {/* Détails de la formule et prix */}
        <div className="border-b py-4 my-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Détails de la formule</h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Formule choisie</h4>
                <p className="font-medium text-gray-900 mt-1">{order.formule_name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Prix de base</h4>
                <p className="font-medium text-gray-900 mt-1">{order.base_price.toFixed(2)}€</p>
              </div>
              {order.extra_photos_count > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Photos supplémentaires</h4>
                  <p className="font-medium text-gray-900 mt-1">{order.extra_photos_count}</p>
                </div>
              )}
              <div className="sm:col-span-2 pt-3 mt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <h4 className="text-base font-semibold text-gray-900">Total</h4>
                  <p className="font-bold text-gray-900 text-lg">{order.total_price.toFixed(2)}€</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des images commandées */}
        <div className="my-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Images sélectionnées ({order.items.length})</h3>

          <div className="space-y-4">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center border rounded-lg p-3">
                {item.image_url && (
                  <div className="w-16 h-16 mr-4 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url}
                      alt={item.image_name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {item.image_name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}
                  </h4>
                  <p className="mt-1 text-xs text-gray-500">Format haute résolution</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md my-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md my-4">
            {success}
          </div>
        )}

        <div className="mt-8 space-y-4">
          <Button href="/shop" className="w-full justify-center">
            Retour à l'accueil
          </Button>

          {order.status === 'waiting-for-payment' && (
            <button
              onClick={() => setShowConfirmation(true)}
              disabled={isLoading || !!success}
              className="w-full py-3 border border-red-600 text-red-600 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Annulation en cours...' : 'Annuler cette commande'}
            </button>
          )}
        </div>
      </div>

      {/* Boîte de dialogue de confirmation avec vérification d'email */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-medium text-gray-900 mb-4">Confirmer l'annulation</h3>
            <p className="text-gray-600 mb-5">
              Pour des raisons de sécurité, veuillez saisir l'adresse email utilisée lors de votre commande.
            </p>

            {/* Champ de saisie email */}
            <div className="mb-5">
              <label htmlFor="confirmEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Votre adresse email
              </label>
              <input
                type="email"
                id="confirmEmail"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="exemple@email.com"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${emailError ? 'border-red-500' : 'border-gray-300'
                  }`}
                disabled={isLoading}
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row-reverse space-y-3 sm:space-y-0 sm:space-x-3 sm:space-x-reverse">
              <button
                onClick={handleCancelOrder}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Vérification...
                  </>
                ) : (
                  'Confirmer l\'annulation'
                )}
              </button>
              <button
                onClick={() => {
                  setShowConfirmation(false)
                  setConfirmEmail('')
                  setEmailError('')
                }}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-70"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </FadeIn>
  )
}
