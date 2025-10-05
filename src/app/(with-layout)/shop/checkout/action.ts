'use server'

import { supabase } from '@/utils/supabase';

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
};

type FormuleDetails = {
  id: string;
  name: string;
  base_price: number;
  extra_photos: number;
  extra_photo_price: number;
};

type ShopImage = {
  name: string;
  bucket_name: string;
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

export async function sendEmailConfirmation(email: string, orderNumber: string, totalPrice: number, formuleName: string) {
  const { data, error } = await supabase.functions.invoke('resend', {
    body: { email: email, orderNumber: orderNumber, totalPrice: totalPrice, formuleName: formuleName },
  })
}

export async function saveOrder(formData: FormData, cartItems: ShopImage[], formuleDetails: FormuleDetails) {
  try {
    // Vérifier que les détails de la formule n'ont pas été modifiés localement
    const { data: formuleFromDB, error: formuleError } = await supabase
      .from('pricing_formules')
      .select('id, name, base_price, extra_photo_price')
      .eq('id', formuleDetails.id)
      .single();

    if (formuleError) {
      throw new Error(`Erreur lors de la vérification de la formule: ${formuleError.message}`);
    }

    console.log('Formule récupérée de la base de données:', formuleFromDB);
    // Vérifier que les informations de la formule correspondent à celles dans la base de données
    if (
      formuleFromDB.id !== formuleDetails.id ||
      formuleFromDB.name !== formuleDetails.name ||
      formuleFromDB.base_price !== formuleDetails.base_price ||
      formuleFromDB.extra_photo_price !== formuleDetails.extra_photo_price
    ) {
      throw new Error('Les informations de la formule ont été modifiées. Veuillez réessayer.');
    }
    // Générer un numéro de commande unique
    const orderNumber = await generateOrderNumber();

    // Calculer le prix total
    const totalPrice = formuleFromDB.base_price + (formuleFromDB.extra_photo_price * formuleDetails.extra_photos)

    // Créer une entrée dans la table des commandes
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        status: 'waiting-for-payment',
        order_number: orderNumber,
        total_price: totalPrice,
        formule_id: formuleDetails.id,
        formule_name: formuleDetails.name,
        base_price: formuleDetails.base_price,
        extra_photos_count: formuleDetails.extra_photos,
        extra_photos_price: formuleDetails.extra_photo_price || 0,
        created_at: new Date().toISOString()
      })
      .select('id, order_number')
      .single();

    if (orderError) {
      throw new Error(`Erreur lors de la création de la commande: ${orderError.message}`);
    }

    // Pour chaque image, ajouter une entrée dans la table order_items
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      image_name: item.name,
      bucket_name: item.bucket_name,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      throw new Error(`Erreur lors de l'ajout des articles: ${itemsError.message}`);
    }

    // Envoyer email de confirmation
    await sendEmailConfirmation(formData.email, orderNumber, totalPrice, formuleDetails.name);

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
