import { PageIntro } from '@/components/PageIntro'
import { listBucketObjects, createPresignedUrlToDownload } from '@/utils/s3'
import { Container } from '@/components/Container'
import { ShopGallery } from './ShopGallery'

export const revalidate = 50 * 60 // Revalidation de la page toutes les 60 secondes

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
          Parcourez la galerie et sélectionnez vos clichés préférés en les ajoutant au panier. Les images présentées ici sont en qualité réduite pour un affichage web optimal. Les fichiers que vous recevrez après votre commande seront en haute définition, sans filigrane, et soigneusement retouchés.
        </p>
      </PageIntro>

      <Container className="mt-16 sm:mt-20">
        {/* On passe les données au composant client qui gèrera l'interaction */}
        <ShopGallery images={imagesWithUrls} />
      </Container>
    </>
  )
}
