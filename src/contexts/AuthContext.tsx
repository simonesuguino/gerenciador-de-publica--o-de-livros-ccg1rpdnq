import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import type { UserRecord, UserRole, BookAccessRecord } from '@/types/book'
import { getUserBookAccess } from '@/services/security'

interface AuthContextType {
  user: UserRecord | null
  token: string | null
  role: UserRole | null
  isAdmin: boolean
  isColaboradora: boolean
  isRevisora: boolean
  isAuthenticated: boolean
  isLoading: boolean
  bookAccessList: BookAccessRecord[]
  canEditBook: (bookId?: string) => boolean
  canExportBook: (bookId?: string) => boolean
  canCommentBook: (bookId?: string) => boolean
  login: (email: string, pass: string) => Promise<void>
  logout: () => void
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRecord | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [bookAccessList, setBookAccessList] = useState<BookAccessRecord[]>([])

  const syncUserFromRecord = useCallback(async () => {
    const record = pb.authStore.record
    if (pb.authStore.isValid && record) {
      // Se a conta estiver marcada como desativada, desloga imediatamente
      const isActive = record.get('is_active') !== false
      if (!isActive) {
        pb.authStore.clear()
        setUser(null)
        setToken(null)
        setBookAccessList([])
        setIsLoading(false)
        return
      }

      const role = (record.get('role') as UserRole) || 'colaboradora'
      const currentUser: UserRecord = {
        id: record.id,
        email: record.email || '',
        name: record.get('name') || '',
        avatar: record.get('avatar') || '',
        role,
        is_active: isActive,
      }
      setUser(currentUser)
      setToken(pb.authStore.token)

      // Carregar permissões de livros para o usuário logado
      try {
        if (role === 'administradora') {
          // Administradora tem acesso total a todos os livros
          setBookAccessList([])
        } else {
          const accesses = await getUserBookAccess(record.id)
          setBookAccessList(accesses)
        }
      } catch (err) {
        console.warn('Erro ao carregar permissões do usuário:', err)
        setBookAccessList([])
      }
    } else {
      setUser(null)
      setToken(null)
      setBookAccessList([])
    }
    setIsLoading(false)
  }, [])

  // Validação da sessão ao inicializar
  useEffect(() => {
    let isMounted = true

    const validateSession = async () => {
      if (pb.authStore.isValid && pb.authStore.token) {
        try {
          // Valida no backend se a sessão ainda é válida e se o usuário não foi desativado
          await pb.collection('users').authRefresh()
        } catch {
          // Sessão inválida ou expirada: limpar
          pb.authStore.clear()
        }
      }
      if (isMounted) {
        await syncUserFromRecord()
      }
    }

    validateSession()

    const unsubscribe = pb.authStore.onChange(async () => {
      if (isMounted) {
        await syncUserFromRecord()
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [syncUserFromRecord])

  const login = async (email: string, pass: string) => {
    const res = await pb.collection('users').authWithPassword(email.trim(), pass)
    // Se a conta for desativada, bloqueia o acesso
    if (res.record.get('is_active') === false) {
      pb.authStore.clear()
      throw new Error('Sua conta foi desativada pela administração. Entre em contato.')
    }
    await syncUserFromRecord()
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setToken(null)
    setBookAccessList([])
  }

  const refreshAuth = async () => {
    await syncUserFromRecord()
  }

  const role = user?.role || null
  const isAdmin = role === 'administradora'
  const isColaboradora = role === 'colaboradora'
  const isRevisora = role === 'revisora'

  const canEditBook = useCallback(
    (bookId?: string): boolean => {
      if (!user) return false
      if (user.role === 'administradora') return true
      if (user.role === 'revisora') return false
      if (!bookId) return false
      const acc = bookAccessList.find((a) => a.book_id === bookId)
      return !!acc?.can_edit
    },
    [user, bookAccessList],
  )

  const canExportBook = useCallback(
    (bookId?: string): boolean => {
      if (!user) return false
      if (user.role === 'administradora') return true
      if (user.role === 'revisora') return false
      if (!bookId) return false
      const acc = bookAccessList.find((a) => a.book_id === bookId)
      return !!acc?.can_export
    },
    [user, bookAccessList],
  )

  const canCommentBook = useCallback(
    (bookId?: string): boolean => {
      if (!user) return false
      if (user.role === 'administradora') return true
      if (!bookId) return false
      const acc = bookAccessList.find((a) => a.book_id === bookId)
      return acc ? !!acc.can_comment : false
    },
    [user, bookAccessList],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAdmin,
        isColaboradora,
        isRevisora,
        isAuthenticated: !!user,
        isLoading,
        bookAccessList,
        canEditBook,
        canExportBook,
        canCommentBook,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
