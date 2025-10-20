import { NextResponse } from 'next/server'
import { listBucketObjects, createPresignedUrlToDownload } from '@/utils/s3'

export async function GET(
  request: Request,
  { params }: { params: { bucket: string } }
) {
  try {
    const { bucket } = params
    
    // Récupérer la liste des objets dans le bucket
    const objects = await listBucketObjects(bucket)
    
    // Générer les URLs signées pour chaque image
    const images = await Promise.all(
      objects.map(async (obj) => {
        try {
          const signedUrl = await createPresignedUrlToDownload({
            bucketName: bucket,
            fileName: obj.name,
            expiry: 3600 // 1 heure
          })
          
          return {
            name: obj.name,
            bucket_name: bucket,
            url: signedUrl,
            size: obj.size,
            lastModified: obj.lastModified
          }
        } catch (error) {
          console.error(`Erreur lors de la génération de l'URL pour ${obj.name}:`, error)
          return null
        }
      })
    )
    
    // Filtrer les images nulles (erreurs)
    const validImages = images.filter(img => img !== null)
    
    return NextResponse.json({
      success: true,
      images: validImages
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des images:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du chargement des images' },
      { status: 500 }
    )
  }
}
