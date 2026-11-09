/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Structure from './pages/Structure'
import Editor from './pages/Editor'
import Narration from './pages/Narration'
import Export from './pages/Export'
import Publish from './pages/Publish'
import PublicBook from './pages/PublicBook'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
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

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
