'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { FadeIn, FadeInStagger } from '@/components/FadeIn'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, ShoppingCartIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

// Type d'image
type ShopImage = {
  name: string
  url: string
  size: number
  lastModified: Date
}

export function ShopGallery({ images }: { images: ShopImage[] }) {
  // États pour la navigation
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  // État pour le panier
  const [cartItems, setCartItems] = useState<ShopImage[]>([])

  // Références pour le swipe
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  // Image sélectionnée calculée à partir de l'index
  const selectedImage = selectedImageIndex !== null ? images[selectedImageIndex] : null

  // Fonctions pour le panier
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

  return (
    <>
      {/* Panier flottant */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 bg-white rounded-lg shadow-lg p-4 max-w-xs w-full">
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
          <div className="max-h-40 overflow-y-auto mb-3">
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
          <button className="bg-teal-600 text-white w-full py-2 rounded hover:bg-teal-700 transition-colors">
            Commander la sélection
          </button>
        </div>
      )}

      <FadeInStagger>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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

                {/* Bouton pour ajouter au panier */}
                <button
                  className={`absolute top-2 right-2 p-2 rounded-full transition-all ${isInCart(image)
                      ? 'bg-teal-600 text-white'
                      : 'bg-white/80 text-gray-700 opacity-0 group-hover:opacity-100'
                    }`}
                  onClick={(e) => toggleCartItem(image, e)}
                  aria-label={isInCart(image) ? "Retirer du panier" : "Ajouter au panier"}
                >
                  {isInCart(image) ? (
                    <CheckCircleIcon className="h-6 w-6" />
                  ) : (
                    <ShoppingCartIcon className="h-5 w-5" />
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

            {/* Ajout du bouton dans la modal pour ajouter l'image au panier */}
            <button
              className={`absolute right-0 top-0 -mt-12 -mr-16 p-3 rounded-full transition-colors ${isInCart(selectedImage)
                  ? 'bg-teal-600 text-white'
                  : 'bg-white/20 text-white hover:bg-white/40'
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
