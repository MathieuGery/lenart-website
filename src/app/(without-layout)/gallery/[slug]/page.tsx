import { PageIntro } from '@/components/PageIntro'
import { Container } from '@/components/Container'
import clsx from 'clsx'
import { FadeIn } from '@/components/FadeIn'
import Link from 'next/link'
import { redirect404 } from '@/app/(without-layout)/gallery/action'
import { getSupabaseServerClient } from '@/utils/supabase-ssr'

export const revalidate = 0

export default async function GalleryAmzId({ params }: { params: { slug: string } }) {
  const supabase = getSupabaseServerClient()
  const {data: GalleryAmz} = await supabase
    .from('GalleryAmz')
    .select()
    .eq('code', params.slug)
    .order('created_at', {ascending: true})

  if (!GalleryAmz?.length) {
    await redirect404()
  }

  return (
    <>
      <PageIntro
        eyebrow=""
        title="Galeries photos"
      >
        <p>
          Les photos sont dotées d’un watermark afin de prévenir de tout vol. Il sera retiré après confirmation de la commande. Les photos sont systématiquement retouchées (lumière, zoom, cadrage, etc.)
        </p>
      </PageIntro>

      <Container
        className={clsx('mt-24 sm:mt-32 lg:mt-40', 'text-center')}
      >
        <FadeIn>
          <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {GalleryAmz?.map((session) => (
              <li
                key={session.title}
                className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow"
              >
                <div className="flex flex-1 flex-col p-8">
                  <img className="object-cover mx-auto h-32 w-32 flex-shrink-0 rounded-full"
                       src={'https://lvrhiybjdwdablbqawtf.supabase.co/storage/v1/object/public/GalleryAmz/' + session.id + '.jpg'}
                       alt=""/>
                  <h3 className="mt-6 text-sm font-medium text-gray-900">{session.title}</h3>
                  <dl className="mt-1 flex flex-grow flex-col justify-between">
                    <dt className="sr-only">Title</dt>
                    <dd className="text-sm text-gray-500">{session.date}</dd>
                    <dt className="sr-only">Role</dt>
                    <dd className="mt-3">
                      <Link href={session.link || ''}>
                        <button
                          type="button"
                          className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                        >
                          Accéder aux photos
                        </button>
                      </Link>
                    </dd>
                  </dl>
                </div>
              </li>
            ))}
          </ul>
        </FadeIn>
      </Container>
    </>
  )
}
