import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Server-only — never import from client components
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
      },
    },
  )
}

type AdminClient = ReturnType<typeof createAdminClient>
type PalpiteJogo = Database['public']['Tables']['palpites_jogos']['Row']

// Fetches all palpites_jogos in pages of 1000 to bypass the Supabase
// REST API default row limit (max_rows = 1000). With 50+ participants
// and 72+ matches the table easily exceeds this limit.
export async function fetchAllPalpitesJogos(admin: AdminClient): Promise<PalpiteJogo[]> {
  const PAGE = 1000
  const all: PalpiteJogo[] = []
  let from = 0
  while (true) {
    const { data, error } = await admin
      .from('palpites_jogos')
      .select('*')
      .range(from, from + PAGE - 1)
    if (error || !data || data.length === 0) break
    all.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}
