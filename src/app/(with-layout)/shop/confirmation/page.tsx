'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { FadeIn } from '@/components/FadeIn'
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { PageIntro } from '@/components/PageIntro'
import { useEffect, useState } from 'react'
import { cancelOrder } from './action'

const CART_STORAGE_KEY = 'shop-cart-items'

export default function OrderConfirmation() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderNumber = searchParams.get('orderNumber')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Nouvel état pour l'email de confirmation
  const [confirmEmail, setConfirmEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  const emptyCart = () => {
    localStorage.removeItem(CART_STORAGE_KEY)
  }

  useEffect(() => {
    // On vide le panier après la confirmation de commande
    emptyCart()
  }, [])

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

        // Redirection après un court délai
        setTimeout(() => {
          router.push('/shop/checkout')
        }, 2000)
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

  return (
    <>
      <PageIntro
        title="Commande confirmée"
        eyebrow="Merci pour votre achat"
      >
        <p>
          Votre commande a bien été enregistrée. Nous vous contacterons prochainement pour finaliser la transaction et vous envoyer vos photos en haute résolution.
        </p>
      </PageIntro>

      <Container className="mt-16 sm:mt-20">
        <FadeIn>
          <div className="bg-white p-8 rounded-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-medium text-gray-900 mb-4">Détails de la commande</h2>

            <div className="border-t border-b py-4 my-4">
              <p className="text-gray-600">Numéro de commande: <span className="font-medium text-gray-900">{orderNumber}</span></p>
              <p className="text-gray-600 mt-2">Un e-mail de confirmation vous a été envoyé.</p>
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
              <Button href="/" className="w-full justify-center">
                Retour à l'accueil
              </Button>

              <button
                onClick={() => setShowConfirmation(true)}
                disabled={isLoading || !!success}
                className="w-full py-3 border border-red-600 text-red-600 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Annulation en cours...' : 'Annuler cette commande'}
              </button>
            </div>
          </div>
        </FadeIn>
      </Container>

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
    </>
  )
}
