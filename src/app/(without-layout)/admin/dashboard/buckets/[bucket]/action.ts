'use server'

import { listBucketObjects, removeObject } from '@/utils/s3'
import { getSupabaseServerClient } from '@/utils/supabase-ssr'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const supabase = getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: adminRole } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  if (adminRole?.role !== 'admin') return null
  return { user }
}

export async function deleteManyObjects(formData: FormData) {
  const bucketName = formData.get('bucketName') as string
  const objects = (formData.get('objectNames') as string | undefined)?.split('|').filter(Boolean) || []
  if (!bucketName || objects.length === 0) return
  const admin = await assertAdmin()
  if (!admin) return
  for (const name of objects) {
    await removeObject(bucketName, name)
  }
  revalidatePath(`/admin/dashboard/buckets/${bucketName}`)
}

export async function deleteAllObjects(formData: FormData) {
  const bucketName = formData.get('bucketName') as string
  if (!bucketName) return
  const admin = await assertAdmin()
  if (!admin) return
  const objs = await listBucketObjects(bucketName)
  for (const o of objs) {
    await removeObject(bucketName, o.name)
  }
  revalidatePath(`/admin/dashboard/buckets/${bucketName}`)
}
