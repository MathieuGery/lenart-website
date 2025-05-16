import { PageIntro } from '@/components/PageIntro'
import { listBucketObjects, createPresignedUrlToDownload } from '@/utils/s3'
import { Container } from '@/components/Container'
import { ShopGallery } from './ShopGallery'

export default async function Shop() {
  // Récupérer tous les objets du bucket 'images' - reste côté serveur
  const objects = await listBucketObjects('images')

  // Générer des URLs présignées pour chaque image - reste côté serveur
  const imagesWithUrls = await Promise.all(
    objects.map(async (object: any) => {
      const signedUrl = await createPresignedUrlToDownload({
        bucketName: 'images',
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
        title="Notre collection"
      >
        <p>
          Découvrez notre sélection de photos disponibles à l'achat. Chaque image est unique et peut être téléchargée en haute résolution après achat.
        </p>
      </PageIntro>

      <Container className="mt-16 sm:mt-20">
        {/* On passe les données au composant client qui gèrera l'interaction */}
        <ShopGallery images={imagesWithUrls} />
      </Container>
    </>
  )
}
