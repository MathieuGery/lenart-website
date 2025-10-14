'use server'

import { getSupabaseServerClient } from '@/utils/supabase-ssr';
import { revalidatePath } from 'next/cache'

function sanitizeString(v: FormDataEntryValue | null, max = 255) {
  if (!v) return ''
  return String(v).trim().slice(0, max)
}

async function assertAdmin() {
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  if (adminRole?.role !== 'admin') return null
  return { user, supabase }
}

export async function getGalleriesAmz(): Promise<any> {
  try {
    const supabase = getSupabaseServerClient();

    const { data: galleries, error } = await supabase
      .from('GalleryAmz')
      .select(`
        *
      `)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Erreur lors de la récupération des galeries:', error);
      return { galleries: [], error: error.message };
    }
    return { galleries, error: null };
  } catch (error) {
    console.error('Erreur lors de la récupération des galeries:', error);
    return { galleries: [], error: (error as Error).message };
  }
}

export async function createGallery(formData: FormData) {
  console.log('oskour', formData)
  const admin = await assertAdmin()
  if (!admin) return { ok: false, error: 'Non autorisé' }
  const title = sanitizeString(formData.get('title'))
  const code = sanitizeString(formData.get('code'))
  const link = sanitizeString(formData.get('link'), 500)
  const date = sanitizeString(formData.get('date'), 50)
  if (!title || !code) return { ok: false, error: 'Titre et code requis' }
  const { supabase } = admin
  const defaultDate: string = new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' });
  const { error } = await supabase.from('GalleryAmz').insert({ title, code, link: link || null, date: date || defaultDate })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/dashboard/galleries')
  return { ok: true }
}

export async function updateGallery(formData: FormData) {
  const admin = await assertAdmin()
  if (!admin) return { ok: false, error: 'Non autorisé' }
  const idRaw = formData.get('id')
  const id = idRaw ? Number(idRaw) : NaN
  if (!id || Number.isNaN(id)) return { ok: false, error: 'ID invalide' }
  const title = sanitizeString(formData.get('title'))
  const code = sanitizeString(formData.get('code'))
  const link = sanitizeString(formData.get('link'), 500)
  const date = sanitizeString(formData.get('date'), 50)
  if (!title || !code) return { ok: false, error: 'Titre et code requis' }
  const { supabase } = admin
  const { error } = await supabase.from('GalleryAmz').update({ title, code, link: link || null, date: date || null }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/dashboard/galleries')
  return { ok: true }
}

export async function deleteGallery(formData: FormData) {
  const admin = await assertAdmin()
  if (!admin) return { ok: false, error: 'Non autorisé' }
  const idRaw = formData.get('id')
  const id = idRaw ? Number(idRaw) : NaN
  if (!id || Number.isNaN(id)) return { ok: false, error: 'ID invalide' }
  const { supabase } = admin
  const { error } = await supabase.from('GalleryAmz').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/dashboard/galleries')
  return { ok: true }
}
