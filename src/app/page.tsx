import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { ContactSection } from '@/components/ContactSection'
import { Container } from '@/components/Container'
import { FadeIn, FadeInStagger } from '@/components/FadeIn'
import { List, ListItem } from '@/components/List'
import { SectionIntro } from '@/components/SectionIntro'
import { StylizedImage } from '@/components/StylizedImage'
import { Testimonial } from '@/components/Testimonial'
import logoBrightPath from '@/images/clients/bright-path/logo-light.svg'
import logoFamilyFund from '@/images/clients/family-fund/logo-light.svg'
import logoGreenLife from '@/images/clients/green-life/logo-light.svg'
import logoHomeWork from '@/images/clients/home-work/logo-light.svg'
import logoMailSmirk from '@/images/clients/mail-smirk/logo-light.svg'
import logoNorthAdventures from '@/images/clients/north-adventures/logo-light.svg'
import logoPhobiaLight from '@/images/clients/phobia/logo-light.svg'
import logoUnseal from '@/images/clients/unseal/logo-light.svg'
import imageLaptop from '@/images/laptop.jpg'
import { type CaseStudy, type MDXEntry, loadCaseStudies } from '@/lib/mdx'

const clients = [
  ['Phobia', logoPhobiaLight],
  ['Family Fund', logoFamilyFund],
  ['Unseal', logoUnseal],
  ['Mail Smirk', logoMailSmirk],
  ['Home Work', logoHomeWork],
  ['Green Life', logoGreenLife],
  ['Bright Path', logoBrightPath],
  ['North Adventures', logoNorthAdventures]
]

function Clients() {
  return (
    // returns the default 404 page with a status code of 404 in production
    <div className="mt-24 rounded-4xl bg-neutral-950 py-20 sm:mt-32 sm:py-32 lg:mt-56">
      <Container>
        <FadeIn className="flex items-center gap-x-8">
          <h2 className="text-center font-display text-sm font-semibold tracking-wider text-white sm:text-left">
            The best photograph ever existed
          </h2>
          <div className="h-px flex-auto bg-neutral-800"/>
        </FadeIn>
        <FadeInStagger faster>
          <ul
            role="list"
            className="mt-10 grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4"
          >
            {clients.map(([client, logo]) => (
              <li key={client}>
                <FadeIn>
                  <Image src={logo} alt={client} unoptimized/>
                </FadeIn>
              </li>
            ))}
          </ul>
        </FadeInStagger>
      </Container>
    </div>
  )
}

function CaseStudies({
                       caseStudies
                     }: {
  caseStudies: Array<MDXEntry<CaseStudy>>
}) {
  return (
    <>
      <SectionIntro
        title="Harnessing technology for a brighter future"
        className="mt-24 sm:mt-32 lg:mt-40"
      >
        <p>
          best photos everyday
        </p>
      </SectionIntro>
      <Container className="mt-16">
        <FadeInStagger className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {caseStudies.map((caseStudy) => (
            <FadeIn key={caseStudy.href} className="flex">
              <article
                className="relative flex w-full flex-col rounded-3xl p-6 ring-1 ring-neutral-950/5 transition hover:bg-neutral-50 sm:p-8">
                <h3>
                  <Link href={caseStudy.href}>
                    <span className="absolute inset-0 rounded-3xl"/>
                    <Image
                      src={caseStudy.logo}
                      alt={caseStudy.client}
                      className="h-16 w-16"
                      unoptimized
                    />
                  </Link>
                </h3>
                <p className="mt-6 flex gap-x-2 text-sm text-neutral-950">
                  <time
                    dateTime={caseStudy.date.split('-')[0]}
                    className="font-semibold"
                  >
                    {caseStudy.date.split('-')[0]}
                  </time>
                  <span className="text-neutral-300" aria-hidden="true">
                    /
                  </span>
                  <span>truc machin</span>
                </p>
                <p className="mt-6 font-display text-2xl font-semibold text-neutral-950">
                  {caseStudy.title}
                </p>
                <p className="mt-4 text-base text-neutral-600">
                  {caseStudy.description}
                </p>
              </article>
            </FadeIn>
          ))}
        </FadeInStagger>
      </Container>
    </>
  )
}

function Services() {
  return (
    <>
      <SectionIntro
        eyebrow="Services"
        title="I make the best photos ever existed"
        className="mt-24 sm:mt-32 lg:mt-40"
      >
        <p>
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab, accusamus adipisci debitis delectus dicta hic
          ipsa ipsam ipsum nostrum, optio quasi qui quis rem repellat sequi sint velit vitae voluptas?
        </p>
      </SectionIntro>
      <Container className="mt-16">
        <div className="lg:flex lg:items-center lg:justify-end">
          <div className="flex justify-center lg:w-1/2 lg:justify-end lg:pr-12">
            <FadeIn className="w-[33.75rem] flex-none lg:w-[45rem]">
              <StylizedImage
                src={imageLaptop}
                sizes="(min-width: 1024px) 41rem, 31rem"
                className="justify-center lg:justify-end"
              />
            </FadeIn>
          </div>
          <List className="mt-16 lg:mt-0 lg:w-1/2 lg:min-w-[33rem] lg:pl-4">
            <ListItem title="truc muche">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Atque laudantium nostrum reprehenderit vitae.
              Harum illum nulla perferendis reiciendis! Corporis dicta doloremque eaque esse illum magni praesentium
              quod quos soluta tenetur!
            </ListItem>
            <ListItem title="truc muche">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. A adipisci at commodi deserunt, ducimus ea eum
              eveniet maxime numquam officia perferendis possimus praesentium sit, suscipit totam vel voluptatem
              voluptates voluptatum.
            </ListItem>
            <ListItem title="truc muche">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. Amet debitis dolorem ducimus ea eius ipsum
              laudantium, minima modi nemo officia, porro quia sequi sint veritatis voluptas? Adipisci deserunt modi
              porro.
            </ListItem>
            <ListItem title="truc muche">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit. A adipisci et eveniet necessitatibus nesciunt,
              nostrum officiis veritatis voluptas? Animi impedit in ipsum magni nemo officiis quam quas recusandae
              sapiente voluptatum?
            </ListItem>
          </List>
        </div>
      </Container>
    </>
  )
}

export const metadata: Metadata = {
  description:
    'len-art photographie'
}

export default async function Home() {
  let caseStudies = (await loadCaseStudies()).slice(0, 3)

  return (
    <>
      <Container className="mt-24 sm:mt-32 md:mt-56">
        <FadeIn className="max-w-3xl">
          <h1
            className="font-display text-5xl font-medium tracking-tight text-neutral-950 [text-wrap:balance] sm:text-7xl">
            Best photos Lenart
          </h1>
          <p className="mt-6 text-xl text-neutral-600">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab accusamus amet autem, blanditiis delectus dolor
            dolorem itaque libero minus necessitatibus nulla officia perferendis perspiciatis porro rerum saepe
            similique temporibus unde.
          </p>
        </FadeIn>
      </Container>


      {/* <CaseStudies caseStudies={caseStudies} />
*/}
      <Testimonial
        className="mt-24 sm:mt-32 lg:mt-40"
        client={{name: 'Trcu machine', logo: logoUnseal}}
      >
        lorem ipsum dolor sit amet, consectetur adipisicing elit. Ab accusamus
      </Testimonial>

      <Services/>

      <ContactSection/>
    </>
  )
}
