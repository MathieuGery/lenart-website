import { getSupabaseServerClient } from '@/utils/supabase-ssr';
import { redirect } from "next/navigation";

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

    // Vérifier le rôle dans les claims du user
    const { data: { user: userWithRole } } = await supabase.auth.getUser();

    const isAdmin = userWithRole?.role === 'authenticated';
    if (!isAdmin) {
      redirect('/admin');
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'utilisateur:', error);
    redirect('/admin');
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-neutral-200">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Tableau de bord administrateur</h1>
      <p className="text-gray-700 mb-8">Bienvenue sur l'espace d'administration du site Lenart.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-gray-50 p-6 rounded-xl border border-neutral-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Commandes récentes</h2>
          <p className="text-gray-600">Consultez et gérez les commandes</p>
          <div className="mt-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              5 nouvelles
            </span>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl border border-neutral-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Galeries</h2>
          <p className="text-gray-600">Gérez vos collections de photos</p>
          <div className="mt-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              12 publiées
            </span>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-xl border border-neutral-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Utilisateurs</h2>
          <p className="text-gray-600">Gérez les utilisateurs et leurs accès</p>
          <div className="mt-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              3 administrateurs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
