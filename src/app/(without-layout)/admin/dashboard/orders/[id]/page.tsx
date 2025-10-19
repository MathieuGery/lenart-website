import { getOrderById } from '../action';
import { formatDateTimeToFrench } from '@/utils/dateUtils';
import { getSupabaseServerClient } from '@/utils/supabase-ssr';
import { redirect } from "next/navigation";
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import StatusUpdateForm from '@/components/StatusUpdateForm';
import AmazonLinkUpdateForm from '@/components/AmazonLinkUpdateForm';
import SendEmailButton from '@/components/SendEmailButton';

export const dynamic = 'force-dynamic';

// Fonction pour obtenir la classe de badge selon le statut
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'waiting-for-payment':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'pending':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'canceled':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

// Fonction pour obtenir le libellé du statut
function getStatusLabel(status: string): string {
  switch (status) {
    case 'waiting-for-payment':
      return 'En attente de paiement';
    case 'pending':
      return 'En cours de traitement';
    case 'canceled':
      return 'Annulée';
    case 'completed':
      return 'Terminée';
    case 'canceled':
      return 'Annulée';
    default:
      return status;
  }
}

// Page de détail d'une commande
export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  // Vérification côté serveur : seul un admin peut accéder à cette page
  try {
    const supabase = getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect('/admin');
    }

    // Vérifier le rôle dans la table admin_roles
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = adminRole?.role === 'admin';

    if (!isAdmin) {
      redirect('/admin');
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'utilisateur:', error);
    redirect('/admin');
  }

  const { order, items, error } = await getOrderById(params.id);

  if (!order) {
    redirect('/admin/dashboard/orders');
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-neutral-200">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/admin/dashboard/orders"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Retour aux commandes
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            Commande #{order.order_number}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Passée le {formatDateTimeToFrench(order.created_at)}
          </p>
        </div>

        <div className="flex flex-col items-end">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${getStatusBadgeClass(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Informations client */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 p-6 rounded-lg border border-neutral-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Informations client</h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nom</p>
                <p className="text-sm font-medium text-gray-900">{order.first_name} {order.last_name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{order.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Téléphone</p>
                <p className="text-sm font-medium text-gray-900">{order.phone || 'Non renseigné'}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-neutral-200 mt-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Mettre à jour le statut</h2>
            <StatusUpdateForm orderId={order.id} currentStatus={order.status} />
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-neutral-200 mt-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Lien Amazon</h2>
            <AmazonLinkUpdateForm orderId={order.id} currentAmazonLink={order.amazon_link || null} />
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-neutral-200 mt-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Envoyer par email</h2>
            <SendEmailButton
              orderId={order.id}
              orderNumber={order.order_number}
              customerName={`${order.first_name} ${order.last_name}`}
              email={order.email}
              amazonLink={order.amazon_link || null}
              formuleName={order.formule_name}
            />
          </div>
        </div>

        {/* Détails de la commande */}
        <div className="lg:col-span-2">
          <div className="bg-gray-50 p-6 rounded-lg border border-neutral-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Détails de la commande</h2>

            <div className="space-y-3 mb-6">
              <div>
                <p className="text-sm text-gray-500">Formule</p>
                <p className="text-sm font-medium text-gray-900">{order.formule_name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Prix de base</p>
                <p className="text-sm font-medium text-gray-900">{order.base_price.toFixed(2)} €</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Photos supplémentaires</p>
                <p className="text-sm font-medium text-gray-900">{order.extra_photos_count}</p>
              </div>

              {order.promoCode && (
                <>
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-500">Code promo utilisé</p>
                    <div className="mt-1">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        {order.promoCode.code}
                      </div>
                      {order.promoCode.description && (
                        <p className="text-xs text-gray-600 mt-1">{order.promoCode.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Remise appliquée</p>
                    <p className="text-sm font-medium text-green-600">
                      -{order.promoCode.discountAmount.toFixed(2)} € 
                      <span className="text-xs text-gray-500 ml-1">
                        ({order.promoCode.type === 'percentage' ? `${order.promoCode.value}%` : `${order.promoCode.value}€`})
                      </span>
                    </p>
                  </div>
                </>
              )}

              <div className={order.promoCode ? "pt-3 border-t border-gray-200" : ""}>
                <p className="text-sm text-gray-500">Prix total</p>
                <div className="flex items-center space-x-2">
                  {order.promoCode && (
                    <span className="text-sm text-gray-400 line-through">
                      {(order.total_price + order.promoCode.discountAmount).toFixed(2)} €
                    </span>
                  )}
                  <p className="text-lg font-bold text-gray-900">{order.total_price.toFixed(2)} €</p>
                </div>
              </div>

              {order.amazon_link && (
                <div className="pt-3 mt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Lien Amazon</p>
                  <a
                    href={order.amazon_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 break-all"
                  >
                    {order.amazon_link}
                  </a>
                </div>
              )}
            </div>

            <h3 className="text-md font-medium text-gray-900 mt-8 mb-4">Photos sélectionnées ({items.length})</h3>

            {items.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {items.map((item) => (
                  <div key={item.id} className="group">
                    <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 relative border border-gray-200 shadow-sm">
                      {/* Badge d'impression en haut à droite */}
                      {item.to_print && (
                        <div className="absolute top-2 right-2 z-20">
                          <div className="bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-medium shadow-lg">
                            🖨️
                          </div>
                        </div>
                      )}
                      
                      {/* Image */}
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.image_name}
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          fill
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-sm text-gray-500">Image non disponible</span>
                        </div>
                      )}
                      
                      {/* Overlay avec nom de fichier */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-xs text-white font-medium break-words">
                            {item.image_name}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Statut en dessous */}
                    <div className="mt-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium ${
                        item.to_print 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-gray-50 text-gray-600 border border-gray-200'
                      }`}>
                        {item.to_print ? (
                          <>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zM6 9a1 1 0 011-1h6a1 1 0 011 1v4H6V9z" clipRule="evenodd" />
                            </svg>
                            À imprimer
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Numérique
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucune photo sélectionnée</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
