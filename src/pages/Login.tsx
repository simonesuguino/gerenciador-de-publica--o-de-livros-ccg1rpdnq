import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  BookOpen,
  KeyRound,
  Mail,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Login() {
  const [email, setEmail] = useState('simonesuguino@gmail.com')
  const [password, setPassword] = useState('Skip@Pass')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Validação segura do redirect: apenas caminhos internos que começam com "/" e não "//"
  const rawFrom = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'
  const isValidInternalRedirect =
    typeof rawFrom === 'string' && rawFrom.startsWith('/') && !rawFrom.startsWith('//')
  const targetPath = isValidInternalRedirect ? rawFrom : '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError(null)
    setLoading(true)

    try {
      await login(email, password)
      navigate(targetPath, { replace: true })
    } catch (err: unknown) {
      console.error('Falha de autenticação:', err)
      const errString = err instanceof Error ? err.message : String(err)

      // Mensagens de erro amigáveis sem expor detalhes técnicos
      if (
        errString.includes('Failed to authenticate') ||
        errString.includes('Invalid credentials') ||
        errString.includes('400')
      ) {
        setError('E-mail ou senha inválidos.')
      } else if (
        errString.includes('Failed to fetch') ||
        errString.includes('Network') ||
        errString.includes('timeout')
      ) {
        setError('Não foi possível conectar. Tente novamente.')
      } else if (errString.includes('desativada')) {
        setError('Sua conta foi desativada pela administração. Entre em contato.')
      } else {
        setError('E-mail ou senha inválidos.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault()
    // Mensagem padrão segura: não confirma nem nega se o e-mail existe
    setForgotSent(true)
  }

  return (
    <div className="flex min-h-screen bg-stone-100 items-center justify-center p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-stone-100 bg-stone-900 p-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-md">
            <BookOpen className="h-7 w-7" />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            Gerenciador de Publicação de Livros
          </h1>
          <p className="mt-1 text-sm text-stone-400">ERP de Publicação & Gestão Editorial</p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-semibold text-stone-900">Entrar no ERP de livros</h2>
            <p className="text-xs text-stone-500 mt-1">
              Acesso restrito para equipe editorial, autores e revisores autorizados.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!showForgot ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-stone-700">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="username email"
                    placeholder="autor@livro.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="pl-9 text-sm focus-visible:ring-amber-700"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-stone-700">
                    Senha
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[11px] text-amber-800 hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Sua senha de acesso"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="pl-9 pr-10 text-sm focus-visible:ring-amber-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-medium py-2.5 shadow-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Entrando…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Entrar no ERP
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email" className="text-xs font-semibold text-stone-700">
                  E-mail cadastrado
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <Input
                    id="forgot-email"
                    type="email"
                    required
                    placeholder="seu-email@dominio.com"
                    defaultValue={email}
                    className="pl-9 text-sm focus-visible:ring-amber-700"
                  />
                </div>
              </div>

              {forgotSent ? (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>
                    Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-stone-500">
                  Informe o e-mail da sua conta para receber o link de recuperação.
                </p>
              )}

              <Button
                type="submit"
                disabled={forgotSent}
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-medium"
              >
                Enviar instruções
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(false)
                    setForgotSent(false)
                  }}
                  className="text-xs text-stone-600 hover:underline"
                >
                  Voltar para o login
                </button>
              </div>
            </form>
          )}

          {/* Aviso de acesso restrito (sem cadastro público) */}
          <div className="mt-6 border-t border-stone-100 pt-4 text-center">
            <p className="flex items-center justify-center gap-1.5 text-xs text-stone-500 font-medium">
              <Lock className="h-3.5 w-3.5 text-amber-700" />
              Cadastro público desabilitado. Acesso exclusivo por convite.
            </p>
          </div>

          {/* Credenciais de demonstração dos perfis */}
          <div className="mt-4 rounded-lg bg-stone-50 border border-stone-200/60 p-3 text-[11px] text-stone-500 space-y-1.5">
            <p className="font-semibold text-stone-700 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
              Contas de acesso configuradas:
            </p>
            <div className="space-y-1 font-mono text-[10px] text-stone-700">
              <p>
                <span className="font-semibold text-amber-800">Admin:</span> simonesuguino@gmail.com
                (Skip@Pass)
              </p>
              <p>
                <span className="font-semibold text-amber-800">Colaboradora:</span>{' '}
                clara.colaboradora@teste.com (Skip@Pass)
              </p>
              <p>
                <span className="font-semibold text-amber-800">Revisora:</span>{' '}
                renata.revisora@teste.com (Skip@Pass)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
