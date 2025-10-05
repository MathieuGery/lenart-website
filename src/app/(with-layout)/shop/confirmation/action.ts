'use server'

import { supabase } from '@/utils/supabase'
import { createPresignedUrlToDownload } from '@/utils/s3'
import { revalidatePath } from 'next/cache'

type CancelOrderResult = {
  success: boolean
  message?: string
  error?: string
}

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
    bucket_name: string
    image_url?: string
  }>
}

export async function getOrderDetails(orderNumber: string): Promise<{
  success: boolean
  order?: OrderDetails
  error?: string
}> {
  try {
    if (!orderNumber) {
      return { success: false, error: 'Numéro de commande manquant' }
    }

    // Récupérer les informations principales de la commande
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, first_name, last_name, email, phone, status, created_at, formule_name, base_price, extra_photos_count, total_price')
      .eq('order_number', orderNumber)
      .single()

    if (orderError || !orderData) {
      console.error('Erreur lors de la récupération de la commande:', orderError?.message || 'Commande introuvable')
      return {
        success: false,
        error: 'Impossible de trouver cette commande'
      }
    }

    // Récupérer les items de la commande
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('id, image_name, bucket_name')
      .eq('order_id', orderData.id)

    if (itemsError) {
      console.error('Erreur lors de la récupération des éléments de la commande:', itemsError.message)
      return {
        success: false,
        error: 'Impossible de récupérer les éléments de la commande'
      }
    }

    // Enrichir les items de commande avec les URLs signées
    const enrichedItems = await Promise.all(
      (orderItems || []).map(async (item) => {
        try {
          // Générer l'URL signée directement avec Minio
          const signedUrl = await createPresignedUrlToDownload({
            bucketName: item.bucket_name, // Ajustez selon votre configuration
            fileName: item.image_name,
            expiry: 3600 // URL valide pendant 1h
          })

          return {
            ...item,
            image_url: signedUrl
          }
        } catch (err) {
          console.error(`Erreur lors de la génération de l'URL pour ${item.image_name}:`, err)
          // Retourner l'élément sans URL en cas d'erreur
          return item
        }
      })
    )

    // Construire l'objet de retour
    const order: OrderDetails = {
      ...orderData,
      items: enrichedItems
    }

    return { success: true, order }
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de la commande:', error)
    return {
      success: false,
      error: 'Une erreur inattendue s\'est produite'
    }
  }
}

export async function cancelOrder(orderNumber: string, email: string): Promise<CancelOrderResult> {
  try {
    if (!orderNumber) {
      return { success: false, error: 'Numéro de commande manquant' }
    }

    if (!email) {
      return { success: false, error: 'Adresse email requise' }
    }

    // Rechercher la commande avec le numéro et l'email correspondants
    const { data: orderData, error: findError } = await supabase
      .from('orders')
      .select('id, email')
      .eq('order_number', orderNumber)
      .single()

    if (findError || !orderData) {
      console.error('Erreur lors de la recherche de la commande:', findError?.message || 'Commande introuvable')
      return {
        success: false,
        error: 'Impossible de trouver cette commande'
      }
    }

    // Vérifier que l'email correspond
    if (orderData.email.toLowerCase() !== email.toLowerCase()) {
      return {
        success: false,
        error: 'L\'adresse email ne correspond pas à celle utilisée pour cette commande'
      }
    }

    // Mise à jour du statut de la commande
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'canceled' })
      .eq('id', orderData.id)

    if (updateError) {
      console.error('Erreur lors de l\'annulation de la commande:', updateError.message)
      return {
        success: false,
        error: 'Une erreur est survenue lors de l\'annulation de la commande'
      }
    }

    // Réinitialiser le cache pour cette page
    revalidatePath('/shop/confirmation')

    return {
      success: true,
      message: 'Votre commande a bien été annulée'
    }
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la commande:', error)
    return {
      success: false,
      error: 'Une erreur inattendue s\'est produite'
    }
  }
}
