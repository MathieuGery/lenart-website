'use server'
import { getSupabaseServerClient } from '@/utils/supabase-ssr'
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  // Vérification côté serveur : seul un admin peut accéder à cette page
  try {
    const supabase = getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/admin')
    }

    // Vérifier le rôle dans les claims du user
    const { data: { user: userWithRole } } = await supabase.auth.getUser()

    const isAdmin = userWithRole?.role === 'authenticated'
    if (!isAdmin) {
      redirect('/admin')
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'utilisateur:', error)
    redirect('/admin')
  }
  return (
    <main className="min-h-screen bg-neutral-50 py-16">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-10 border border-neutral-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Tableau de bord administrateur</h1>
        <p className="text-gray-700 mb-8">Bienvenue sur l’espace d’administration du site Lenart.</p>
        {/* Ajoute ici le contenu réservé aux administrateurs */}
      </div>
    </main>
  );
}
