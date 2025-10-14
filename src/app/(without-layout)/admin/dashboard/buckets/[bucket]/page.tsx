import { listBucketObjects } from '@/utils/s3'
import { getSupabaseServerClient } from '@/utils/supabase-ssr'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ObjectsTableClient from './ObjectsTableClient'
import { deleteManyObjects, deleteAllObjects } from './action'


export const dynamic = 'force-dynamic'

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

// Composant client pour tableau avec sélection

export default async function BucketObjectsPage({ params }: { params: { bucket: string } }) {
  const bucketName = params.bucket

  // Auth & role check
  try {
    const supabase = getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/admin')
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    if (adminRole?.role !== 'admin') redirect('/admin')
  } catch (e) {
    console.error('Auth error', e)
    redirect('/admin')
  }

  let objects: { name: string; lastModified: Date; etag: string; size: number }[] = []
  let error: string | null = null
  try {
    objects = await listBucketObjects(bucketName)
  } catch (e: any) {
    error = e.message || 'Erreur lors du chargement des objets'
  }

  return (
    <div className="p-8 bg-white rounded-2xl border border-neutral-200 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Objets de la collection</h1>
          <p className="text-sm text-neutral-600 mt-1">Collection: <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">{bucketName}</code></p>
        </div>
        <Link href="/admin/dashboard/buckets" className="text-teal-600 hover:text-teal-800 text-sm font-medium">← Retour aux collections</Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
          {error}
        </div>
      )}

      {objects.length === 0 && !error && (
        <div className="py-16 text-center border-2 border-dashed border-neutral-200 rounded-xl">
          <p className="text-neutral-600">Aucun objet trouvé dans cette collection.</p>
        </div>
      )}

      {objects.length > 0 && (
        <ObjectsTableClient bucketName={bucketName} initialObjects={objects} deleteManyAction={deleteManyObjects} deleteAllAction={deleteAllObjects} />
      )}
    </div>
  )
}
