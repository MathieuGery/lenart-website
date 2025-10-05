'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { FadeIn, FadeInStagger } from '@/components/FadeIn'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, ShoppingCartIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase'

// Type d'image
type ShopImage = {
  name: string
  url: string
  size: number
  lastModified: Date
}

// Type pour les formules de prix
type PricingFormule = {
  id: string
  name: string
  description: string
  base_price: number
  is_featured: boolean
  digital_photos_count: number
  print_details: string | null
  extra_photo_price: number | null
  is_tour_complete: boolean
  features: string[]
}

// Clé de stockage localStorage
const CART_STORAGE_KEY = 'shop-cart-items'

export function ShopGallery({ images }: { images: ShopImage[] }) {
  // États existants
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [cartItems, setCartItems] = useState<ShopImage[]>([])
  const router = useRouter()

  // Nouveaux états pour le pricing
  const [formules, setFormules] = useState<PricingFormule[]>([])
  const [selectedFormule, setSelectedFormule] = useState<PricingFormule | null>(null)
  const [totalPrice, setTotalPrice] = useState<number>(0)
  const [isLoadingPricing, setIsLoadingPricing] = useState(true)

  // Références et autres variables existantes
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  const selectedImage = selectedImageIndex !== null ? images[selectedImageIndex] : null

  // Fonctions de navigation
  const goToNextImage = useCallback(() => {
    if (selectedImageIndex === null) return
    setSelectedImageIndex((selectedImageIndex + 1) % images.length)
  }, [selectedImageIndex, images.length])

  const goToPrevImage = useCallback(() => {
    if (selectedImageIndex === null) return
    setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length)
  }, [selectedImageIndex, images.length])

  // Gestionnaire de touches pour la navigation au clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return

      switch (e.key) {
        case 'ArrowRight':
          goToNextImage()
          break
        case 'ArrowLeft':
          goToPrevImage()
          break
        case 'Escape':
          setSelectedImageIndex(null)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImageIndex, goToNextImage, goToPrevImage])

  // Gestionnaires pour le swipe sur mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  // Modification de la fonction handleTouchEnd pour corriger le sens du glissement
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return

    // Calculer la distance horizontale du swipe
    const distance = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50 // Distance minimale pour considérer comme un swipe

    if (Math.abs(distance) > minSwipeDistance) {
      // Swipe de droite à gauche (distance positive) => image suivante
      if (distance > 0) {
        goToNextImage()
      }
      // Swipe de gauche à droite (distance négative) => image précédente
      else {
        goToPrevImage()
      }
    }

    // Réinitialiser les valeurs
    touchStartX.current = null
    touchEndX.current = null
  }

  // Charger les données du localStorage côté client uniquement
  useEffect(() => {
    const savedCartItems = localStorage.getItem(CART_STORAGE_KEY)
    if (savedCartItems) {
      try {
        setCartItems(JSON.parse(savedCartItems))
      } catch (error) {
        console.error('Erreur lors du chargement du panier:', error)
        localStorage.removeItem(CART_STORAGE_KEY) // Nettoyer les données corrompues
      }
    }
  }, [])

  // Sauvegarder le panier dans localStorage quand il change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
    }
  }, [cartItems])

  // Récupérer les formules depuis Supabase
  useEffect(() => {
    async function fetchPricingFormules() {
      setIsLoadingPricing(true)
      try {
        // Récupérer toutes les formules
        const { data: formulesData, error: formulesError } = await supabase
          .from('pricing_formules')
          .select('*')
          .eq('is_active', true)
          .order('base_price', { ascending: true });

        if (formulesError) throw formulesError;

        // Récupérer toutes les caractéristiques des formules
        const { data: featuresData, error: featuresError } = await supabase
          .from('pricing_features')
          .select('*')
          .order('display_order', { ascending: true });

        if (featuresError) throw featuresError;

        // Associer les caractéristiques à leurs formules respectives
        const enrichedFormules = formulesData.map(formule => {
          const formuleFeatures = featuresData
            .filter(feature => feature.formule_id === formule.id)
            .map(feature => feature.feature_text);

          return {
            ...formule,
            features: formuleFeatures
          };
        });

        setFormules(enrichedFormules);

        // Sélectionner automatiquement la formule la plus adaptée au nombre de photos
        if (cartItems.length > 0 && enrichedFormules.length > 0) {
          const bestFormule = findBestFormule(enrichedFormules, cartItems.length);
          setSelectedFormule(bestFormule);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des formules:', error)
      } finally {
        setIsLoadingPricing(false)
      }
    }

    fetchPricingFormules();
  }, [cartItems.length]);

  // Identifier la meilleure formule en fonction du nombre de photos
  const findBestFormule = (availableFormules: PricingFormule[], photoCount: number) => {
    // Si la collection est complète, utiliser la formule TOUR D'HONNEUR
    // const tourFormule = availableFormules.find(f => f.is_tour_complete);
    // if (tourFormule) {
    //   return tourFormule;
    // }

    // Sinon, trouver la formule qui correspond le mieux au nombre de photos
    for (const formule of availableFormules.filter(f => !f.is_featured)) {
      if (photoCount === formule.digital_photos_count) {
        return formule;
      }
    }

    // Si pas de correspondance exacte, chercher la plus proche inférieure avec supplément possible
    const formulesWithExtra = availableFormules.filter(f => f.extra_photo_price !== null);
    if (formulesWithExtra.length > 0) {
      const bestMatch = formulesWithExtra.sort((a, b) =>
        (photoCount - a.digital_photos_count) - (photoCount - b.digital_photos_count)
      )[0];

      if (photoCount > bestMatch.digital_photos_count) {
        return bestMatch;
      }
    }

    // Par défaut, retourner la formule la moins chère qui peut accommoder le nombre de photos
    const possibleFormules = availableFormules.filter(f =>
      f.digital_photos_count >= photoCount && !f.is_featured
    );

    return possibleFormules.length > 0
      ? possibleFormules.sort((a, b) => a.base_price - b.base_price)[0]
      : availableFormules.find(f => !f.is_featured) || null;
  };

  // Calculer le prix total lorsque le panier ou la formule sélectionnée change
  useEffect(() => {
    if (!selectedFormule || isLoadingPricing) {
      setTotalPrice(0);
      return;
    }

    const photoCount = cartItems.length;

    // Formule tour complet - prix fixe
    if (selectedFormule.is_tour_complete) {
      setTotalPrice(selectedFormule.base_price);
      return;
    }

    // Formule normale avec photos supplémentaires
    let price = selectedFormule.base_price;
    let extraPrice = 0;

    // Calculer le prix des photos supplémentaires si applicable
    if (photoCount > selectedFormule.digital_photos_count && selectedFormule.extra_photo_price) {
      const extraPhotos = photoCount - selectedFormule.digital_photos_count;
      extraPrice = extraPhotos * selectedFormule.extra_photo_price;
      price += extraPrice;
    }

    setTotalPrice(price);

  }, [selectedFormule, cartItems, isLoadingPricing]);

  // Fonctions existantes modifiées
  const isInCart = useCallback((image: ShopImage) => {
    return cartItems.some(item => item.name === image.name)
  }, [cartItems])

  const toggleCartItem = useCallback((image: ShopImage, e?: React.MouseEvent) => {
    // Si un événement est fourni, empêcher la propagation pour éviter d'ouvrir l'image
    if (e) {
      e.stopPropagation()
    }

    setCartItems(prev => {
      // Si l'image est déjà dans le panier, la retirer
      if (isInCart(image)) {
        return prev.filter(item => item.name !== image.name)
      }
      // Sinon, l'ajouter
      return [...prev, image]
    })
  }, [isInCart])

  // Fonction pour changer de formule
  const handleFormuleChange = (formule: PricingFormule) => {
    setSelectedFormule(formule);
  };

  // Fonction pour gérer le checkout
  const handleCheckout = () => {
    if (!selectedFormule) return;

    // Sauvegarde du prix et de la formule sélectionnée (le panier est déjà sauvegardé automatiquement)
    if (typeof window !== 'undefined') {
      localStorage.setItem('shop-cart-total-price', totalPrice.toString());
      localStorage.setItem('shop-cart-formule', JSON.stringify({
        id: selectedFormule.id,
        name: selectedFormule.name,
        base_price: selectedFormule.base_price,
        extra_photos: cartItems.length > selectedFormule.digital_photos_count ?
          cartItems.length - selectedFormule.digital_photos_count : 0,
        extra_photo_price: selectedFormule.extra_photo_price,
      }));
    }

    router.push('/shop/checkout');
  };

  return (
    <>
      {/* Panier flottant modifié pour afficher les formules et prix */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 bg-white rounded-lg shadow-lg p-4 max-w-sm w-full">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <ShoppingCartIcon className="h-5 w-5 text-teal-600 mr-2" />
              <h3 className="font-medium">Votre sélection ({cartItems.length})</h3>
            </div>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setCartItems([])}
            >
              Vider
            </button>
          </div>

          {/* Sélection des photos */}
          <div className="max-h-32 overflow-y-auto mb-3 border-b pb-3">
            {cartItems.map(item => (
              <div key={item.name} className="flex items-center justify-between py-1">
                <span className="text-sm truncate" style={{ maxWidth: '180px' }}>
                  {item.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}
                </span>
                <button
                  className="text-red-500 text-xs hover:text-red-700"
                  onClick={() => toggleCartItem(item)}
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>

          {/* Sélection de formule */}
          {!isLoadingPricing && formules.length > 0 && (
            <div className="mb-4">
              <label htmlFor="formule-select" className="block text-sm font-medium text-gray-700 mb-1">
                Choisissez votre formule :
              </label>
              <select
                id="formule-select"
                value={selectedFormule?.id || ''}
                onChange={(e) => {
                  const selected = formules.find(f => f.id === e.target.value);
                  if (selected) handleFormuleChange(selected);
                }}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="" disabled>Sélectionnez une formule</option>
                {formules
                  .filter(f => !f.is_featured)
                  .map(formule => (
                    <option
                      key={formule.id}
                      value={formule.id}
                      disabled={formule.is_tour_complete === false &&
                        cartItems.length > formule.digital_photos_count &&
                        formule.extra_photo_price === null}
                    >
                      {formule.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Formule sélectionnée et détails */}
          {selectedFormule && (
            <div className="mb-3 bg-gray-50 p-3 rounded-md">
              <h4 className="font-medium text-sm">{selectedFormule.name}</h4>
              <p className="text-xs text-gray-600 mb-2">{selectedFormule.description}</p>

              <ul className="text-xs space-y-1 mb-3">
                {selectedFormule.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircleIcon className="h-4 w-4 text-teal-600 mr-1 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Affichage du détail des prix */}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Prix de base:</span>
                  <span>{selectedFormule.base_price.toFixed(2)}€</span>
                </div>

                {/* Photos supplémentaires si applicable */}
                {selectedFormule.extra_photo_price && (
                  <div className="flex justify-between text-xs mb-1">
                    <span>
                      {cartItems.length - selectedFormule.digital_photos_count} photo(s) supplémentaire(s):
                    </span>
                    <span>{selectedFormule.extra_photo_price * (cartItems.length - selectedFormule.digital_photos_count)}€</span>
                  </div>
                )}

                <div className="flex justify-between font-medium text-sm text-teal-700 mt-1">
                  <span>Total:</span>
                  <span>{totalPrice.toFixed(2)}€</span>
                </div>
              </div>
            </div>
          )}

          <button
            className="bg-teal-600 text-white w-full py-2 rounded hover:bg-teal-700 transition-colors disabled:opacity-50"
            onClick={handleCheckout}
            disabled={isLoadingPricing || !selectedFormule}
          >
            {isLoadingPricing ? 'Chargement...' : `Commander pour ${totalPrice.toFixed(2)}€`}
          </button>
        </div>
      )}

      <FadeInStagger>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {images.length === 0 ? (
            <div className="col-span-full py-10 text-center">
              <p className="text-lg text-gray-600">
                Aucune image n'est disponible pour le moment.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Veuillez revenir plus tard pour découvrir nos photos.
              </p>
            </div>) : <></>}
          {images.map((image, index) => (
            <FadeIn key={image.name}>
              <div
                className="group relative overflow-hidden rounded-lg cursor-pointer"
                onClick={() => setSelectedImageIndex(index)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}
                  className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 transition-opacity duration-300 group-hover:bg-opacity-40" />

                {/* Bouton pour ajouter au panier - optimisé pour mobile */}
                <button
                  className={`absolute top-2 right-2 w-10 h-10 flex items-center justify-center rounded-full transition-all shadow-md
                    ${isInCart(image)
                      ? 'bg-teal-600 text-white'
                      : 'bg-white/90 text-gray-700 md:opacity-0 md:group-hover:opacity-100'
                    }`}
                  onClick={(e) => toggleCartItem(image, e)}
                  aria-label={isInCart(image) ? "Retirer du panier" : "Ajouter au panier"}
                >
                  {isInCart(image) ? (
                    <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    <ShoppingCartIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>

                <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <h3 className="text-lg font-semibold">
                    {image.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}
                  </h3>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </FadeInStagger>

      {/* Modal pour afficher l'image en grand */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4"
          onClick={() => setSelectedImageIndex(null)}
        >
          <div
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute right-0 top-0 -mt-12 text-white hover:text-gray-300 transition-colors"
              onClick={() => setSelectedImageIndex(null)}
            >
              <XMarkIcon className="h-8 w-8" aria-hidden="true" />
              <span className="sr-only">Fermer</span>
            </button>

            {/* Flèche de navigation précédente - améliorée */}
            <button
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-8 p-3 rounded-full bg-white/20 text-white hover:bg-white/40 transition-all focus:outline-none shadow-lg backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevImage();
              }}
              aria-label="Image précédente"
            >
              <ChevronLeftIcon className="h-6 w-6 sm:h-8 sm:w-8" />
            </button>

            {/* Flèche de navigation suivante - améliorée */}
            <button
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-8 p-3 rounded-full bg-white/20 text-white hover:bg-white/40 transition-all focus:outline-none shadow-lg backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                goToNextImage();
              }}
              aria-label="Image suivante"
            >
              <ChevronRightIcon className="h-6 w-6 sm:h-8 sm:w-8" />
            </button>

            {/* Ajout du bouton dans la modal pour ajouter l'image au panier - optimisé pour mobile */}
            <button
              className={`absolute md:right-0 md:top-0 md:-mt-12 md:-mr-16 right-4 bottom-4 w-12 h-12 flex items-center justify-center rounded-full transition-colors shadow-lg ${isInCart(selectedImage)
                ? 'bg-teal-600 text-white'
                : 'bg-white/90 text-gray-700 hover:bg-white'
                }`}
              onClick={(e) => {
                e.stopPropagation()
                toggleCartItem(selectedImage)
              }}
              aria-label={isInCart(selectedImage) ? "Retirer du panier" : "Ajouter au panier"}
            >
              {isInCart(selectedImage) ? (
                <CheckCircleIcon className="h-6 w-6" />
              ) : (
                <ShoppingCartIcon className="h-6 w-6" />
              )}
            </button>

            <div className="bg-white p-2 rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage.url}
                alt={selectedImage.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}
                className="w-full h-auto max-h-[80vh] object-contain"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            </div>

            <div className="text-center mt-4">
              <h2 className="text-xl font-semibold text-white">
                {selectedImage.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}
              </h2>
              <p className="text-white/70 text-sm mt-1">
                {(selectedImageIndex !== null ? selectedImageIndex + 1 : 0)} / {images.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
