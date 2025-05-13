'use client'
import { PageIntro } from '@/components/PageIntro'
import { CheckIcon } from '@heroicons/react/20/solid'

export default function Tarifs() {
  return (
    <>
      <PageIntro eyebrow="Tarifs" title="Tarifs">
        <p>
          Chaque projet est unique, c’est pourquoi je propose plusieurs formules adaptées à vos besoins. Que ce soit pour un portrait intime, un moment de vie à immortaliser ou un projet professionnel, vous trouverez ici l’offre qui vous convient.</p>
      </PageIntro>
      <TarifsCards />
    </>
  )
}

const tiers = [
  {
    name: 'Formule PADDOCK',
    id: 'tier-paddock',
    price: '€8',
    description: 'The essentials to provide your best work for clients.',
    features: ['1 photo en format numérique', '1 impression 10x15cm'],
    featured: false,
  },
  {
    name: 'Formule PODIUM',
    id: 'tier-podium',
    price: '€15',
    description: 'A plan that scales with your rapidly growing business.',
    features: [
      '3 photos en format numérique'
    ],
    featured: false,
  },
  {
    name: 'Formule OXER',
    id: 'tier-oxer',
    price: '€12',
    description: 'A plan that scales with your rapidly growing business.',
    features: [
      '2 photos en format numérique',
      '1 impression 10x15cm',
      '+5 € par photo supplémentaire en format numérique'
    ],
    featured: false,
  },
  {
    name: 'Formule GRAND PRIX',
    id: 'tier-grandprix',
    price: '€16',
    description: 'A plan that scales with your rapidly growing business.',
    features: [
      '1 photo en format numérique',
      '1 impression A4'
    ],
    featured: false,
  },
  {
    name: 'Formule TOUR D\'HONNEUR',
    id: 'tier-tourdhonneur',
    price: '€35',
    description: 'A plan that scales with your rapidly growing business.',
    features: [
      'toutes les photos du tour en format numérique',
      '1 impression 10x15cm'
    ],
    featured: false,
  },
  {
    name: 'Personnalisé',
    id: 'tier-enterprise',
    href: '/contact',
    price: 'Sur devis',
    description: 'Réalisez vos projets les plus ambitieux avec la formule Personnalisée.',
    features: [

    ],
    featured: true,
    cta: 'Me Contacter',
  },
]

function classNames(...classes: (string | boolean)[]) {
  return classes.filter(Boolean).join(' ')
}

function TarifsCards() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mt-16 flex justify-center">
          <fieldset aria-label="Payment frequency">

          </fieldset>
        </div>
        <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={classNames(
                tier.featured ? 'bg-gray-900 ring-gray-900' : 'ring-gray-200',
                'rounded-3xl p-8 ring-1 xl:p-10',
              )}
            >
              <h3
                id={tier.id}
                className={classNames(tier.featured ? 'text-white' : 'text-gray-900', 'text-lg/8 font-semibold')}
              >
                {tier.name}
              </h3>
              <p className={classNames(tier.featured ? 'text-gray-300' : 'text-gray-600', 'mt-4 text-sm/6')}>
                {tier.description}
              </p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span
                  className={classNames(
                    tier.featured ? 'text-white' : 'text-gray-900',
                    'text-4xl font-semibold tracking-tight',
                  )}
                >
                  {typeof tier.price === 'string' ? tier.price : tier.price}
                </span>

              </p>
              <a
                href={tier.href}
                aria-describedby={tier.id}
                className={classNames(
                  tier.featured
                    ? 'bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white'
                    : 'bg-teal-500 text-white shadow-xs hover:bg-teal-700 focus-visible:outline-teal-600',
                  'mt-6 block rounded-md px-3 py-2 text-center text-sm/6 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2',
                )}
              >
                {tier.cta ? tier.cta : 'Je choisis cette formule !'}
              </a>
              {/* {tier.featured ? <a
                href={tier.href}
                aria-describedby={tier.id}
                className='bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white mt-6 block rounded-md px-3 py-2 text-center text-sm/6 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2'
              >
                {tier.cta}
              </a> : <> </>} */}
              <ul
                role="list"
                className={classNames(
                  tier.featured ? 'text-gray-300' : 'text-gray-600',
                  'mt-8 space-y-3 text-sm/6 xl:mt-10',
                )}
              >
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon
                      aria-hidden="true"
                      className={classNames(tier.featured ? 'text-white' : 'text-neutral-600', 'h-6 w-5 flex-none')}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
