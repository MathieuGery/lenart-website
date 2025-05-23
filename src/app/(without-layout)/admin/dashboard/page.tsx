import { getSupabaseServerClient } from '@/utils/supabase-ssr';
import { redirect } from "next/navigation";
import { getOrdersStats, getRecentOrders } from './orders/action';
import Link from 'next/link';
import { formatDateToFrench } from '@/utils/dateUtils';
import {
  ShoppingBagIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  XCircleIcon,
  CurrencyEuroIcon
} from '@heroicons/react/24/outline';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Vérification côté serveur : seul un admin peut accéder à cette page
  try {
    const supabase = getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    console.log('User:', user);
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

  // Récupérer les statistiques des commandes
  const { total: totalOrders, byStatus: ordersByStatus, byFormule: ordersByFormule, totalAmount, error: statsError } = await getOrdersStats();

  // Récupérer les commandes récentes
  const { orders: recentOrders, error: recentOrdersError } = await getRecentOrders();

  // Fonction pour obtenir la classe de badge selon le statut
  function getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'waiting-for-payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Fonction pour obtenir le libellé du statut
  function getStatusLabel(status: string): string {
    switch (status) {
      case 'waiting-for-payment':
        return 'En attente de paiement';
      case 'pending':
        return 'En traitement';
      case 'canceled':
        return 'Annulée';
      case 'completed':
        return 'Terminée';
      default:
        return status;
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-neutral-200">
      <div className="border-b border-neutral-200 pb-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord administrateur</h1>
        <p className="text-gray-700">Bienvenue sur l'espace d'administration du site Lenart.</p>
      </div>

      {statsError && (
        <div className="mb-6 p-4 rounded-md bg-red-50">
          <p className="text-sm text-red-800">Erreur lors du chargement des statistiques: {statsError}</p>
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques des commandes</h3>

      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 md:grid-cols-2 2xl:grid-cols-5 mb-10">
        {/* Total des commandes */}
        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow duration-300">
          <dt>
            <div className="absolute rounded-md bg-neutral-800 p-3">
              <ShoppingBagIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">Total des commandes</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{totalOrders}</p>
            <div className="ml-auto">
              <Link href="/admin/dashboard/orders" className="text-sm font-medium text-neutral-700 hover:text-neutral-900">
                Voir toutes
              </Link>
            </div>
          </dd>
        </div>

        {/* Commandes en attente de paiement */}
        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow duration-300">
          <dt>
            <div className="absolute rounded-md bg-yellow-500 p-3">
              <ClockIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">En attente de paiement</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{ordersByStatus['waiting-for-payment'] || 0}</p>
          </dd>
        </div>

        {/* Commandes en traitement */}
        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow duration-300">
          <dt>
            <div className="absolute rounded-md bg-blue-500 p-3">
              <ArrowUpIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">En traitement</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{ordersByStatus['pending'] || 0}</p>
          </dd>
        </div>

        {/* Commandes terminées */}
        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow duration-300">
          <dt>
            <div className="absolute rounded-md bg-emerald-500 p-3">
              <CheckCircleIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">Terminées</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{ordersByStatus['completed'] || 0}</p>
          </dd>
        </div>

        {/* Commandes annulées */}
        <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow duration-300">
          <dt>
            <div className="absolute rounded-md bg-red-500 p-3">
              <XCircleIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">Annulées</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{ordersByStatus['canceled'] || 0}</p>
          </dd>
        </div>
      </dl>

      {/* Section des statistiques financières et formules */}
      <div className="mt-10">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques financières</h3>

        <div className="grid grid-cols-1 gap-5 mb-8">
          {/* Montant total des commandes */}
          <div className="relative overflow-hidden rounded-lg bg-white p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center mb-4">
              <div className="rounded-md bg-green-600 p-3 mr-4">
                <CurrencyEuroIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900">Montant total des commandes</h4>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalAmount.toFixed(2)}€</p>

            <div className="mt-6">
              <h5 className="text-sm font-semibold text-gray-700 mb-3">Commandes par formule</h5>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {Object.entries(ordersByFormule).map(([formuleName, count]) => (
                  <div key={formuleName} className="bg-gray-50 rounded-lg p-3">
                    <dt className="text-sm font-medium text-gray-500 truncate">{formuleName}</dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900">{count}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Section des commandes récentes */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <ShoppingBagIcon className="h-5 w-5 mr-2 text-neutral-700" />
            Commandes récentes
          </h2>
          <Link
            href="/admin/dashboard/orders"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-neutral-800 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
          >
            Voir toutes les commandes
          </Link>
        </div>

        {recentOrdersError && (
          <div className="mb-4 p-4 rounded-md bg-red-50">
            <p className="text-sm text-red-800">Erreur lors du chargement des commandes récentes: {recentOrdersError}</p>
          </div>
        )}

        <div className="overflow-hidden shadow-sm border border-neutral-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                  N° Commande
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Date
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Client
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Total
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Statut
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                      {order.order_number}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDateToFrench(order.created_at)}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      <div>{order.first_name} {order.last_name}</div>
                      <div className="text-gray-400 text-xs">{order.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                      {order.total_price.toFixed(2)}€
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <Link
                        href={`/admin/dashboard/orders/${order.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-neutral-800 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
                      >
                        Voir détails
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-gray-500">
                    Aucune commande récente
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
