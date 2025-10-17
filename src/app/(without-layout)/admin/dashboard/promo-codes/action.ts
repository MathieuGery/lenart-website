'use server'

import { getSupabaseServerClient } from '@/utils/supabase-ssr'
import { revalidatePath } from 'next/cache'

export interface PromoCode {
  id: string
  code: string
  description: string | null
  type: 'percentage' | 'fixed_amount'
  value: number
  usage_limit: number | null
  usage_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PromoCodeFormData {
  code: string
  description: string
  type: 'percentage' | 'fixed_amount'
  value: number
  usage_limit: number | null
  is_active: boolean
}

// Récupérer tous les codes promo
export async function getPromoCodes(): Promise<{ data: PromoCode[] | null; error: string | null }> {
  try {
    const supabase = getSupabaseServerClient()

    // Vérifier l'authentification admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Non authentifié' }
    }

    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (adminRole?.role !== 'admin') {
      return { data: null, error: 'Accès non autorisé' }
    }

    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des codes promo:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Erreur:', error)
    return { data: null, error: 'Erreur interne du serveur' }
  }
}

// Créer un nouveau code promo
export async function createPromoCode(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient()

    // Vérifier l'authentification admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Non authentifié' }
    }

    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (adminRole?.role !== 'admin') {
      return { success: false, error: 'Accès non autorisé' }
    }

    // Extraire les données du formulaire
    const code = formData.get('code') as string
    const description = formData.get('description') as string
    const type = formData.get('type') as 'percentage' | 'fixed_amount'
    const value = parseFloat(formData.get('value') as string)
    const usage_limit = formData.get('usage_limit')
      ? parseInt(formData.get('usage_limit') as string)
      : null
    const is_active = formData.get('is_active') === 'on'

    // Validation basique
    if (!code || !type || !value || value <= 0) {
      return { success: false, error: 'Données invalides' }
    }

    if (type === 'percentage' && value > 100) {
      return { success: false, error: 'Le pourcentage ne peut pas dépasser 100%' }
    }

    const { error } = await supabase
      .from('promo_codes')
      .insert({
        code: code.toUpperCase(),
        description,
        type,
        value,
        usage_limit,
        is_active
      })

    if (error) {
      console.error('Erreur lors de la création du code promo:', error)
      if (error.code === '23505') { // Violation de contrainte unique
        return { success: false, error: 'Ce code promo existe déjà' }
      }
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/dashboard/promo-codes')
    return { success: true }
  } catch (error) {
    console.error('Erreur:', error)
    return { success: false, error: 'Erreur interne du serveur' }
  }
}

// Mettre à jour un code promo
export async function updatePromoCode(id: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient()

    // Vérifier l'authentification admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Non authentifié' }
    }

    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (adminRole?.role !== 'admin') {
      return { success: false, error: 'Accès non autorisé' }
    }

    // Extraire les données du formulaire
    const code = formData.get('code') as string
    const description = formData.get('description') as string
    const type = formData.get('type') as 'percentage' | 'fixed_amount'
    const value = parseFloat(formData.get('value') as string)
    const usage_limit = formData.get('usage_limit')
      ? parseInt(formData.get('usage_limit') as string)
      : null
    const is_active = formData.get('is_active') === 'on'

    // Validation basique
    if (!code || !type || !value || value <= 0) {
      return { success: false, error: 'Données invalides' }
    }

    if (type === 'percentage' && value > 100) {
      return { success: false, error: 'Le pourcentage ne peut pas dépasser 100%' }
    }

    const { error } = await supabase
      .from('promo_codes')
      .update({
        code: code.toUpperCase(),
        description,
        type,
        value,
        usage_limit,
        is_active
      })
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la mise à jour du code promo:', error)
      if (error.code === '23505') { // Violation de contrainte unique
        return { success: false, error: 'Ce code promo existe déjà' }
      }
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/dashboard/promo-codes')
    return { success: true }
  } catch (error) {
    console.error('Erreur:', error)
    return { success: false, error: 'Erreur interne du serveur' }
  }
}

// Basculer le statut actif/inactif d'un code promo
export async function togglePromoCodeStatus(id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient()

    // Vérifier l'authentification admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Non authentifié' }
    }

    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (adminRole?.role !== 'admin') {
      return { success: false, error: 'Accès non autorisé' }
    }

    const { error } = await supabase
      .from('promo_codes')
      .update({ is_active: isActive })
      .eq('id', id)

    if (error) {
      console.error('Erreur lors du changement de statut du code promo:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/dashboard/promo-codes')
    return { success: true }
  } catch (error) {
    console.error('Erreur:', error)
    return { success: false, error: 'Erreur interne du serveur' }
  }
}

// // Valider un code promo (fonction utilitaire pour le frontend)
// export async function validatePromoCodeForOrder(code: string, orderAmount: number): Promise<{
//   valid: boolean
//   error?: string
//   promoCode?: any
//   discountAmount?: number
// }> {
//   try {
//     const supabase = getSupabaseServerClient()

//     const { data, error } = await supabase.rpc('validate_promo_code', {
//       p_code: code,
//       p_order_amount: orderAmount
//     })

//     if (error) {
//       console.error('Erreur lors de la validation du code promo:', error)
//       return { valid: false, error: error.message }
//     }

//     return data
//   } catch (error) {
//     console.error('Erreur:', error)
//     return { valid: false, error: 'Erreur interne du serveur' }
//   }
// }

// // Appliquer un code promo lors du paiement
// export async function applyPromoCodeToOrder(
//   code: string,
//   orderAmount: number,
//   orderId?: string,
//   userEmail?: string
// ): Promise<{
//   success: boolean
//   error?: string
//   discountAmount?: number
// }> {
//   try {
//     const supabase = getSupabaseServerClient()

//     const { data, error } = await supabase.rpc('apply_promo_code', {
//       p_code: code,
//       p_order_amount: orderAmount,
//       p_order_id: orderId || null,
//       p_user_email: userEmail || null
//     })

//     if (error) {
//       console.error('Erreur lors de l\'application du code promo:', error)
//       return { success: false, error: error.message }
//     }

//     return data
//   } catch (error) {
//     console.error('Erreur:', error)
//     return { success: false, error: 'Erreur interne du serveur' }
//   }
// }
