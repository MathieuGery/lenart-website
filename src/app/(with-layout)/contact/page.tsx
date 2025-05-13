'use client'
import { useId, useState } from 'react'
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
  const [inputs, setInputs] = useState({
    email: '',
    subject: '',
    message: '',
    name: ''
  })
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputs((prev) => ({
      ...prev,
      [event.target.id]: event.target.value
    }))
  }

  const handleOnSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')
    setLoading(true)

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_FORM_BOLD_URL as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      })

      if (!response.ok) {
        throw new Error('Erreur réseau')
      }

      setSuccessMessage('Votre message a bien été envoyé. Merci !')
      setInputs({ email: '', subject: '', message: '', name: '' })
    } catch (error) {
      setErrorMessage('Une erreur est survenue. Veuillez réessayer plus tard.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <FadeIn className="lg:order-last">
      <form onSubmit={handleOnSubmit}>
        <h2 className="font-display text-base font-semibold text-neutral-950">
          Prise de contact
        </h2>
        <div className="isolate mt-6 -space-y-px rounded-2xl bg-white/50">
          <TextInput label="Nom" name="name" id="name" autoComplete="name" onChange={handleOnChange} value={inputs.name} required />
          <TextInput label="Email" type="email" id="email" name="email" autoComplete="email" onChange={handleOnChange} value={inputs.email} required />
          <div className="group relative z-0 transition-all focus-within:z-10">
            <textarea
              id="message"
              name="message"
              placeholder=" "
              className="peer block w-full border border-neutral-300 bg-transparent px-6 pb-4 pt-6 text-base/6 text-neutral-950 ring-4 ring-transparent transition focus:border-neutral-950 focus:outline-none focus:ring-neutral-950/5 group-first:rounded-t-2xl group-last:rounded-b-2xl"
              rows={6}
              onChange={handleOnChange}
              value={inputs.message}
              required
            />
            <label
              htmlFor="message"
              className="pointer-events-none absolute left-6 top-4 origin-left text-base/6 text-neutral-500 transition-all duration-200 peer-focus:top-2 peer-focus:scale-75 peer-focus:font-semibold peer-focus:text-neutral-950 peer-placeholder-shown:top-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:font-normal peer-placeholder-shown:text-neutral-500"
            >
              Message
            </label>
          </div>
        </div>

        <Button type="submit" className="mt-10" disabled={loading}>
          {loading ? (
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              Envoi en cours...
            </div>
          ) : (
            'Contactez-moi'
          )}
        </Button>

        {successMessage && (
          <p className="mt-4 text-green-700 font-medium">{successMessage}</p>
        )}
        {errorMessage && (
          <p className="mt-4 text-red-600 font-medium">{errorMessage}</p>
        )}
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

// export const metadata: Metadata = {
//   title: 'Contact',
//   description: 'Un projet, une envie, ou simplement une question.',
// }

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


