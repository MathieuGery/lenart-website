import { getSupabaseServerClient } from '@/utils/supabase-ssr'
import { NextRequest, NextResponse } from 'next/server'

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

    // Récupérer les données du corps de la requête
    const body = await request.json()
    const { email, orderNumber, customerName, amazonLink, formuleName } = body

    if (!email || !orderNumber || !amazonLink) {
      return NextResponse.json({ error: 'Informations manquantes' }, { status: 400 })
    }

    // Appeler la fonction edge Supabase depuis le serveur
    const { data, error: functionError } = await supabase.functions.invoke('send-completed-order-email', {
      body: {
        email,
        orderNumber,
        customerName,
        amazonLink,
        formuleName
      }
    })

    if (functionError) {
      console.error('Erreur lors de l\'appel de la fonction Edge:', functionError)
      return NextResponse.json({ error: 'Erreur lors de l\'envoi de l\'email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
