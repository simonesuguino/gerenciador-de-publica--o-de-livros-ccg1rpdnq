import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { BookOpen, KeyRound, Mail, User, AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('simonesuguino@gmail.com')
  const [password, setPassword] = useState('Skip@Pass')
  const [name, setName] = useState('Simone Suguino')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { login, signup } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isSignUp) {
        await signup(email, password, name)
      } else {
        await login(email, password)
      }
      navigate(from, { replace: true })
    } catch (err: unknown) {
      console.error('Falha de autenticação:', err)
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível entrar. Verifique seu e-mail e senha.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-stone-100 items-center justify-center p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-stone-100 bg-stone-900 p-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-md">
            <BookOpen className="h-7 w-7" />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">Cavalo de Tróia</h1>
          <p className="mt-1 text-sm text-stone-400">
            Gerenciador de Publicação & Escrita do Livro
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-semibold text-stone-900">
              {isSignUp ? 'Criar conta de Autor' : 'Entrar na sua conta'}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Acesse seus capítulos, roteiros de narração e checklist de publicação
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-stone-700">
                  Nome do Autor
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <Input
                    id="name"
                    type="text"
                    required
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-stone-700">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="autor@livro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-stone-700">
                Senha
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-700 hover:bg-amber-800 text-white font-medium py-2.5 shadow-sm"
            >
              {loading ? (
                'Processando...'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {isSignUp ? 'Criar conta e iniciar' : 'Entrar no Gerenciador'}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Quick toggle */}
          <div className="mt-6 border-t border-stone-100 pt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setError(null)
                setIsSignUp(!isSignUp)
              }}
              className="text-xs text-amber-800 hover:underline font-medium"
            >
              {isSignUp
                ? 'Já tem conta? Clique para entrar'
                : 'Primeiro acesso? Crie sua conta com e-mail e senha'}
            </button>
          </div>

          {/* Pre-seeded hint for user convenience */}
          <div className="mt-4 rounded-lg bg-stone-50 border border-stone-200/60 p-3 text-[11px] text-stone-500">
            <p className="font-semibold text-stone-700 mb-0.5">Conta do Autor Pré-configurada:</p>
            <p>
              E-mail: <code className="text-stone-800 font-mono">simonesuguino@gmail.com</code>
            </p>
            <p>
              Senha: <code className="text-stone-800 font-mono">Skip@Pass</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
