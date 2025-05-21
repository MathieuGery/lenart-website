'use server'

import { supabase } from '@/utils/supabase';

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type ShopImage = {
  name: string;
  url: string;
  size: number;
  lastModified: Date;
};

/**
 * Génère un numéro de commande unique au format: DATE-SÉQUENTIEL (ex: 230524-0012)
 */
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
    // Extraire le numéro de séquence de la dernière commande
    const lastNumber = data[0].order_number.split('-')[1];
    sequenceNumber = parseInt(lastNumber, 10) + 1;
  }

  // Formater le numéro de séquence sur 4 chiffres
  const sequence = sequenceNumber.toString().padStart(4, '0');

  return `${datePrefix}-${sequence}`;
}

export async function sendEmailConfirmation(email: string, orderNumber: string) {
  const { data, error } = await supabase.functions.invoke('resend', {
    body: { email: email, orderNumber: orderNumber },
  })
}

export async function saveOrder(formData: FormData, cartItems: ShopImage[]) {
  try {
    // Générer un numéro de commande unique
    const orderNumber = await generateOrderNumber();

    await sendEmailConfirmation(formData.email, orderNumber)

    // Créer une entrée dans la table des commandes
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        status: 'pending',
        order_number: orderNumber,
        created_at: new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' })
      })
      .select('id, order_number')
      .single();

    if (orderError) {
      throw new Error(`Erreur lors de la création de la commande: ${orderError.message}`);
    }

    // Pour chaque image, ajouter une entrée dans la table order_items
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      image_name: item.name
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      throw new Error(`Erreur lors de l'ajout des articles: ${itemsError.message}`);
    }

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number
    };
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la commande:', error);
    return { success: false, error: (error as Error).message };
  }
}
