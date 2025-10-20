'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createOrder } from '@/app/(without-layout)/admin/dashboard/orders/action'
import PhotoSelector from './PhotoSelector'

type FormuleOption = {
  id: string
  name: string
  description: string
  base_price: number
  print_details: string | null
  print_photo_count: number | null
}

type ShopImage = {
  name: string
  bucket_name: string
  url: string
  size: number
  lastModified: Date
  to_print?: boolean
}

type FormData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  formuleId: string
  status: 'waiting-for-payment' | 'pending' | 'completed'
  amazonLink: string
}

export default function CreateOrderForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    formuleId: '',
    status: 'pending',
    amazonLink: ''
  })
  const [formules, setFormules] = useState<FormuleOption[]>([])
  const [selectedPhotos, setSelectedPhotos] = useState<ShopImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isFormValid, setIsFormValid] = useState(false)

  // Charger les formules disponibles
  useEffect(() => {
    async function loadFormules() {
      try {
        const response = await fetch('/api/formules')
        const data = await response.json()
        if (data.success) {
          setFormules(data.formules)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des formules:', error)
      }
    }
    loadFormules()
  }, [])

  // Validation du formulaire
  useEffect(() => {
    const isValid = formData.firstName.trim() !== '' &&
      formData.lastName.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.formuleId !== '' &&
      selectedPhotos.length > 0 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    setIsFormValid(isValid)
  }, [formData, selectedPhotos])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    setIsLoading(true)
    setError('')

    try {
      const selectedFormule = formules.find(f => f.id === formData.formuleId)
      if (!selectedFormule) {
        throw new Error('Formule non trouvée')
      }

      const result = await createOrder({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        formule: selectedFormule,
        status: formData.status,
        amazonLink: formData.amazonLink || null,
        selectedPhotos: selectedPhotos
      })

      if (result.success) {
        router.push(`/admin/dashboard/orders/${result.orderId}`)
      } else {
        setError(result.error || 'Erreur lors de la création de la commande')
      }
    } catch (error) {
      setError('Erreur lors de la création de la commande')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedFormule = formules.find(f => f.id === formData.formuleId)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informations client */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Informations client</h3>

          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Téléphone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Détails de la commande */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Détails de la commande</h3>

          <div>
            <label htmlFor="formuleId" className="block text-sm font-medium text-gray-700">
              Formule <span className="text-red-500">*</span>
            </label>
            <select
              id="formuleId"
              name="formuleId"
              value={formData.formuleId}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Sélectionner une formule</option>
              {formules.map(formule => (
                <option key={formule.id} value={formule.id}>
                  {formule.name} - {formule.base_price.toFixed(2)}€
                </option>
              ))}
            </select>
          </div>

          {selectedFormule && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-900">{selectedFormule.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{selectedFormule.description}</p>
              <p className="text-sm text-gray-900 mt-2">Prix de base: {selectedFormule.base_price.toFixed(2)}€</p>
              {selectedFormule.print_details && (
                <p className="text-sm text-blue-600 mt-1">
                  Inclut: {selectedFormule.print_details}
                  {selectedFormule.print_photo_count && ` (${selectedFormule.print_photo_count} photos max)`}
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Statut
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="waiting-for-payment">En attente de paiement</option>
              <option value="pending">En cours de traitement</option>
              <option value="completed">Terminée</option>
            </select>
          </div>

          <div>
            <label htmlFor="amazonLink" className="block text-sm font-medium text-gray-700">
              Lien Amazon (optionnel)
            </label>
            <input
              type="url"
              id="amazonLink"
              name="amazonLink"
              value={formData.amazonLink}
              onChange={handleInputChange}
              placeholder="https://amazon.fr/..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Sélection des photos */}
      <div className="col-span-full">
        <PhotoSelector
          selectedPhotos={selectedPhotos}
          onPhotosChange={setSelectedPhotos}
          printLimit={selectedFormule?.print_photo_count || undefined}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isFormValid && !isLoading
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
            }`}
          title={
            !isFormValid && selectedPhotos.length === 0
              ? 'Veuillez sélectionner au moins une photo'
              : undefined
          }
        >
          {isLoading ? 'Création...' : 'Créer la commande'}
        </button>
      </div>
    </form>
  )
}
