import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Container } from '@/components/Container'
import { FadeIn, FadeInStagger } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import fs from 'fs'
import path from 'path'
import { ArrowRightIcon, CameraIcon } from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: 'Mon Travail',
  description:
    'Découvrez mes projets récents, des portraits aux mariages, en passant par des séances en extérieur avec les chevaux.',
}

export default async function GalleryShow() {
  return (
    <>
      <PageIntro
        eyebrow="La galerie"
        title="La galerie"
      >
        <p>
          Chaque image raconte une histoire, capture une émotion, un instant unique. Cette galerie est un aperçu de mon univers, de ma sensibilité et de mon regard sur le monde.
          Vous y découvrirez une sélection de mes projets récents : portraits, mariages, séances en extérieur avec les chevaux...
          Chaque photo reflète une rencontre, un moment partagé, une lumière particulière. Prenez le temps de parcourir ces images, et laissez-vous inspirer.
        </p>
      </PageIntro>

      {/* Nouvelle section Shop en haut */}
      <Container className="mt-10 sm:mt-12">
        <FadeIn>
          <div className="rounded-2xl bg-gray-900 p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="md:max-w-2xl">
                <div className="flex items-center text-white">
                  <CameraIcon className="h-5 w-5 mr-2" />
                  <h3 className="font-medium uppercase text-sm tracking-wide">Nouveau</h3>
                </div>
                <h2 className="mt-2 text-2xl font-display font-medium text-white">
                  Photos du dernier concours du club disponibles
                </h2>
                <p className="mt-2 text-neutral-300">
                  Retrouvez les plus belles images capturées lors du dernier concours équestre dans la boutique en ligne.
                  Des souvenirs uniques à conserver ou à offrir.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link
                  href="/shop"
                  className="rounded-full border border-white bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 flex items-center gap-2"
                >
                  Voir les photos du concours
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </Container>

      {/* Render the gallery component */}
      <Gallery />

      {/* Section Shop en bas - modifiée */}
      <ShopSection />
    </>
  )
}

// Composant pour la section Shop en bas de page - modifié
function ShopSection() {
  return (
    <Container className="mt-24 sm:mt-32 lg:mt-40">
      <FadeIn>
        <div className="relative overflow-hidden rounded-3xl bg-neutral-950 px-6 py-20 sm:px-12 sm:py-28 md:px-20">
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-medium text-white [text-wrap:balance] sm:text-4xl">
              Photos du concours du club
            </h2>
            <p className="mt-6 text-lg text-neutral-300">
              Découvrez et achetez les photographies prises lors du dernier concours équestre du club.
              Chaque image sera disponible en haute résolution pour vous permettre de conserver
              un souvenir exceptionnel de cet événement.
            </p>
            <div className="mt-10 flex justify-center">
              <Link
                href="/shop"
                className="group inline-flex items-center gap-2 justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-neutral-950 transition hover:bg-neutral-200"
              >
                Accéder à la boutique du concours
                <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </FadeIn>
    </Container>
  )
}

async function getGalleryImages() {
  const galleryDir = path.join(process.cwd(), 'public', 'images', 'gallery')

  try {
    const files = await fs.promises.readdir(galleryDir)
    return files
      .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
      .map(file => ({
        src: `/images/gallery/${file}`,
        alt: file.split('.')[0].replace(/-/g, ' '),
      }))
  } catch (error) {
    console.error('Error reading gallery directory:', error)
    return []
  }
}

// Gallery component using Server Component pattern
const Gallery = async () => {
  const galleryImages: { src: string; alt: string; }[] = await getGalleryImages()

  // Split images into 4 groups for the columns
  const splitIntoColumns = (images: { src: string; alt: string; }[]) => {
    const columns = [[], [], [], []]
    images.forEach((image, index) => {
      columns[index % 4].push(image as never)
    })
    return columns
  }

  const columns = splitIntoColumns(galleryImages)

  return (
    <Container className="mt-16 sm:mt-20">
      <FadeInStagger>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {columns.map((column, colIndex) => (
            <div key={colIndex} className="grid gap-4">
              {column.map((image: { src: string; alt: string; }, imgIndex) => (
                //<FadeIn key={`${colIndex}-${imgIndex}`}>
                <div>
                  <Image
                    className="h-auto max-w-full rounded-lg object-cover object-center transition-transform duration-300 hover:scale-105"
                    src={image.src}
                    alt={image.alt}
                    width={500}
                    height={350}
                  />
                </div>
                //</FadeIn>
              ))}
            </div>
          ))}
        </div>
      </FadeInStagger>
    </Container>
  );
};
