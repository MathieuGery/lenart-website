'use client'

import { useEffect, useState } from 'react'

// ============================================================
// 📅 MODIFIE CETTE DATE POUR CHANGER LE COMPTE À REBOURS
// Format : année, mois (0-11), jour, heure, minute, seconde
// Exemple : 1er avril 2026 à 10h00 → new Date(2026, 3, 1, 10, 0, 0)
// ============================================================
const TARGET_DATE = new Date(2026, 2, 16, 18, 0, 0) // 16 mars 2026 à 18h00

function getTimeRemaining(target: Date) {
  const now = new Date()
  const diff = target.getTime() - now.getTime()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isExpired: false,
  }
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm sm:h-28 sm:w-28">
        <span className="text-4xl font-bold tabular-nums text-white sm:text-6xl">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="mt-3 text-sm font-medium uppercase tracking-wider text-neutral-400">
        {label}
      </span>
    </div>
  )
}

export default function CountdownPage() {
  const [time, setTime] = useState(getTimeRemaining(TARGET_DATE))

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(TARGET_DATE)
      setTime(remaining)

      if (remaining.isExpired) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (time.isExpired) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6">
        <h1 className="text-center text-4xl font-bold text-white sm:text-6xl">
          Et c'est parti ! 🎉
        </h1>
        <a
          className="mt-8 rounded-full bg-white px-8 py-3 text-lg font-semibold text-neutral-950 transition hover:bg-neutral-200"
        >
          Accéder au site
        </a>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white sm:text-5xl">
          Patience, la fête va bientôt commencer
        </h1>
        <p className="mt-4 text-lg text-neutral-400">
          La chasse aux codes promos ouvrira ses portes dans quelques instants...
        </p>
      </div>

      <div className="mt-12 flex gap-4 sm:gap-8">
        <TimeBlock value={time.days} label="Jours" />
        <TimeBlock value={time.hours} label="Heures" />
        <TimeBlock value={time.minutes} label="Minutes" />
        <TimeBlock value={time.seconds} label="Secondes" />
      </div>

      <p className="mt-12 text-sm text-neutral-500">
        Lancement prévu le{' '}
        {TARGET_DATE.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </div>
  )
}
