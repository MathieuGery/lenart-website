import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Blockquote } from '@/components/Blockquote'
import { Border } from '@/components/Border'
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { FadeIn, FadeInStagger } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import logoBrightPath from '@/images/clients/bright-path/logo-dark.svg'
import logoFamilyFund from '@/images/clients/family-fund/logo-dark.svg'
import logoGreenLife from '@/images/clients/green-life/logo-dark.svg'
import logoHomeWork from '@/images/clients/home-work/logo-dark.svg'
import logoMailSmirk from '@/images/clients/mail-smirk/logo-dark.svg'
import logoNorthAdventures from '@/images/clients/north-adventures/logo-dark.svg'
import logoPhobia from '@/images/clients/phobia/logo-dark.svg'
import logoUnseal from '@/images/clients/unseal/logo-dark.svg'
import { formatDate } from '@/lib/formatDate'
import { type CaseStudy, loadCaseStudies, type MDXEntry } from '@/lib/mdx'
import fs from 'fs'
import path from 'path'

function CaseStudies({
  caseStudies,
}: {
  caseStudies: Array<MDXEntry<CaseStudy>>
}) {
  return (
    <Container className="mt-40">
      <FadeIn>
        <h2 className="font-display text-2xl font-semibold text-neutral-950">
          Case studies
        </h2>
      </FadeIn>
      <div className="mt-10 space-y-20 sm:space-y-24 lg:space-y-32">
        {caseStudies.map((caseStudy) => (
          <FadeIn key={caseStudy.client}>
            <article>
              <Border className="grid grid-cols-3 gap-x-8 gap-y-8 pt-16">
                <div className="col-span-full sm:flex sm:items-center sm:justify-between sm:gap-x-8 lg:col-span-1 lg:block">
                  <div className="sm:flex sm:items-center sm:gap-x-6 lg:block">
                    <Image
                      src={caseStudy.logo}
                      alt=""
                      className="h-16 w-16 flex-none"
                      unoptimized
                    />
                    <h3 className="mt-6 text-sm font-semibold text-neutral-950 sm:mt-0 lg:mt-8">
                      {caseStudy.client}
                    </h3>
                  </div>
                  <div className="mt-1 flex gap-x-4 sm:mt-0 lg:block">
                    <p className="text-sm tracking-tight text-neutral-950 after:ml-4 after:font-semibold after:text-neutral-300 after:content-['/'] lg:mt-2 lg:after:hidden">
                      {caseStudy.service}
                    </p>
                    <p className="text-sm text-neutral-950 lg:mt-2">
                      <time dateTime={caseStudy.date}>
                        {formatDate(caseStudy.date)}
                      </time>
                    </p>
                  </div>
                </div>
                <div className="col-span-full lg:col-span-2 lg:max-w-2xl">
                  <p className="font-display text-4xl font-medium text-neutral-950">
                    <Link href={caseStudy.href}>{caseStudy.title}</Link>
                  </p>
                  <div className="mt-6 space-y-6 text-base text-neutral-600">
                    {caseStudy.summary.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  <div className="mt-8 flex">
                    <Button
                      href={caseStudy.href}
                      aria-label={`Read case study: ${caseStudy.client}`}
                    >
                      Read case study
                    </Button>
                  </div>
                  {caseStudy.testimonial && (
                    <Blockquote
                      author={caseStudy.testimonial.author}
                      className="mt-12"
                    >
                      {caseStudy.testimonial.content}
                    </Blockquote>
                  )}
                </div>
              </Border>
            </article>
          </FadeIn>
        ))}
      </div>
    </Container>
  )
}

const clients = [
  ['Phobia', logoPhobia],
  ['Family Fund', logoFamilyFund],
  ['Unseal', logoUnseal],
  ['Mail Smirk', logoMailSmirk],
  ['Home Work', logoHomeWork],
  ['Green Life', logoGreenLife],
  ['Bright Path', logoBrightPath],
  ['North Adventures', logoNorthAdventures],
]

function Clients() {
  return (
    <Container className="mt-24 sm:mt-32 lg:mt-40">
      <FadeIn>
        <h2 className="font-display text-2xl font-semibold text-neutral-950">
          You’re in good company
        </h2>
      </FadeIn>
      <FadeInStagger className="mt-10" faster>
        <Border as={FadeIn} />
        <ul
          role="list"
          className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-4"
        >
          {clients.map(([client, logo]) => (
            <li key={client} className="group">
              <FadeIn className="overflow-hidden">
                <Border className="pt-12 group-[&:nth-child(-n+2)]:-mt-px sm:group-[&:nth-child(3)]:-mt-px lg:group-[&:nth-child(4)]:-mt-px">
                  <Image src={logo} alt={client} unoptimized />
                </Border>
              </FadeIn>
            </li>
          ))}
        </ul>
      </FadeInStagger>
    </Container>
  )
}

export const metadata: Metadata = {
  title: 'Mon Travail',
  description:
    'Découvrez mes projets récents, des portraits aux mariages, en passant par des séances en extérieur avec les chevaux.',
}

export default async function Work() {
  let caseStudies = await loadCaseStudies()

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

      {/* Render the gallery component */}
      <Gallery />


      {/* <CaseStudies caseStudies={caseStudies} />

      <Testimonial
        className="mt-24 sm:mt-32 lg:mt-40"
        client={{ name: 'Mail Smirk', logo: logoMailSmirk }}
      >
        We approached <em>Studio</em> because we loved their past work. They
        delivered something remarkably similar in record time.
      </Testimonial>

      <Clients />

      <ContactSection />*/}
    </>
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
                <FadeIn key={`${colIndex}-${imgIndex}`}>
                  <div>
                    <Image
                      className="h-auto max-w-full rounded-lg object-cover object-center transition-transform duration-300 hover:scale-105"
                      src={image.src}
                      alt={image.alt}
                      width={500}
                      height={350}
                    />
                  </div>
                </FadeIn>
              ))}
            </div>
          ))}
        </div>
      </FadeInStagger>
    </Container>
  );
};
