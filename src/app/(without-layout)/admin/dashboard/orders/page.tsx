import { getOrders } from './action';
import { getSupabaseServerClient } from '@/utils/supabase-ssr';
import { redirect } from "next/navigation";
import OrdersTable from '@/components/OrdersTable';

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
    default:
      return status;
  }
}

// Page principale pour la gestion des commandes
export default async function OrdersPage() {
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

  const { orders, error } = await getOrders();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-neutral-200">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des commandes</h1>
        <p className="mt-2 text-sm text-gray-700">
          Liste des commandes passées sur le site
        </p>
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

      {/* Tableau des commandes avec filtrage */}
      <OrdersTable initialOrders={orders || []} />
    </div>
  );
}
