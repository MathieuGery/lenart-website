import { getSupabaseServerClient } from '@/utils/supabase-ssr'
import { PageIntro } from '@/components/PageIntro'
import { Container } from '@/components/Container'
import clsx from 'clsx'
import { FadeIn } from '@/components/FadeIn'
import Link from 'next/link'

function SvgIcon({ svgContent }: { svgContent: string }) {
  return (
    <div
      className="h-16 w-16 lg:h-20 lg:w-20 flex-shrink-0 relative"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  )
}

export const revalidate = 0

export default async function LinkTree() {
  const supabase = getSupabaseServerClient()
  const { data: links } = await supabase
    .from('LinkTree')
    .select()

  return (
    <>
      {/* Arrière-plan avec dégradé subtil */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <PageIntro
          eyebrow=""
          title="Liens utiles"
        >
          <p>
            Retrouvez tous nos liens importants au même endroit
          </p>
        </PageIntro>

        <Container className={clsx('mt-24 sm:mt-32 lg:mt-40 pb-24')}>
          <FadeIn>
            <div className="max-w-5xl mx-auto">
              {/* Grille responsive avec meilleur espacement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {links?.map((link, index) => (
                  <Link
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                      "group relative overflow-hidden",
                      "flex flex-col items-center text-center p-8 lg:p-10",
                      "bg-white rounded-2xl lg:rounded-3xl",
                      "shadow-lg hover:shadow-2xl",
                      "border border-gray-100 hover:border-gray-200",
                      "transition-all duration-300 ease-out",
                      "transform hover:-translate-y-2 hover:scale-105",
                      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-gray-900/5 before:to-black/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
                    )}
                    style={{
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    {/* Effet de brillance au survol */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                    
                    {/* Icône avec effet de zoom */}
                    <div className="relative z-10 mb-6">
                      {link.icon && (
                        <div className="transform transition-transform duration-300 group-hover:scale-110">
                          <SvgIcon svgContent={link.icon} />
                        </div>
                      )}
                    </div>
                    
                    {/* Titre avec effet de couleur */}
                    <span className={clsx(
                      "relative z-10 text-xl lg:text-2xl font-semibold",
                      "text-gray-900 group-hover:text-black",
                      "transition-colors duration-300",
                      "tracking-tight leading-tight"
                    )}>
                      {link.title}
                    </span>
                    
                    {/* Indicateur de lien externe */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Section décorative en bas */}
              <div className="mt-20 text-center">
                <div className="flex items-center justify-center space-x-2 text-gray-400">
                  <div className="w-12 h-px bg-gradient-to-r from-transparent to-gray-300"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <div className="w-12 h-px bg-gradient-to-l from-transparent to-gray-300"></div>
                </div>
              </div>
            </div>
          </FadeIn>
        </Container>
      </div>
    </>
  )
} 
