import { createClient } from '@supabase/supabase-js'

// Utilisation de la clé de service pour les actions serveur (jamais côté client !)
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)
