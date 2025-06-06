import { type Metadata } from 'next'
import { RootLayoutWithoutHeaderFooter } from '@/components/RootLayoutWithoutHeaderFooter'
import '@/styles/tailwind.css'

export const metadata: Metadata = {
  title: {
    template: 'Lenart - Photographe',
    default: 'Lenart - Photographe',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full bg-neutral-950 text-base antialiased">
    <body className="flex min-h-full flex-col">
    <RootLayoutWithoutHeaderFooter>{children}</RootLayoutWithoutHeaderFooter>
    </body>
    </html>
  )
}
