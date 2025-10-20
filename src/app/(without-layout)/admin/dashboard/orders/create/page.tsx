import { getSupabaseServerClient } from '@/utils/supabase-ssr';
import { redirect } from "next/navigation";
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import CreateOrderForm from '@/components/CreateOrderForm';

export const dynamic = 'force-dynamic';

// Page de création d'une nouvelle commande
export default async function CreateOrderPage() {
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

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-neutral-200">
      <div className="mb-8">
        <Link
          href="/admin/dashboard/orders"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Retour aux commandes
        </Link>

        <h1 className="text-2xl font-bold text-gray-900">
          Créer une nouvelle commande
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Créez manuellement une commande pour un client
        </p>
      </div>

      <CreateOrderForm />
    </div>
  );
}
