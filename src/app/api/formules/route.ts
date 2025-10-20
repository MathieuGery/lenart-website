import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/utils/supabase-ssr'

export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    const { data: formules, error } = await supabase
      .from('pricing_formules')
      .select('id, name, description, base_price, print_details, print_photo_count')
      .eq('is_active', true)
      .order('base_price', { ascending: true })

    if (error) {
      console.error('Erreur lors de la récupération des formules:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      formules
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des formules:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
