import { useId } from 'react'
import { type Metadata } from 'next'
import Link from 'next/link'

import { Border } from '@/components/Border'
import { Button } from '@/components/Button'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { PageIntro } from '@/components/PageIntro'
import { SocialMedia } from '@/components/SocialMedia'

function TextInput({
  label,
  ...props
}: React.ComponentPropsWithoutRef<'input'> & { label: string }) {
  let id = useId()

  return (
    <div className="group relative z-0 transition-all focus-within:z-10">
      <input
        type="text"
        id={id}
        {...props}
        placeholder=" "
        className="peer block w-full border border-neutral-300 bg-transparent px-6 pb-4 pt-12 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5 group-first:rounded-t-2xl group-last:rounded-b-2xl"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-6 top-1/2 -mt-3 origin-left text-base/6 text-neutral-500 transition-all duration-200 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:font-semibold peer-focus:text-neutral-950 peer-[:not(:placeholder-shown)]:-translate-y-4 peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:text-neutral-950"
      >
        {label}
      </label>
    </div>
  )
}

function RadioInput({
  label,
  ...props
}: React.ComponentPropsWithoutRef<'input'> & { label: string }) {
  return (
    <label className="flex gap-x-3">
      <input
        type="radio"
        {...props}
        className="h-6 w-6 flex-none appearance-none rounded-full border border-neutral-950/20 outline-none checked:border-[0.5rem] checked:border-neutral-950 focus-visible:ring-1 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
      />
      <span className="text-base/6 text-neutral-950">{label}</span>
    </label>
  )
}

function ContactForm() {
  return (
    <FadeIn className="lg:order-last">
      <form>
        <h2 className="font-display text-base font-semibold text-neutral-950">
          Prise de contact
        </h2>
        <div className="isolate mt-6 -space-y-px rounded-2xl bg-white/50">
          <TextInput label="Nom" name="name" autoComplete="name" required/>
          <TextInput
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
          />
            <div className="group relative z-0 transition-all focus-within:z-10">
            <textarea
              id="message"
              name="message"
              placeholder=" "
              className="peer block w-full border border-neutral-300 bg-transparent px-6 pb-4 pt-6 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5 group-first:rounded-t-2xl group-last:rounded-b-2xl"
              rows={6}
            />
            <label
              htmlFor="message"
              className="pointer-events-none absolute left-6 top-4 origin-left text-base/6 text-neutral-500 transition-all duration-200 peer-focus:top-2 peer-focus:scale-75 peer-focus:font-semibold peer-focus:text-neutral-950 peer-placeholder-shown:top-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:font-normal peer-placeholder-shown:text-neutral-500"
            >
              Message
            </label>
            </div>
        </div>
        <Button type="submit" className="mt-10">
          Contactez-moi
        </Button>
      </form>
    </FadeIn>
  )
}

function ContactDetails() {
  return (
    <FadeIn>
      <h2 className="font-display text-base font-semibold text-neutral-950">
        Contactez moi
      </h2>
      <p className="mt-6 text-base text-neutral-600">
        Vous avez un projet, une envie, ou simplement une question ?
        Je suis à votre écoute. Que ce soit pour une séance photo, un événement à couvrir ou toute autre demande, n’hésitez pas à me contacter.
        Remplissez le formulaire ci-dessous ou écrivez-moi directement par e-mail. Je vous répondrai dans les plus brefs délais.
      </p>

      <Border className="mt-16 pt-16">
        <h2 className="font-display text-base font-semibold text-neutral-950">
          Me contacter directement
        </h2>
        <dl className="mt-6 grid grid-cols-1 gap-8 text-sm sm:grid-cols-2">
            <div>
            <dt className="font-semibold text-neutral-950">Email</dt>
            <dd>
              <Link
              href="mailto:contact@len-art.fr"
              className="text-neutral-600 hover:text-neutral-950"
              >
              contact@len-art.fr
              </Link>
            </dd>
            </div>
            <div>
            <dt className="font-semibold text-neutral-950">Instagram</dt>
            <dd>
              <Link
              href="https://instagram.com/len_._art"
              className="text-neutral-600 hover:text-neutral-950"
              >
              @len_._art
              </Link>
            </dd>
            </div>
        </dl>
      </Border>

      <Border className="mt-16 pt-16">
        <h2 className="font-display text-base font-semibold text-neutral-950">
          Me suivre
        </h2>
        <SocialMedia className="mt-6" />
      </Border>
    </FadeIn>
  )
}

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Un projet, une envie, ou simplement une question.',
}

export default function Contact() {
  return (
    <>
      <PageIntro eyebrow="Contactez moi" title="Réalisons vos envies ensemble">
        <p>Un projet, une envie, ou simplement une question.</p>
      </PageIntro>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <div className="grid grid-cols-1 gap-x-8 gap-y-24 lg:grid-cols-2">
          <ContactForm />
          <ContactDetails />
        </div>
      </Container>
    </>
  )
}
