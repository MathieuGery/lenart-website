'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

type ShopImage = {
  name: string
  bucket_name: string
  url: string
  size: number
  lastModified: Date
  to_print?: boolean | undefined
}

type PhotoSelectorProps = {
  selectedPhotos: ShopImage[]
  onPhotosChange: (photos: ShopImage[]) => void
  printLimit?: number
}

export default function PhotoSelector({ selectedPhotos, onPhotosChange, printLimit }: PhotoSelectorProps) {
  const [buckets, setBuckets] = useState<{ name: string; creationDate: Date }[]>([])
  const [selectedBucket, setSelectedBucket] = useState<string>('')
  const [photos, setPhotos] = useState<ShopImage[]>([])
  const [isLoadingBuckets, setIsLoadingBuckets] = useState(false)
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [printSelections, setPrintSelections] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [manualSelection, setManualSelection] = useState('')

  // Charger les buckets disponibles
  useEffect(() => {
    async function loadBuckets() {
      setIsLoadingBuckets(true)
      try {
        const response = await fetch('/api/buckets')
        const data = await response.json()
        if (data.success) {
          setBuckets(data.buckets)
          if (data.buckets.length > 0) {
            setSelectedBucket(data.buckets[0].name)
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des buckets:', error)
      } finally {
        setIsLoadingBuckets(false)
      }
    }
    loadBuckets()
  }, [])

  // Charger les photos du bucket sélectionné
  useEffect(() => {
    if (!selectedBucket) return

    async function loadPhotos() {
      setIsLoadingPhotos(true)
      try {
        const response = await fetch(`/api/buckets/${selectedBucket}/images`)
        const data = await response.json()
        if (data.success) {
          setPhotos(data.images)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des photos:', error)
      } finally {
        setIsLoadingPhotos(false)
      }
    }
    loadPhotos()
  }, [selectedBucket])

  // Initialiser les sélections d'impression depuis les photos sélectionnées
  useEffect(() => {
    const newPrintSelections: Record<string, boolean> = {}
    selectedPhotos.forEach(photo => {
      newPrintSelections[photo.name] = photo.to_print || false
    })
    setPrintSelections(newPrintSelections)
  }, [selectedPhotos])

  const isPhotoSelected = (photo: ShopImage) => {
    return selectedPhotos.some(selected => selected.name === photo.name && selected.bucket_name === photo.bucket_name)
  }

  const togglePhotoSelection = (photo: ShopImage) => {
    const isSelected = isPhotoSelected(photo)

    if (isSelected) {
      // Retirer la photo
      const newSelectedPhotos = selectedPhotos.filter(
        selected => !(selected.name === photo.name && selected.bucket_name === photo.bucket_name)
      )
      onPhotosChange(newSelectedPhotos)

      // Retirer la sélection d'impression
      const newPrintSelections = { ...printSelections }
      delete newPrintSelections[photo.name]
      setPrintSelections(newPrintSelections)
    } else {
      // Ajouter la photo
      const photoWithPrint = { ...photo, to_print: false }
      onPhotosChange([...selectedPhotos, photoWithPrint])
    }
  }

  const togglePrintSelection = (photoName: string) => {
    const currentPrintCount = Object.values(printSelections).filter(Boolean).length
    const isPrintSelected = printSelections[photoName]

    // Vérifier la limite si on ajoute une impression
    if (!isPrintSelected && printLimit && currentPrintCount >= printLimit) {
      alert(`Vous ne pouvez sélectionner que ${printLimit} photo(s) maximum pour l'impression.`)
      return
    }

    const newPrintSelections = {
      ...printSelections,
      [photoName]: !isPrintSelected
    }
    setPrintSelections(newPrintSelections)

    // Mettre à jour les photos sélectionnées avec le statut d'impression
    const newSelectedPhotos = selectedPhotos.map(photo =>
      photo.name === photoName
        ? { ...photo, to_print: !isPrintSelected }
        : photo
    )
    onPhotosChange(newSelectedPhotos)
  }

  const currentPrintCount = Object.values(printSelections).filter(Boolean).length

  // Filtrer les photos selon le terme de recherche
  const filteredPhotos = photos.filter(photo =>
    photo.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Fonction pour sélectionner toutes les photos filtrées
  const selectAllFilteredPhotos = () => {
    const photosToAdd = filteredPhotos.filter(photo => !isPhotoSelected(photo))
    if (photosToAdd.length > 0) {
      onPhotosChange([...selectedPhotos, ...photosToAdd.map(photo => ({ ...photo, to_print: false }))])
    }
  }

  // Fonction pour désélectionner toutes les photos filtrées
  const deselectAllFilteredPhotos = () => {
    const filteredPhotoKeys = filteredPhotos.map(photo => `${photo.bucket_name}-${photo.name}`)
    const newSelectedPhotos = selectedPhotos.filter(
      selected => !filteredPhotoKeys.includes(`${selected.bucket_name}-${selected.name}`)
    )
    onPhotosChange(newSelectedPhotos)

    // Retirer les sélections d'impression pour les photos désélectionnées
    const newPrintSelections = { ...printSelections }
    filteredPhotos.forEach(photo => {
      delete newPrintSelections[photo.name]
    })
    setPrintSelections(newPrintSelections)
  }

  // Fonction pour sélectionner des photos par noms (séparés par des virgules)
  const selectPhotosByNames = () => {
    if (!manualSelection.trim()) return

    const photoNames = manualSelection
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0)

    const photosToAdd: ShopImage[] = []

    photoNames.forEach(searchName => {
      // Recherche exacte d'abord
      let foundPhoto = photos.find(photo => photo.name === searchName)

      // Si pas trouvé, recherche partielle (contient le terme)
      if (!foundPhoto) {
        foundPhoto = photos.find(photo =>
          photo.name.toLowerCase().includes(searchName.toLowerCase())
        )
      }

      // Si trouvé et pas déjà sélectionné, l'ajouter
      if (foundPhoto && !isPhotoSelected(foundPhoto)) {
        photosToAdd.push({ ...foundPhoto, to_print: false })
      }
    })

    if (photosToAdd.length > 0) {
      onPhotosChange([...selectedPhotos, ...photosToAdd])
      setManualSelection('') // Vider le champ après sélection
    }
  }

  if (!isExpanded) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Photos sélectionnées ({selectedPhotos.length})
          </label>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ChevronDownIcon className="h-4 w-4 mr-1" />
            Sélectionner des photos
          </button>
        </div>

        {selectedPhotos.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {selectedPhotos.slice(0, 8).map((photo) => (
              <div key={`${photo.bucket_name}-${photo.name}`} className="aspect-square rounded-lg overflow-hidden border border-gray-200 relative">
                <Image
                  src={photo.url}
                  alt={photo.name}
                  fill
                  className="object-cover"
                />
                {photo.to_print && (
                  <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded">
                    🖨️
                  </div>
                )}
              </div>
            ))}
            {selectedPhotos.length > 8 && (
              <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <span className="text-sm text-gray-500">+{selectedPhotos.length - 8}</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Sélection des photos ({selectedPhotos.length} sélectionnées)
          {printLimit && (
            <span className="text-blue-600 ml-2">
              - {currentPrintCount}/{printLimit} à imprimer
            </span>
          )}
        </label>
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ChevronUpIcon className="h-4 w-4 mr-1" />
          Fermer
        </button>
      </div>

      {/* Sélection du bucket */}
      <div>
        <label htmlFor="bucket-select" className="block text-sm font-medium text-gray-700 mb-2">
          Collection
        </label>
        <select
          id="bucket-select"
          value={selectedBucket}
          onChange={(e) => setSelectedBucket(e.target.value)}
          disabled={isLoadingBuckets}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {isLoadingBuckets ? (
            <option>Chargement...</option>
          ) : (
            buckets.map((bucket) => (
              <option key={bucket.name} value={bucket.name}>
                {bucket.name}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Barre de recherche et actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <label htmlFor="search-photos" className="sr-only">
            Rechercher des photos
          </label>
          <div className="relative">
            <input
              type="text"
              id="search-photos"
              placeholder="Rechercher par nom de fichier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          {searchTerm && (
            <p className="mt-1 text-xs text-gray-500">
              {filteredPhotos.length} photo(s) trouvée(s)
            </p>
          )}
        </div>

        {/* Actions de sélection en masse */}
        {searchTerm && filteredPhotos.length > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAllFilteredPhotos}
              className="inline-flex items-center px-3 py-1.5 border border-green-300 shadow-sm text-xs font-medium rounded text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Tout sélectionner
            </button>
            <button
              type="button"
              onClick={deselectAllFilteredPhotos}
              className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Tout désélectionner
            </button>
          </div>
        )}
      </div>

      {/* Sélection manuelle par noms */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label htmlFor="manual-selection" className="block text-sm font-medium text-blue-900 mb-2">
          Sélection par noms de fichiers
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="manual-selection"
            placeholder="Ex: IMG_001.jpg, photo123, DSC_456..."
            value={manualSelection}
            onChange={(e) => setManualSelection(e.target.value)}
            className="flex-1 px-3 py-2 border border-blue-300 rounded-md leading-5 bg-white placeholder-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                selectPhotosByNames()
              }
            }}
          />
          <button
            type="button"
            onClick={selectPhotosByNames}
            disabled={!manualSelection.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-neutral-800 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ajouter
          </button>
        </div>
        <p className="mt-1 text-xs text-blue-600">
          Séparez les noms par des virgules. Recherche exacte puis partielle si nécessaire.
        </p>
      </div>

      {/* Galerie de photos */}
      {isLoadingPhotos ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-96 overflow-y-auto p-4 border border-gray-200 rounded-lg bg-gray-50">
          {filteredPhotos.map((photo) => {
            const isSelected = isPhotoSelected(photo)
            const isPrintSelected = printSelections[photo.name] || false

            return (
              <div key={`${photo.bucket_name}-${photo.name}`} className="relative group">
                <div
                  className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${isSelected
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                  onClick={() => togglePhotoSelection(photo)}
                  title={photo.name} // Tooltip avec le nom du fichier
                >
                  <Image
                    src={photo.url}
                    alt={photo.name}
                    fill
                    className="object-cover"
                  />

                  {/* Indicateur de sélection */}
                  {isSelected && (
                    <div className="absolute top-1 left-1 bg-blue-600 text-white rounded-full p-1">
                      <CheckCircleIcon className="h-4 w-4" />
                    </div>
                  )}

                  {/* Overlay avec nom de fichier au survol */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-xs text-white font-medium break-words line-clamp-2">
                        {photo.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bouton d'impression (seulement si la photo est sélectionnée) */}
                {isSelected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      togglePrintSelection(photo.name)
                    }}
                    className={`absolute bottom-1 right-1 text-xs px-2 py-1 rounded transition-all ${isPrintSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    title={isPrintSelected ? 'Ne pas imprimer' : 'Imprimer'}
                  >
                    🖨️
                  </button>
                )}
              </div>
            )
          })}

          {filteredPhotos.length === 0 && searchTerm && (
            <div className="col-span-full flex flex-col items-center justify-center py-8 text-gray-500">
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm">Aucune photo trouvée pour "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
