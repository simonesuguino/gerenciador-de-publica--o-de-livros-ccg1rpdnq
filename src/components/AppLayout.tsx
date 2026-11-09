import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  BookOpen,
  LayoutDashboard,
  ListTree,
  PenTool,
  Mic,
  Download,
  Share2,
  Globe,
  LogOut,
  Menu,
  X,
  User,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AppLayoutProps {
  children: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { label: 'Painel', href: '/', icon: LayoutDashboard },
    { label: 'Estrutura', href: '/estrutura', icon: ListTree },
    { label: 'Editor', href: '/editor', icon: PenTool },
    { label: 'Narração', href: '/narracao', icon: Mic },
    { label: 'Exportação', href: '/exportacao', icon: Download },
    { label: 'Publicação', href: '/publicacao', icon: Share2 },
  ]

  const handleLogout = () => {
    logout()
    navigate('/entrar')
  }

  return (
    <div className="flex min-h-screen bg-stone-50 font-sans text-stone-900 antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-stone-200 bg-white lg:flex">
        {/* Brand / Logo */}
        <div className="flex h-20 items-center gap-3 border-b border-stone-100 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-700 text-white shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif text-base font-bold tracking-tight text-stone-900">
              Cavalo de Tróia
            </h1>
            <p className="text-xs font-medium text-amber-800">Gerenciador do Autor</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 p-4">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            Escrita & Produção
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              location.pathname === item.href ||
              (item.href === '/editor' && location.pathname.startsWith('/editor'))
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-50 text-amber-900 font-semibold shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-amber-700' : 'text-stone-400'}`} />
                {item.label}
              </Link>
            )
          })}

          <div className="pt-4 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            Público
          </div>
          <Link
            to="/livro"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
          >
            <span className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-stone-400" />
              Página do Livro
            </span>
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
              Aberta
            </span>
          </Link>
        </nav>

        {/* User Card & Logout */}
        <div className="border-t border-stone-100 p-4">
          <div className="mb-3 flex items-center gap-3 px-2 py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-600">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-semibold text-stone-800">
                {user?.name || 'Autor(a)'}
              </p>
              <p className="truncate text-[11px] text-stone-400">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-xs text-stone-500 hover:bg-stone-100 hover:text-red-700"
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Sair da conta
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-stone-200 bg-white px-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-700 text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-serif text-sm font-bold text-stone-900">Cavalo de Tróia</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/livro"
              target="_blank"
              className="rounded-md border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600"
            >
              Página pública
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-md p-2 text-stone-600 hover:bg-stone-100"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-b border-stone-200 bg-white p-4 shadow-lg lg:hidden">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-amber-50 text-amber-900 font-semibold' : 'text-stone-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
              <Link
                to="/livro"
                target="_blank"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-stone-600"
              >
                <Globe className="h-4 w-4" />
                Página pública do livro
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sair da conta
              </button>
            </nav>
          </div>
        )}

        {/* Main Workspace Area */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
