'use client'

import { useState, useEffect } from 'react';
import { Order } from '@/app/(without-layout)/admin/dashboard/orders/action';

interface OrderFilterProps {
  orders: Order[];
  onFilteredOrdersChange: (filteredOrders: Order[]) => void;
}

export default function OrderFilter({ orders, onFilteredOrdersChange }: OrderFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    let filtered = [...orders];

    // Filtre par terme de recherche (numéro de commande, nom ou email du client)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(term) || 
        `${order.first_name} ${order.last_name}`.toLowerCase().includes(term) ||
        order.email.toLowerCase().includes(term)
      );
    }

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filtre par date
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const yesterday = new Date(today - 86400000).getTime();
      const lastWeek = new Date(today - 7 * 86400000).getTime();
      const lastMonth = new Date(today - 30 * 86400000).getTime();

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at).getTime();
        switch (dateFilter) {
          case 'today':
            return orderDate >= today;
          case 'yesterday':
            return orderDate >= yesterday && orderDate < today;
          case 'last-week':
            return orderDate >= lastWeek;
          case 'last-month':
            return orderDate >= lastMonth;
          default:
            return true;
        }
      });
    }

    onFilteredOrdersChange(filtered);
  }, [searchTerm, statusFilter, dateFilter, orders, onFilteredOrdersChange]);

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Recherche
          </label>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Numéro, nom ou email"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Statut
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
          >
            <option value="all">Tous les statuts</option>
            <option value="waiting-for-payment">En attente de paiement</option>
            <option value="pending">En cours de traitement</option>
            <option value="canceled">Annulée</option>
            <option value="completed">Terminée</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <select
            id="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm"
          >
            <option value="all">Toutes les périodes</option>
            <option value="today">Aujourd'hui</option>
            <option value="yesterday">Hier</option>
            <option value="last-week">7 derniers jours</option>
            <option value="last-month">30 derniers jours</option>
          </select>
        </div>
      </div>
    </div>
  );
}
