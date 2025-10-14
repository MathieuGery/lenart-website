import { PageIntro } from '@/components/PageIntro'
import { listBuckets } from '@/utils/s3'
import { Container } from '@/components/Container'
import { FadeIn, FadeInStagger } from '@/components/FadeIn'
import { Border } from '@/components/Border'
import Link from 'next/link'

export const revalidate = 3600

export default async function Shop() {
  const buckets = await listBuckets()

  return (
    <>
      <PageIntro
        eyebrow="Sélection de collection"
        title="Choisissez votre collection"
      >
        <p>
          Sélectionnez la collection de photos qui vous intéresse pour accéder à la boutique. 
          Chaque collection contient les moments forts capturés lors d'un événement spécifique. 
          Une fois votre collection choisie, vous pourrez parcourir toutes les photos disponibles 
          et sélectionner celles que vous souhaitez acheter.
        </p>
        <p className="mt-4 text-sm text-neutral-600">
          � <strong>Étape 1 :</strong> Cliquez sur la collection qui vous intéresse pour découvrir toutes les photos disponibles
        </p>
      </PageIntro>

      <Container className="mt-16 sm:mt-20">
        {/* Section des buckets */}
        <FadeIn>
          <div className="mb-24 sm:mb-32">
            <h2 className="font-display text-2xl font-semibold text-neutral-950 mb-12">Collections disponibles</h2>
            <FadeInStagger className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {buckets.map((bucket) => (
                <FadeIn key={bucket.name}>
                  <div className="group relative overflow-hidden rounded-3xl bg-white p-8 ring-1 ring-neutral-200 transition-all hover:bg-neutral-50 hover:ring-neutral-300 xl:p-10">
                    <Border position="top" className="mb-6" />
                    <h3 className="font-display text-lg font-semibold text-neutral-950 mb-4">
                      {bucket.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                    <p className="text-sm text-neutral-600 mb-6 leading-6">
                      Collection créée le {bucket.creationDate.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    <div className="mt-8">
                      <Link
                        href={`/shop/${bucket.name}`}
                        className="block w-full rounded-md bg-neutral-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-600 transition-colors"
                      >
                        Découvrir la collection
                      </Link>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </FadeInStagger>
          </div>
        </FadeIn>
      </Container>
    </>
  )
}
