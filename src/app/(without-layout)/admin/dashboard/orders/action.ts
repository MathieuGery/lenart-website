'use server'

import { createPresignedUrlToDownload } from '@/utils/s3';
import { getSupabaseServerClient } from '@/utils/supabase-ssr';
import { revalidatePath } from 'next/cache';

export type Order = {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total_price: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  formule_name: string;
  base_price: number;
  extra_photos_count: number;
  items_count?: number;
}

export type OrderItem = {
  id: string;
  image_name: string;
  image_url?: string;
}

/**
 * Récupère toutes les commandes
 */
export async function getOrders(): Promise<{ orders: Order[], error: string | null }> {
  try {
    const supabase = getSupabaseServerClient();

    // Récupérer les commandes avec les informations principales
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items:order_items (id)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      return { orders: [], error: error.message };
    }

    // Transformer les données pour inclure le nombre d'items par commande
    const formattedOrders: Order[] = orders.map(order => ({
      ...order,
      items_count: order.order_items ? order.order_items.length : 0
    }));

    return { orders: formattedOrders, error: null };
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des commandes:', error);
    return {
      orders: [],
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Récupère une commande par son ID
 */
export async function getOrderById(orderId: string): Promise<{ order: Order | null, items: OrderItem[], error: string | null }> {
  try {
    const supabase = getSupabaseServerClient();

    // Récupérer la commande
    const { data: order, error } = await supabase
      .from('orders')
      .select()
      .eq('id', orderId)
      .single();

    if (error) {
      return { order: null, items: [], error: error.message };
    }

    // Récupérer les items de la commande
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        image_name
      `)
      .eq('order_id', orderId);

    if (itemsError) {
      return { order, items: [], error: itemsError.message };
    }

    // Si certains items n'ont pas d'URL d'image, nous pourrions les chercher dans le bucket de stockage
    const itemsWithImages = await Promise.all(items.map(async (item) => {

      // Essayer de générer une URL publique pour l'image si elle existe dans le stockage
      try {
        const signedUrl = await createPresignedUrlToDownload({
            bucketName: 'images', // Ajustez selon votre configuration
            fileName: item.image_name,
            expiry: 3600 // URL valide pendant 1h
          })

        return {
          ...item,
          image_url: signedUrl || undefined
        };
      } catch (error) {
        console.error(`Erreur lors de la récupération de l'URL de l'image ${item.image_name}:`, error);
        return item;
      }
    }));

    console.log('Items enrichis avec les URLs:', itemsWithImages);
    return { order, items: itemsWithImages, error: null };
  } catch (error) {
    return {
      order: null,
      items: [],
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Met à jour le statut d'une commande
 */
export async function updateOrderStatus(orderId: string, status: string): Promise<{ success: boolean, error: string | null }> {
  try {
    const supabase = getSupabaseServerClient();

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Réinitialiser le cache pour cette page
    revalidatePath('/admin/dashboard/orders');

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue lors de la mise à jour'
    };
  }
}
