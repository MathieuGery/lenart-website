'use client'

import { useState } from 'react';
import { Order } from '@/app/(without-layout)/admin/dashboard/orders/action';
import { formatDateToFrench } from '@/utils/dateUtils';
import Link from 'next/link';
import OrderFilter from '@/components/OrderFilter';

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

interface OrdersTableProps {
  initialOrders: Order[];
}

export default function OrdersTable({ initialOrders }: OrdersTableProps) {
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(initialOrders);

  return (
    <>
      <OrderFilter orders={initialOrders} onFilteredOrdersChange={setFilteredOrders} />

      <div className="mt-4 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Numéro
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Client
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Formule
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Total
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Items
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
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {order.order_number}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDateToFrench(order.created_at)}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          <div>{order.first_name} {order.last_name}</div>
                          <div className="text-gray-400">{order.email}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                          {order.formule_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                          {order.total_price.toFixed(2)}€
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {order.items_count} photos
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <Link
                            href={`/admin/dashboard/orders/${order.id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md bg-neutral-800 text-white hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
                          >
                            Détails
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-gray-500">
                        Aucune commande trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
