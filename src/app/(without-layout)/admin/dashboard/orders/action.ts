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
  discount_amount?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  formule_name: string;
  base_price: number;
  extra_photos_count: number;
  amazon_link?: string | null;
  items_count?: number;
  promoCode?: {
    code: string;
    description: string | null;
    type: 'percentage' | 'fixed_amount';
    value: number;
    discountAmount: number;
  } | null;
}

export type OrderItem = {
  id: string;
  image_name: string;
  image_url?: string;
  to_print?: boolean;
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
      .select(`
        id,
        order_number,
        first_name,
        last_name,
        email,
        phone,
        status,
        created_at,
        formule_name,
        base_price,
        extra_photos_count,
        total_price,
        discount_amount,
        amazon_link
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      return { order: null, items: [], error: error.message };
    }

    // Récupérer les informations du code promo utilisé si applicable
    let promoCodeInfo = null;
    if (order.discount_amount && order.discount_amount > 0) {
      const { data: promoUsage, error: promoError }: { data: { discount_amount: number, promo_codes: { code: string, type: "percentage" | "fixed_amount", value: number, description: string } } | null, error: any } = await supabase
        .from('promo_code_usage')
        .select(`
          discount_amount,
          promo_codes (
            code,
            description,
            type,
            value
          )
        `)
        .eq('order_id', orderId)
        .single();

      console.log(promoUsage)
      if (!promoError && promoUsage) {
        promoCodeInfo = {
          code: promoUsage.promo_codes.code,
          description: promoUsage.promo_codes.description,
          type: promoUsage.promo_codes.type,
          value: promoUsage.promo_codes.value,
          discountAmount: promoUsage.discount_amount
        };
      }
    }

    // Récupérer les items de la commande
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        image_name,
        bucket_name,
        to_print
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
          bucketName: item.bucket_name, // Ajustez selon votre configuration
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

    return { order: { ...order, promoCode: promoCodeInfo }, items: itemsWithImages, error: null };
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

/**
 * Récupère les statistiques des commandes
 */
export async function getOrdersStats(): Promise<{
  total: number,
  byStatus: Record<string, number>,
  byFormule: Record<string, number>,
  totalAmount: number,
  error: string | null
}> {
  try {
    const supabase = getSupabaseServerClient();

    // Récupérer toutes les commandes avec leur montant et formule
    const { data: orders, error } = await supabase
      .from('orders')
      .select('status, total_price, formule_name');

    if (error) {
      console.error('Erreur lors de la récupération des statistiques de commandes:', error);
      return { total: 0, byStatus: {}, byFormule: {}, totalAmount: 0, error: error.message };
    }

    // Calculer le nombre total de commandes
    const total = orders.length;

    // Calculer le montant total de toutes les commandes (exclure les commandes annulées)
    const totalAmount = orders
      .filter(order => order.status !== 'canceled')
      .reduce((sum, order) => sum + (order.total_price || 0), 0);

    // Calculer le nombre de commandes par statut
    const byStatus: Record<string, number> = {};
    // Calculer le nombre de commandes par formule
    const byFormule: Record<string, number> = {};

    orders.forEach(order => {
      // Comptage par statut
      const status = order.status;
      byStatus[status] = (byStatus[status] || 0) + 1;

      // Comptage par formule
      const formule = order.formule_name;
      if (formule) {
        byFormule[formule] = (byFormule[formule] || 0) + 1;
      }
    });

    return { total, byStatus, byFormule, totalAmount, error: null };
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des statistiques de commandes:', error);
    return {
      total: 0,
      byStatus: {},
      byFormule: {},
      totalAmount: 0,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Type simplifié pour les commandes récentes du tableau de bord
 */
export type RecentOrder = {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total_price: number;
  first_name: string;
  last_name: string;
  email: string;
}

/**
 * Crée une nouvelle commande manuellement
 */
export async function createOrder(orderData: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  formule: {
    id: string;
    name: string;
    base_price: number;
  };
  status: string;
  amazonLink?: string | null;
  selectedPhotos?: {
    name: string;
    bucket_name: string;
    url: string;
    size: number;
    lastModified: Date;
    to_print?: boolean;
  }[];
}): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    // Générer un numéro de commande unique
    async function generateOrderNumber() {
      const today = new Date();
      const datePrefix = today.getFullYear().toString().slice(-2) +
        (today.getMonth() + 1).toString().padStart(2, '0') +
        today.getDate().toString().padStart(2, '0');

      // Récupérer la dernière commande de la journée
      const { data, error } = await supabase
        .from('orders')
        .select('order_number')
        .like('order_number', `${datePrefix}-%`)
        .order('order_number', { ascending: false })
        .limit(1);

      let sequenceNumber = 1;

      if (!error && data && data.length > 0) {
        const lastNumber = data[0].order_number.split('-')[1];
        sequenceNumber = parseInt(lastNumber, 10) + 1;
      }

      const sequence = sequenceNumber.toString().padStart(4, '0');
      return `${datePrefix}-${sequence}`;
    }

    const orderNumber = await generateOrderNumber();

    // Créer la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        first_name: orderData.firstName,
        last_name: orderData.lastName,
        email: orderData.email,
        phone: orderData.phone || '',
        status: orderData.status,
        order_number: orderNumber,
        total_price: orderData.formule.base_price,
        discount_amount: 0,
        formule_id: orderData.formule.id,
        formule_name: orderData.formule.name,
        base_price: orderData.formule.base_price,
        extra_photos_count: 0,
        extra_photos_price: 0,
        amazon_link: orderData.amazonLink,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('Erreur lors de la création de la commande:', orderError);
      return { success: false, error: orderError.message };
    }

    // Ajouter les photos sélectionnées si elles existent
    if (orderData.selectedPhotos && orderData.selectedPhotos.length > 0) {
      const orderItems = orderData.selectedPhotos.map((photo) => ({
        order_id: order.id,
        image_name: photo.name,
        bucket_name: photo.bucket_name,
        to_print: photo.to_print || false,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Erreur lors de l\'ajout des photos:', itemsError);
        return { success: false, error: itemsError.message };
      }
    }

    // Réinitialiser le cache
    revalidatePath('/admin/dashboard/orders');

    return { success: true, orderId: order.id };
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}
export async function getRecentOrders(): Promise<{ orders: RecentOrder[], error: string | null }> {
  try {
    const supabase = getSupabaseServerClient();

    // Récupérer les 5 commandes les plus récentes
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        created_at,
        status,
        total_price,
        first_name,
        last_name,
        email
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Erreur lors de la récupération des commandes récentes:', error);
      return { orders: [], error: error.message };
    }

    return { orders: orders as RecentOrder[], error: null };
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des commandes récentes:', error);
    return {
      orders: [],
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}
