import { PageIntro } from '@/components/PageIntro'
import { listBucketObjects, createPresignedUrlToDownload } from '@/utils/s3'
import { Container } from '@/components/Container'
import { ShopGallery } from '../ShopGallery'

export default async function Page({ params }: { params: { slug: string } }) {
  let objects

  try {
    objects = await listBucketObjects(params.slug)
  } catch (error) {
    return (
      <>
        <Container className="mt-16">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-gray-900">Galerie non trouvée</h1>
            <p className="mb-6 text-gray-600">Cette galerie n'existe pas ou n'est pas disponible.</p>
            <a
              href="/shop"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Retour
            </a>
        </div>
        </Container>
    </>
    )
  }

  // Générer des URLs présignées pour chaque image - reste côté serveur
  const imagesWithUrls = await Promise.all(
    objects.map(async (object: any) => {
      const signedUrl = await createPresignedUrlToDownload({
        bucketName: params.slug,
        fileName: object.name,
      })

      return {
        name: object.name,
        url: signedUrl,
        size: object.size,
        lastModified: object.lastModified,
      }
    })
  )

  return (
    <>
      <PageIntro
        eyebrow="Images à vendre"
        title={params.slug}
      >
        <p>
          Parcourez la galerie et sélectionnez vos clichés préférés en les ajoutant au panier. Les images présentées ici sont en qualité réduite pour un affichage web optimal. Les fichiers que vous recevrez après votre commande seront en haute définition, sans filigrane, et soigneusement retouchés.
        </p>
      </PageIntro>

      <Container className="mt-16 sm:mt-20">
        {/* Section des images (commentée pour l'instant) */}
        <ShopGallery images={imagesWithUrls} />
      </Container>
    </>
  )
}
