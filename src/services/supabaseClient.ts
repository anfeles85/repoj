import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://ciicckjcmkczoczunjxb.supabase.co'

// VITE_SUPABASE_SERVICE_ROLE_KEY permite saltar las restricciones de RLS sin requerir políticas públicas adicionales
const supabaseKey =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
