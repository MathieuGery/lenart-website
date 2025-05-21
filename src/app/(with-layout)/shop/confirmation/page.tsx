'use client'

import { Suspense } from 'react'
import { PageIntro } from '@/components/PageIntro'
import { Container } from '@/components/Container'
import OrderConfirmationContent from './OrderConfirmationContent'

export default function OrderConfirmationPage() {
  return (
    <>
      <PageIntro
        title="Commande confirmée"
        eyebrow="Merci pour votre achat"
      >
        <p>
          Votre commande a bien été enregistrée. Nous vous contacterons prochainement pour finaliser la transaction et vous envoyer vos photos en haute résolution.
        </p>
      </PageIntro>

      <Container className="mt-16 sm:mt-20">
        <Suspense fallback={<div className="text-center py-8">Chargement des détails de la commande...</div>}>
          <OrderConfirmationContent />
        </Suspense>
      </Container>
    </>
  )
}
