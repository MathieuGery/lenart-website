import { supabase } from '@/utils/supabase'
import { PageIntro } from '@/components/PageIntro'
import { Container } from '@/components/Container'
import clsx from 'clsx'
import { FadeIn } from '@/components/FadeIn'
import Link from 'next/link'

function SvgIcon({ svgContent }: { svgContent: string }) {
  return (
    <div
      className="h-12 w-12 flex-shrink-0"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  )
}

export const revalidate = 0

export default async function LinkTree() {
  const { data: links } = await supabase
    .from('LinkTree')
    .select()

  return (
    <>
      <PageIntro
        eyebrow=""
        title="Liens utiles"
      >
        <p>
          Retrouvez tous nos liens importants au même endroit
        </p>
      </PageIntro>

      <Container className={clsx('mt-24 sm:mt-32 lg:mt-40')}>
        <FadeIn>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {links?.map((link) => (
                <Link
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 w-full"
                >
                  {link.icon && <SvgIcon svgContent={link.icon} />}
                  <span className="text-xl font-medium text-gray-900">
                    {link.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </FadeIn>
      </Container>
    </>
  )
} 
