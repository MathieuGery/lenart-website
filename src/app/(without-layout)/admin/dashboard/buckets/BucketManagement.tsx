'use client'

import { useState, useTransition } from 'react';
import { FolderIcon, PlusIcon, TrashIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { createBucket, deleteBucket } from '@/app/(without-layout)/admin/dashboard/buckets/action';

type Bucket = {
  name: string;
  creationDate: Date;
};

interface BucketManagementProps {
  initialBuckets: Bucket[];
}

export default function BucketManagement({ initialBuckets }: BucketManagementProps) {
  const [buckets, setBuckets] = useState<Bucket[]>(initialBuckets);
  const [newBucketName, setNewBucketName] = useState('');
  const [isCreating, startCreating] = useTransition();
  const [deletingBucket, setDeletingBucket] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreateBucket = () => {
    if (!newBucketName.trim()) {
      setError('Le nom de la collection ne peut pas être vide');
      return;
    }

    // Valider le nom du bucket (format S3)
    const bucketRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    if (!bucketRegex.test(newBucketName) || newBucketName.length < 3 || newBucketName.length > 63) {
      setError('Le nom doit contenir uniquement des lettres minuscules, chiffres et tirets, entre 3 et 63 caractères');
      return;
    }

    startCreating(async () => {
      try {
        const result = await createBucket(newBucketName);
        if (result.success) {
          setBuckets(prev => [...prev, { name: newBucketName, creationDate: new Date() }]);
          setNewBucketName('');
          setSuccess('Collection créée avec succès');
          setError('');
        } else {
          setError(result.error || 'Erreur lors de la création');
        }
      } catch (err) {
        setError('Erreur lors de la création de la collection');
      }
    });
  };

  const handleDeleteBucket = async (bucketName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la collection "${bucketName}" ? Cette action est irréversible.`)) {
      return;
    }

    setDeletingBucket(bucketName);
    try {
      const result = await deleteBucket(bucketName);
      if (result.success) {
        setBuckets(prev => prev.filter(bucket => bucket.name !== bucketName));
        setSuccess('Collection supprimée avec succès');
        setError('');
      } else {
        setError(result.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur lors de la suppression de la collection');
    } finally {
      setDeletingBucket(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Messages de feedback */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Formulaire de création */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <PlusIcon className="h-5 w-5 mr-2 text-neutral-700" />
          Créer une nouvelle collection
        </h3>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={newBucketName}
              onChange={(e) => setNewBucketName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="nom-de-la-collection"
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-3 text-sm focus:border-neutral-500 focus:outline-none focus:ring-neutral-500"
              disabled={isCreating}
            />
            <p className="mt-1 text-xs text-gray-500">
              Utilisez uniquement des lettres minuscules, chiffres et tirets (3-63 caractères, les tirets seront affichés comme des espaces)
            </p>
          </div>
          <button
            onClick={handleCreateBucket}
            disabled={isCreating || !newBucketName.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-neutral-800 hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <PlusIcon className="h-4 w-4 mr-2" />
            )}
            Créer
          </button>
        </div>
      </div>

      {/* Liste des buckets */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <FolderIcon className="h-5 w-5 mr-2 text-neutral-700" />
          Collections existantes ({buckets.length})
        </h3>

        {buckets.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune collection</h3>
            <p className="mt-1 text-sm text-gray-500">Commencez par créer votre première collection</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {buckets.map((bucket) => (
              <div
                key={bucket.name}
                className="relative group bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-2">
                      <FolderIcon className="h-5 w-5 text-neutral-700 mr-2 flex-shrink-0" />
                      <h4 className="text-lg font-medium text-gray-900 truncate">
                        {bucket.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h4>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Créé le {bucket.creationDate.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                    <p className="mt-2 text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
                      {bucket.name}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteBucket(bucket.name)}
                    disabled={deletingBucket === bucket.name}
                    className="ml-3 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors duration-200 disabled:opacity-50"
                    title="Supprimer la collection"
                  >
                    {deletingBucket === bucket.name ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                    ) : (
                      <TrashIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Lien vers la boutique */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <a
                    href={`/shop/${bucket.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-neutral-700 hover:text-neutral-900 font-medium"
                  >
                    Voir dans la boutique →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
