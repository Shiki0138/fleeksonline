'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { setupAuthStateListener } from '@/lib/auth-helpers'

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
          // Get membership type from fleeks_profiles table
          const { data: profileData } = await supabase
            .from('fleeks_profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          
          // roleをmembershipTypeにマッピング
          if (profileData?.role === 'admin') {
            setMembershipType('vip')
          } else if (profileData?.role === 'paid') {
            setMembershipType('premium')
          } else {
            setMembershipType('free')
          }
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

    // 認証状態変更の監視（ループ防止版）
    const cleanup = setupAuthStateListener(async (user) => {
      setUser(user)
      
      if (user) {
        const { data: profileData } = await supabase
          .from('fleeks_profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        // roleをmembershipTypeにマッピング
        if (profileData?.role === 'admin') {
          setMembershipType('vip')
        } else if (profileData?.role === 'paid') {
          setMembershipType('premium')
        } else {
          setMembershipType('free')
        }
      } else {
        setMembershipType(null)
      }
    })

    return cleanup
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