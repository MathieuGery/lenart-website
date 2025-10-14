import { getSupabaseServerClient } from '@/utils/supabase-ssr';
import { redirect } from 'next/navigation';
import { getGalleriesAmz, createGallery, updateGallery, deleteGallery } from './action';
import GalleriesManagment from './GalleriesManagment';


export interface GalleriesAmz {
  id: number,
  created_at: string,
  link: string,
  date: string,
  title: string,
  code: string
}

export default async function GalleriesDashboardPage() {
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

  let galleries: Array<GalleriesAmz> = [];
  let error: string | null = null;
  try {
    const resp = await getGalleriesAmz()
    galleries = resp.galleries
  } catch (error) {
    console.error('Erreur lors de la récupération des galeries:', error);
    error = 'Impossible de charger les galeries';
    return <div className="mb-6 p-4 rounded-md bg-red-50">
      <p className="text-sm text-red-800">Erreur : Impossible de charger les galeries</p>
    </div>
  }

  return (
    <GalleriesManagment galleries={galleries} error={error} createAction={createGallery} updateAction={updateGallery} deleteAction={deleteGallery} />
  )
}
