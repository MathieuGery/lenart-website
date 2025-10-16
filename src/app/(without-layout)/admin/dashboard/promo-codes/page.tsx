import { getSupabaseServerClient } from "@/utils/supabase-ssr";
import { redirect } from "next/navigation";
import { getPromoCodes } from './action';
import PromoCodeManagement from './PromoCodeManagement';

export const dynamic = 'force-dynamic';

export default async function PromoCodesPage() {
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

    // Récupérer les codes promo
    const { data: promoCodes, error } = await getPromoCodes();

    if (error) {
      console.error('Erreur lors de la récupération des codes promo:', error);
      return (
        <div className="p-6">
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
            Erreur lors du chargement des codes promo: {error}
          </div>
        </div>
      );
    }

    return <PromoCodeManagement initialPromoCodes={promoCodes || []} />;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'utilisateur:', error);
    redirect('/admin');
  }
}
