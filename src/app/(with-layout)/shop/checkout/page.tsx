'use client'

import { useEffect, useState } from 'react'
import { FadeIn } from '@/components/FadeIn'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/Button'
import { saveOrder, validatePromoCode } from './action'
import { useRouter } from 'next/navigation'

// Type pour les images
type ShopImage = {
  name: string
  bucket_name: string
  url: string
  size: number
  lastModified: Date
  to_print?: boolean
}

// Type pour les données du formulaire
type FormData = {
  firstName: string
  lastName: string
  email: string
}

type FormuleDetails = {
  id: string
  name: string
  base_price: number
  extra_photos: number
  extra_photo_price: number
  print_details?: string | null
  print_photo_count?: number | null
}

// Clé de stockage localStorage
const CART_STORAGE_KEY = 'shop-cart-items'

// Composant client pour afficher les éléments du panier
export default function CheckoutItems() {
  const [cartItems, setCartItems] = useState<ShopImage[]>([])
  const [formuleDetails, setFormuleDetails] = useState<FormuleDetails | null>(null)
  const [totalPrice, setTotalPrice] = useState<number>(0)
  const [originalTotalPrice, setOriginalTotalPrice] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderError, setOrderError] = useState('')
  const router = useRouter()

  // États du formulaire
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: ''
  })

  // États pour le code promo
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<{
    id: string;
    code: string;
    discountAmount: number;
    type: 'percentage' | 'fixed_amount';
    value: number;
  } | null>(null)
  const [promoValidating, setPromoValidating] = useState(false)
  const [promoError, setPromoError] = useState('')

  // État de validité du formulaire
  const [isFormValid, setIsFormValid] = useState(false)

  // États pour les messages d'erreur
  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    email: ''
  })

  // Validation du formulaire
  useEffect(() => {
    const validateForm = () => {
      const errors = {
        firstName: formData.firstName ? '' : 'Le prénom est requis',
        lastName: formData.lastName ? '' : 'Le nom est requis',
        email: formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
          ? ''
          : 'Une adresse email valide est requise',
        }

      setFormErrors(errors)
      setIsFormValid(!Object.values(errors).some(error => error !== ''))
    }

    validateForm()
  }, [formData])

  // Gestion des changements dans le formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  // Valider un code promo
  const handleValidatePromoCode = async () => {
    if (!promoCode.trim() || promoValidating) return;

    setPromoValidating(true);
    setPromoError('');

    try {
      const result = await validatePromoCode(
        promoCode.trim(),
        originalTotalPrice,
        formuleDetails?.id
      );

      if (result.valid && result.promoCode && result.discountAmount !== undefined) {
        setAppliedPromo({
          id: result.promoCode.id,
          code: result.promoCode.code,
          discountAmount: result.discountAmount,
          type: result.promoCode.type,
          value: result.promoCode.value
        });
        setTotalPrice(Math.max(0, originalTotalPrice - result.discountAmount));
        setPromoError('');
      } else {
        setPromoError(result.error || 'Code promo invalide');
        setAppliedPromo(null);
        setTotalPrice(originalTotalPrice);
      }
    } catch (error) {
      setPromoError('Erreur lors de la validation du code promo');
      setAppliedPromo(null);
      setTotalPrice(originalTotalPrice);
    } finally {
      setPromoValidating(false);
    }
  };

  // Supprimer le code promo appliqué
  const handleRemovePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
    setTotalPrice(originalTotalPrice);
  };

  // Traitement de la commande
  const handleSubmitOrder = async () => {
    if (!isFormValid || !formuleDetails) return

    setIsSubmitting(true)
    setOrderError('')

    try {
      // Préparer les données du code promo si applicable
      const promoData = appliedPromo ? {
        id: appliedPromo.id,
        discountAmount: appliedPromo.discountAmount
      } : undefined;

      // Appel de l'action serveur
      const result = await saveOrder(formData, cartItems, formuleDetails, promoData)

      if (result.success) {
        setOrderSuccess(true)
        setTimeout(() => {
          router.push(`/shop/confirmation?orderNumber=${result.orderNumber}`)
        }, 1500)
      } else {
        setOrderError(result.error || 'Une erreur est survenue lors de la commande')
      }
    } catch (error) {
      setOrderError('Une erreur est survenue lors de la commande')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Récupération des éléments du panier, suppression d'un élément, etc...
  useEffect(() => {
    const savedCartItems = localStorage.getItem(CART_STORAGE_KEY)
    const savedFormule = localStorage.getItem('shop-cart-formule')
    const savedTotalPrice = localStorage.getItem('shop-cart-total-price')

    if (savedCartItems) {
      try {
        const parsedItems = JSON.parse(savedCartItems)
        setCartItems(parsedItems)
      } catch (error) {
        console.error('Erreur lors de la récupération du panier:', error)
      }
    }

    if (savedFormule) {
      try {
        const parsedFormule = JSON.parse(savedFormule)
        console.log('Formule récupérée:', parsedFormule)
        if (!parsedFormule.id) {
          throw new Error('Formule ID manquant')
        }
        // S'assurer que print_details et print_photo_count sont présents (pour rétrocompatibilité)
        if (parsedFormule.print_details === undefined) {
          parsedFormule.print_details = null
        }
        if (parsedFormule.print_photo_count === undefined) {
          parsedFormule.print_photo_count = null
        }
        setFormuleDetails(parsedFormule)
      } catch (error) {
        console.error('Erreur lors de la récupération de la formule:', error)
      }
    } else {
      console.error('Formule non trouvée dans le localStorage')
    }

    if (savedTotalPrice) {
      const price = parseFloat(savedTotalPrice)
      setTotalPrice(price)
      setOriginalTotalPrice(price)
    }

    setIsLoading(false)
  }, [])

  const removeFromCart = (itemToRemove: ShopImage) => {
    const updatedCart = cartItems.filter(item => item.name !== itemToRemove.name)
    setCartItems(updatedCart)
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart))
  }

  // Fonction pour marquer/démarquer une image pour impression
  const toggleImageToPrint = (imageName: string) => {
    const currentSelectedCount = cartItems.filter(item => item.to_print).length
    const maxPrintPhotos = formuleDetails?.print_photo_count || 0
    
    const updatedCart = cartItems.map(item => {
      if (item.name === imageName) {
        // Si on veut cocher et qu'on a atteint la limite
        if (!item.to_print && currentSelectedCount >= maxPrintPhotos) {
          return item // Ne pas modifier
        }
        return { ...item, to_print: !item.to_print }
      }
      return item
    })
    
    setCartItems(updatedCart)
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart))
  }

  // Vérifier si la formule inclut des impressions
  const hasImpressions = formuleDetails?.print_details !== null && formuleDetails?.print_details !== undefined && formuleDetails?.print_details !== ''
  const maxPrintPhotos = formuleDetails?.print_photo_count || 0
  const currentSelectedForPrint = cartItems.filter(item => item.to_print).length

  const emptyCart = () => {
    setCartItems([])
    localStorage.removeItem(CART_STORAGE_KEY)
  }

  if (isLoading) {
    return <div className="text-center py-8">Chargement de votre sélection...</div>
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-medium text-gray-900 mb-4">Votre panier est vide</h2>
        <p className="text-gray-500 mb-6">Vous n'avez pas encore sélectionné d'images.</p>
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-neutral-800 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 transition-colors"
        >
          Retour à la galerie
        </button>
      </div>
    )
  }

  return (
    <FadeIn>
      <div className="py-8 px-10">
        {/* Bouton de retour vers la galerie */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-neutral-600 hover:text-neutral-800 transition-colors group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à la galerie
          </button>
        </div>

        <h2 className="text-2xl font-medium text-gray-900 mb-8">Votre sélection ({cartItems.length} images)</h2>

        {/* Liste des images dans le panier */}
        <FadeIn>
          {hasImpressions && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Sélection pour impression</h4>
                  <p className="text-sm text-blue-700">
                    Votre formule inclut des impressions : <strong>{formuleDetails?.print_details}</strong>
                    <br />
                    Sélectionnez {maxPrintPhotos} image{maxPrintPhotos > 1 ? 's' : ''} maximum à imprimer 
                    ({currentSelectedForPrint}/{maxPrintPhotos} sélectionnée{currentSelectedForPrint > 1 ? 's' : ''})
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cartItems.map((item) => (
              <div key={item.name} className="flex border rounded-lg overflow-hidden relative group border-gray-400 shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}
                  className="w-32 h-32 object-cover"
                />
                <div className="p-4 flex flex-col justify-between flex-grow">
                  <div>
                    <h3 className="font-medium">
                      {item.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Haute résolution
                    </p>
                  </div>
                  
                  {/* Case à cocher pour impression si la formule l'inclut */}
                  {hasImpressions && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <label className={`flex items-center ${
                        !item.to_print && currentSelectedForPrint >= maxPrintPhotos 
                          ? 'cursor-not-allowed opacity-50' 
                          : 'cursor-pointer'
                      }`}>
                        <input
                          type="checkbox"
                          checked={item.to_print || false}
                          onChange={() => toggleImageToPrint(item.name)}
                          disabled={!item.to_print && currentSelectedForPrint >= maxPrintPhotos}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-600">À imprimer</span>
                      </label>
                      {!item.to_print && currentSelectedForPrint >= maxPrintPhotos && (
                        <p className="text-xs text-gray-500 mt-1">
                          Limite atteinte ({maxPrintPhotos} photo{maxPrintPhotos > 1 ? 's' : ''} max)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Bouton de suppression */}
                {/* <button
                  className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-600 rounded-full 
                            transition-all duration-200 transform hover:scale-125 hover:bg-red-100 
                            focus:outline-none focus:ring-2 focus:ring-red-500"
                  onClick={() => removeFromCart(item)}
                  aria-label="Supprimer du panier"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button> */}
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Formulaire de contact */}
        <div className="mt-12 border-t pt-8">
          <h3 className="text-xl font-medium mb-6">Vos informations de contact</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Prénom */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                Prénom <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder='Jean'
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-700"
                required
              />
              {formErrors.firstName && (
                <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
              )}
            </div>

            {/* Nom */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Nom <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder='Dupont'
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-700"
                required
              />
              {formErrors.lastName && (
                <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                placeholder='exemple@domaine.com'
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-700"
                required
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section Code Promo */}
        <div className="mt-8 border-t pt-8">
          <h3 className="text-xl font-medium mb-6">Code promo</h3>
          
          {!appliedPromo ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Entrez votre code promo"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-700"
                  disabled={promoValidating}
                />
                <button
                  onClick={handleValidatePromoCode}
                  disabled={!promoCode.trim() || promoValidating}
                  className="px-4 py-2 text-white rounded-md bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {promoValidating ? 'Validation...' : 'Appliquer'}
                </button>
              </div>
              {promoError && (
                <p className="mt-2 text-sm text-red-600">{promoError}</p>
              )}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="font-medium text-green-800">Code promo appliqué : {appliedPromo.code}</p>
                    <p className="text-sm text-green-600">
                      Remise de {appliedPromo.type === 'percentage' 
                        ? `${appliedPromo.value}%` 
                        : `${appliedPromo.value}€`
                      } - Économie : {appliedPromo.discountAmount.toFixed(2)}€
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemovePromoCode}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Retirer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Récapitulatif de commande modifié */}
        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Récapitulatif de votre commande</h3>

          {formuleDetails && (
            <div className="mb-4 pb-4 border-b">
              <h4 className="font-medium">{formuleDetails.name}</h4>
              <div className="mt-2 space-y-1 text-sm">
                <p className="flex justify-between">
                  <span>Prix de base:</span>
                  <span>{formuleDetails.base_price.toFixed(2)}€</span>
                </p>

                {formuleDetails.extra_photos > 0 && (
                  <p className="flex justify-between">
                    <span>{formuleDetails.extra_photos} photo(s) supplémentaire(s):</span>
                    <span>{(formuleDetails.extra_photo_price * formuleDetails.extra_photos).toFixed(2)}€</span>
                  </p>
                )}

                <p className="flex justify-between font-medium text-base pt-1 border-t">
                  <span>Sous-total:</span>
                  <span>{originalTotalPrice.toFixed(2)}€</span>
                </p>

                {appliedPromo && (
                  <p className="flex justify-between text-green-600">
                    <span>Remise ({appliedPromo.code}):</span>
                    <span>-{appliedPromo.discountAmount.toFixed(2)}€</span>
                  </p>
                )}

                <p className="flex justify-between font-bold text-lg text-neutral-700 pt-2 border-t">
                  <span>Total:</span>
                  <span>{totalPrice.toFixed(2)}€</span>
                </p>
              </div>
            </div>
          )}

          {/* Liste des photos sélectionnées */}
          <div>
            <h4 className="font-medium mb-2">
              Photos sélectionnées ({cartItems.length})
              {hasImpressions && (
                <span className="text-sm font-normal text-blue-600 ml-2">
                  ({cartItems.filter(item => item.to_print).length} à imprimer)
                </span>
              )}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {cartItems.map(item => (
                <div key={item.name} className="text-sm truncate flex items-center">
                  <span>{item.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}</span>
                  {hasImpressions && item.to_print && (
                    <span className="ml-1 text-blue-600" title="À imprimer">🖨️</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Total et boutons d'action */}
        <div className="mt-10 border-t pt-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Total</h3>
            <span className="text-xl font-bold">{cartItems.length} photos</span>
          </div>

          {orderSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-4">
              Votre commande a été enregistrée avec succès. Vous allez être redirigé...
            </div>
          )}

          {orderError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
              {orderError}
            </div>
          )}

          <button
            className={`w-full py-3 rounded-md transition-colors ${isFormValid && !isSubmitting
              ? 'bg-teal-600 text-white hover:bg-teal-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            onClick={handleSubmitOrder}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? 'Traitement en cours...' : 'Finaliser la commande'}
          </button>

          <Button
            className="mt-5 w-full text-gray-900 py-3 rounded-md hover:bg-gray-900 border border-gray-900 transition-colors justify-center"
            onClick={() => emptyCart()}
            disabled={isSubmitting}
          >
            Vider le panier
          </Button>
        </div>

        {/* Overlay et loader pendant la création de la commande */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 max-w-sm w-full shadow-2xl">
              <div className="flex flex-col items-center">
                {/* Loader spinner */}
                <div className="w-16 h-16 border-4 border-t-teal-600 border-teal-200 rounded-full animate-spin mb-5"></div>

                <h3 className="text-lg font-medium text-gray-900 mb-2">Traitement en cours...</h3>
                <p className="text-sm text-gray-500 text-center">
                  Veuillez patienter pendant que nous enregistrons votre commande.
                  Ne fermez pas cette fenêtre.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </FadeIn>
  )
}
