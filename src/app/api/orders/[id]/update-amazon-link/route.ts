import { getSupabaseServerClient } from '@/utils/supabase-ssr'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier si l'utilisateur est connecté et a des droits d'admin
    const supabase = getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier le rôle dans la table admin_roles
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const isAdmin = adminRole?.role === 'admin'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const formData = await request.formData()
    const amazonLink = formData.get('amazonLink') as string

    // Mettre à jour le lien Amazon dans la base de données
    const { error: updateError } = await supabase
      .from('orders')
      .update({ amazon_link: amazonLink })
      .eq('id', params.id)

    if (updateError) {
      console.error('Erreur lors de la mise à jour:', updateError)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour du lien Amazon' }, { status: 500 })
    }

    // Revalider le chemin pour mettre à jour la page
    revalidatePath(`/admin/dashboard/orders/${params.id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du lien Amazon:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
