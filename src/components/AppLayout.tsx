import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useBook } from '@/contexts/BookContext'
import { usePreferences } from '@/contexts/PreferencesContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  BookOpen,
  PenTool,
  ListTree,
  Mic,
  Share2,
  Upload,
  Megaphone,
  DollarSign,
  Image as ImageIcon,
  Palette,
  Library,
  ChevronDown,
  Plus,
  Archive,
  LogOut,
  Sun,
  Moon,
  Check,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Painel', icon: BookOpen },
  { to: '/estrutura', label: 'Estrutura', icon: ListTree },
  { to: '/editor', label: 'Editor', icon: PenTool },
  { to: '/narracao', label: 'Narração', icon: Mic },
  { to: '/capa', label: 'Capa', icon: ImageIcon },
  { to: '/exportacao', label: 'Exportação', icon: Upload },
  { to: '/marketing', label: 'Marketing', icon: Megaphone },
  { to: '/vendas', label: 'Vendas', icon: DollarSign },
  { to: '/publicacao', label: 'Publicação', icon: Share2 },
  { to: '/aparencia', label: 'Aparência', icon: Palette },
]

function BookSwitcher() {
  const { books, book, setActiveBook } = useBook()
  const active = books.filter((b) => !b.archived)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="max-w-[220px] justify-between gap-2 font-medium"
        >
          <span className="flex min-w-0 items-center gap-2">
            <BookOpen className="h-4 w-4 shrink-0 text-amber-700" />
            <span className="truncate">{book?.title || 'Selecionar livro'}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Livro ativo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {active.map((b) => (
          <DropdownMenuItem
            key={b.id}
            onClick={() => setActiveBook(b.id)}
            className="justify-between"
          >
            <span className="truncate">{b.title}</span>
            {book?.id === b.id && <Check className="h-4 w-4 shrink-0 text-amber-700" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/livros" className="flex w-full items-center">
            <Library className="mr-2 h-4 w-4" />
            Gerenciar livros
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ThemeToggle() {
  const { themeMode, setThemeMode } = usePreferences()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      onClick={() => setThemeMode(themeMode === 'escuro' ? 'claro' : 'escuro')}
      title={themeMode === 'escuro' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
    >
      {themeMode === 'escuro' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { book } = useBook()

  return (
    <div className="flex min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-stone-200 px-5 dark:border-stone-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="font-serif text-sm font-bold tracking-tight">Meu Livro</span>
        </div>

        {/* Seletor de livro */}
        <div className="border-b border-stone-200 px-4 py-3 dark:border-stone-800">
          <BookSwitcher />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-stone-200 p-3 dark:border-stone-800">
          <div className="mb-2 px-2 text-xs text-stone-500 dark:text-stone-400">{user?.email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-stone-500 dark:text-stone-400"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile + seletor sempre visível */}
        <header className="flex h-14 items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 dark:border-stone-800 dark:bg-stone-900 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-600 text-white">
              <BookOpen className="h-3.5 w-3.5" />
            </div>
            <span className="font-serif text-sm font-bold">Meu Livro</span>
          </div>
          <div className="md:hidden">
            <BookSwitcher />
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="truncate text-xs text-stone-500 dark:text-stone-400">
              {book ? book.title : 'Nenhum livro selecionado'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link to="/livros">
                <Library className="mr-1.5 h-4 w-4" />
                Livros
              </Link>
            </Button>
          </div>
        </header>

        {/* Nav mobile (scroll horizontal) */}
        <nav className="flex gap-1 overflow-x-auto border-b border-stone-200 bg-white px-3 py-2 dark:border-stone-800 dark:bg-stone-900 md:hidden">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium',
                  isActive
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100'
                    : 'text-stone-600 dark:text-stone-400',
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
