import { listBuckets } from '@/utils/s3';
import { getSupabaseServerClient } from '@/utils/supabase-ssr';
import { redirect } from "next/navigation";
import BucketManagement from './BucketManagement';

export const revalidate = 0;

export default async function BucketsPage() {
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

  let buckets: Array<{name: string, creationDate: Date}> = [];
  let error: string | null = null;

  try {
    buckets = await listBuckets();
  } catch (err) {
    console.error('Erreur lors de la récupération des buckets:', err);
    error = 'Impossible de charger les collections';
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-neutral-200">
      <div className="border-b border-neutral-200 pb-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des collections</h1>
        <p className="text-gray-700">Gérez les collections de photos disponibles dans la boutique</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-md bg-red-50">
          <p className="text-sm text-red-800">Erreur : {error}</p>
        </div>
      )}

      <BucketManagement initialBuckets={buckets} />
    </div>
  );
}
