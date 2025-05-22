import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/utils/supabase-ssr';
import { updateOrderStatus } from '@/app/(without-layout)/admin/dashboard/orders/action';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification de l'utilisateur
    const supabase = getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier si l'utilisateur est administrateur
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = adminRole?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer le statut à partir du corps de la requête
    const formData = await request.formData();
    const status = formData.get('status') as string;

    if (!status) {
      return NextResponse.json({ error: 'Le statut est requis' }, { status: 400 });
    }

    // Mettre à jour le statut de la commande
    const { success, error } = await updateOrderStatus(params.id, status);

    if (!success) {
      return NextResponse.json({ error: error || 'Échec de la mise à jour du statut' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
