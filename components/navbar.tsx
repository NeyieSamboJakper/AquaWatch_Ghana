import { createClient } from '@/lib/supabase/server'
import { NavbarClient } from '@/components/navbar-client'
import type { UserRole } from '@/lib/types'

export default async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let role: UserRole | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    role = profile?.role ?? null
  }

  return <NavbarClient user={user} role={role} />
}
