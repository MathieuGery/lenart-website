import { PageIntro } from '@/components/PageIntro'
import clsx from 'clsx'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { supabase } from '@/utils/supabase'
import Link from 'next/link'

export const revalidate = 0
export default async function Gallery() {

  const {data: GalleryAmz, error} = await supabase
    .from('GalleryAmz')
    .select()

  if (!GalleryAmz) {
    return (
      <div>Not found</div>
    )
  }

  return (
    <>
      <PageIntro
        eyebrow="My work"
        title="La gallery"
      >
        <p>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Atque dicta dolore ea eius eos, in iure labore
          laboriosam magnam magni maxime molestias nam nemo obcaecati officiis optio porro ratione similique.
        </p>
      </PageIntro>

      <Container
        className={clsx('mt-24 sm:mt-32 lg:mt-40', 'text-center')}
      >
        <FadeIn>
          <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {GalleryAmz.map((session) => (
              <li
                key={session.title}
                className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow"
              >
                <div className="flex flex-1 flex-col p-8">
                  <img className="mx-auto h-32 w-32 flex-shrink-0 rounded-full" src={'https://lvrhiybjdwdablbqawtf.supabase.co/storage/v1/object/public/GalleryAmz/' + session.id + '.png'} alt=""/>
                  <h3 className="mt-6 text-sm font-medium text-gray-900">{session.title}</h3>
                  <dl className="mt-1 flex flex-grow flex-col justify-between">
                    <dt className="sr-only">Title</dt>
                    <dd className="text-sm text-gray-500">{session.date}</dd>
                    <dt className="sr-only">Role</dt>
                    <dd className="mt-3">
                      <Link href={session.link}>
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