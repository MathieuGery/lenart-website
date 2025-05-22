'use client'

import { useState, useTransition } from 'react'
import { PageIntro } from '@/components/PageIntro'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/utils/supabase-browser'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      try {
        const { data, error: loginError } = await supabaseBrowser.auth.signInWithPassword({
          email,
          password,
        })
        if (loginError) {
          setError('Identifiants invalides')
          return
        }
        // Vérification du rôle admin après connexion via la table admin_roles
        const userId = data?.user?.id
        if (!userId) {
          setError('Erreur lors de la récupération de l\'utilisateur')
          await supabaseBrowser.auth.signOut()
          return
        }
        const { data: roles, error: rolesError } = await supabaseBrowser
          .from('admin_roles')
          .select('user_id')
          .eq('user_id', userId)
        if (rolesError || !roles || roles.length === 0) {
          setError('Accès réservé aux administrateurs')
          await supabaseBrowser.auth.signOut()
          return
        }
        router.push('/admin/dashboard')
      } catch (err) {
        setError('Erreur lors de la connexion')
      }
    })
  }

  return (
    <>
      <PageIntro eyebrow="" title="Espace administrateur">
        <p>
          Connectez-vous pour accéder à la gestion du site Lenart.
        </p>
      </PageIntro>

      <Container className="mt-16 sm:mt-20">
        <FadeIn>
          <div className="mx-auto max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-lg border border-neutral-200">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-md mb-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-600 bg-neutral-50 text-gray-900 placeholder-gray-400"
                  autoComplete="email"
                  placeholder="admin@lenart.fr"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-600 bg-neutral-50 text-gray-900 placeholder-gray-400"
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-3 py-2 text-sm font-semibold text-white bg-gray-900 rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-150"
                >
                  {loading ? 'Connexion…' : 'Se connecter'}
                </button>
              </div>
            </form>
          </div>
        </FadeIn>
      </Container>
    </>
  )
}
