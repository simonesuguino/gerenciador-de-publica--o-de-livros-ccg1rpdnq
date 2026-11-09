/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import { BookProvider } from '@/contexts/BookContext'
import { PreferencesProvider } from '@/contexts/PreferencesContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Structure from './pages/Structure'
import Editor from './pages/Editor'
import Narration from './pages/Narration'
import Export from './pages/Export'
import Publish from './pages/Publish'
import PublicBook from './pages/PublicBook'
import Livros from './pages/Livros'
import Marketing from './pages/Marketing'
import Vendas from './pages/Vendas'
import Capa from './pages/Capa'
import Aparencia from './pages/Aparencia'
import Usuarios from './pages/Usuarios'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <PreferencesProvider>
        <BookProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public routes */}
              <Route path="/entrar" element={<Login />} />
              <Route path="/livro" element={<PublicBook />} />

              {/* Protected author routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/estrutura"
                element={
                  <ProtectedRoute>
                    <Structure />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/editor"
                element={
                  <ProtectedRoute>
                    <Editor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/narracao"
                element={
                  <ProtectedRoute>
                    <Narration />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exportacao"
                element={
                  <ProtectedRoute>
                    <Export />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/publicacao"
                element={
                  <ProtectedRoute>
                    <Publish />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/livros"
                element={
                  <ProtectedRoute>
                    <Livros />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketing"
                element={
                  <ProtectedRoute>
                    <Marketing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendas"
                element={
                  <ProtectedRoute>
                    <Vendas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/capa"
                element={
                  <ProtectedRoute>
                    <Capa />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/aparencia"
                element={
                  <ProtectedRoute>
                    <Aparencia />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/usuarios"
                element={
                  <ProtectedRoute>
                    <Usuarios />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </BookProvider>
      </PreferencesProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
