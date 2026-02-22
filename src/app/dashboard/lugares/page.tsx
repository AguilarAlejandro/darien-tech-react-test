'use client'

import { useState, useEffect, useCallback } from 'react'
import { lugaresApi } from '@/lib/api'
import type { Lugar, CreateLugarDto } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import toast from 'react-hot-toast'

function LugarForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<CreateLugarDto>
  onSave: (dto: CreateLugarDto) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<CreateLugarDto>({
    nombre: initial?.nombre ?? '',
    direccion: initial?.direccion ?? '',
    ciudad: initial?.ciudad ?? '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k: keyof CreateLugarDto) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label>Nombre</Label>
        <Input value={form.nombre} onChange={set('nombre')} required />
      </div>
      <div className="space-y-1">
        <Label>Dirección</Label>
        <Input value={form.direccion} onChange={set('direccion')} required />
      </div>
      <div className="space-y-1">
        <Label>Ciudad</Label>
        <Input value={form.ciudad} onChange={set('ciudad')} required />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}

export default function LugaresPage() {
  const { role } = useAuth()
  const isAdmin = role === 'ADMIN'
  const [lugares, setLugares] = useState<Lugar[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Lugar | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchLugares = useCallback(async () => {
    try {
      const data = await lugaresApi.list()
      setLugares(data)
    } catch {
      toast.error('Error al cargar lugares')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLugares()
  }, [fetchLugares])

  async function handleCreate(dto: CreateLugarDto) {
    await lugaresApi.create(dto)
    toast.success('Lugar creado')
    setCreating(false)
    fetchLugares()
  }

  async function handleUpdate(dto: CreateLugarDto) {
    if (!editing) return
    await lugaresApi.update(editing.id, dto)
    toast.success('Lugar actualizado')
    setEditing(null)
    fetchLugares()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await lugaresApi.delete(id)
      toast.success('Lugar eliminado')
      fetchLugares()
    } catch {
      toast.error('No se puede eliminar — tiene espacios activos')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Lugares</h1>
          <p className="text-sm text-stone-500 mt-0.5">Gestión de sedes y ubicaciones</p>
        </div>
        {isAdmin && (
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                + Nuevo lugar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear nuevo lugar</DialogTitle>
              </DialogHeader>
              <LugarForm onSave={handleCreate} onCancel={() => setCreating(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-stone-400 animate-pulse">Cargando…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead className="text-stone-400 text-xs">ID</TableHead>
                  {isAdmin && <TableHead className="w-28" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lugares.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-stone-400 py-8">
                      No hay lugares registrados
                    </TableCell>
                  </TableRow>
                )}
                {lugares.map((l) => (
                  <TableRow key={l.id} className="hover:bg-stone-50">
                    <TableCell className="font-medium text-stone-800">{l.nombre}</TableCell>
                    <TableCell className="text-stone-600">{l.direccion}</TableCell>
                    <TableCell className="text-stone-600">{l.ciudad}</TableCell>
                    <TableCell className="text-stone-300 text-xs font-mono">
                      {l.id.slice(0, 8)}…
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog
                            open={editing?.id === l.id}
                            onOpenChange={(o) => !o && setEditing(null)}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-teal-600 hover:text-teal-700"
                                onClick={() => setEditing(l)}
                              >
                                Editar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar lugar</DialogTitle>
                              </DialogHeader>
                              <LugarForm
                                initial={l}
                                onSave={handleUpdate}
                                onCancel={() => setEditing(null)}
                              />
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(l.id)}
                            disabled={deleting === l.id}
                          >
                            {deleting === l.id ? '…' : 'Eliminar'}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
