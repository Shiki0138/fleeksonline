'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface User {
  id: string
  email?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [membershipType, setMembershipType] = useState<'free' | 'premium' | 'vip' | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          // Get membership type from users table
          const { data: userData } = await supabase
            .from('users')
            .select('membership_type')
            .eq('id', user.id)
            .single()
          
          setMembershipType(userData?.membership_type || 'free')
        } else {
          setMembershipType(null)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('membership_type')
          .eq('id', session.user.id)
          .single()
        
        setMembershipType(userData?.membership_type || 'free')
      } else {
        setMembershipType(null)
      }
      
      router.refresh()
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase, router])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return {
    user,
    membershipType,
    loading,
    signOut
  }
}