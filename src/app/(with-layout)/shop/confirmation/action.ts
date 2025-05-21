'use server'

import { supabase } from '@/utils/supabase'
import { revalidatePath } from 'next/cache'

type CancelOrderResult = {
  success: boolean
  message?: string
  error?: string
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
