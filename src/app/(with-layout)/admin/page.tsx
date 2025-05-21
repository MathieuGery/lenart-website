'use client'

import { useState } from 'react'
import { PageIntro } from '@/components/PageIntro'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // Ici, nous simulons simplement une authentification
      // Dans une implémentation réelle, vous utiliseriez Supabase Auth
      
      // Exemple de code pour Supabase:
      // const { error } = await supabase.auth.signInWithPassword({
      //   email,
      //   password,
      // })
      
      // if (error) throw new Error(error.message)
      
      // Pour l'instant, juste une simulation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Rediriger vers la page d'administration après connexion
      router.push('/amin/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageIntro eyebrow="" title="Administration">
        <p>
          Accédez à l'interface d'administration pour gérer le contenu du site.
        </p>
      </PageIntro>
      
      <Container className="mt-16 sm:mt-20">
        <FadeIn>
          <div className="mx-auto max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-neutral-200">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
                  Adresse email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  autoComplete="current-password"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Chargement...' : 'Se connecter'}
                </button>
              </div>
            </form>

            <p className="mt-4 text-center text-sm text-gray-500">
              Pas encore membre?{' '}
              <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Commencez un essai gratuit de 14 jours
              </a>
            </p>
          </div>
        </FadeIn>
      </Container>
    </>
  )
}
