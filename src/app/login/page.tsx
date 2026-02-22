'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { validateApiKey } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const [apiKey, setApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!apiKey.trim()) return

    setIsLoading(true)
    try {
      const role = await validateApiKey(apiKey.trim())
      if (role) {
        toast.success(`Bienvenido — rol: ${role}`)
        login(apiKey.trim(), role)
      } else {
        toast.error('API key inválida o acceso denegado')
      }
    } catch {
      toast.error('Error al conectar con el servidor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white text-xl font-bold">
            C
          </div>
          <CardTitle className="text-2xl font-bold text-stone-800">CoworkSpace</CardTitle>
          <CardDescription className="text-stone-500">
            Ingresa tu API key para acceder al panel de gestión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-stone-700">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Ingresa tu API key…"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="border-stone-300 focus-visible:ring-teal-500"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              disabled={isLoading || !apiKey.trim()}
            >
              {isLoading ? 'Verificando…' : 'Ingresar'}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-stone-400">
            Contacta a tu administrador para obtener una API key
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
