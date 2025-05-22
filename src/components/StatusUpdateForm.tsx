'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface StatusUpdateFormProps {
  orderId: string;
  currentStatus: string;
}

export default function StatusUpdateForm({ orderId, currentStatus }: StatusUpdateFormProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('status', status);

      // Utiliser l'action serveur pour mettre à jour le statut
      const response = await fetch(`/api/orders/${orderId}/update-status`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du statut');
      }

      // Rafraîchir la page pour afficher le nouveau statut
      router.refresh();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue lors de la mise à jour du statut');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Nouveau statut
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 sm:text-sm"
        >
          <option value="waiting-for-payment">En attente de paiement</option>
          <option value="pending">En cours de traitement</option>
          <option value="canceled">Annulée</option>
          <option value="completed">Terminée</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading || status === currentStatus}
        className={`w-full inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2
          ${isLoading || status === currentStatus
            ? 'bg-neutral-400 cursor-not-allowed'
            : 'bg-neutral-800 hover:bg-neutral-700 focus:ring-neutral-500'
          }`}
      >
        {isLoading ? 'Mise à jour...' : 'Mettre à jour'}
      </button>
    </form>
  );
}
