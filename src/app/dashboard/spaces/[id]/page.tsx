'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { spacesApi, locationsApi, bookingsApi } from '@/lib/api'
import type { Space, Location, Booking } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import toast from 'react-hot-toast'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 text-sm">
      <span className="text-stone-500 font-medium">{label}</span>
      <span className="text-stone-800 text-right max-w-xs">{value}</span>
    </div>
  )
}

export default function SpaceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [space, setSpace] = useState<Space | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const sp = await spacesApi.get(id)
      setSpace(sp)
      const [loc, res] = await Promise.all([
        locationsApi.get(sp.locationId),
        bookingsApi.list({ spaceId: id, pageSize: 10 }),
      ])
      setLocation(loc)
      setBookings(res.data)
    } catch {
      toast.error('No se pudo cargar el espacio')
      router.push('/dashboard/spaces')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="p-8 text-center text-stone-400 animate-pulse">Cargando espacio…</div>
    )
  }

  if (!space) return null

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-500">
        <Link href="/dashboard/spaces" className="hover:text-teal-600 hover:underline">
          Espacios
        </Link>
        <span>/</span>
        <span className="text-stone-800 font-medium">{space.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">{space.name}</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {location?.name ?? '—'}{space.reference ? ` · ${space.reference}` : ''}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Info card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-stone-700">Detalles del espacio</CardTitle>
          </CardHeader>
          <CardContent>
            <Separator className="mb-2" />
            <DetailRow label="ID" value={<span className="font-mono text-xs text-stone-500">{space.id}</span>} />
            <Separator />
            <DetailRow label="Referencia" value={space.reference ?? '—'} />
            <Separator />
            <DetailRow label="Capacidad" value={`${space.capacity} persona${space.capacity !== 1 ? 's' : ''}`} />
            <Separator />
            <DetailRow label="Descripción" value={space.description ?? '—'} />
            <Separator />
            <DetailRow label="Creado" value={formatDate(space.createdAt)} />
            <Separator />
            <DetailRow label="Actualizado" value={formatDate(space.updatedAt)} />
          </CardContent>
        </Card>

        {/* Location card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-stone-700">Lugar</CardTitle>
          </CardHeader>
          <CardContent>
            {location ? (
              <>
                <Separator className="mb-2" />
                <DetailRow label="Nombre" value={location.name} />
                <Separator />
                <DetailRow label="Latitud" value={location.latitude} />
                <Separator />
                <DetailRow label="Longitud" value={location.longitude} />
                <Separator />
                <DetailRow label="ID" value={<span className="font-mono text-xs text-stone-500">{location.id}</span>} />
              </>
            ) : (
              <p className="text-stone-400 text-sm">Sin información del lugar</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent bookings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-stone-700">Reservas recientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-50">
                <TableHead>Email</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={3} className="text-center text-stone-400 py-6">
                    Sin reservas registradas
                  </TableCell>
                </TableRow>
              ) : (
                  bookings.map((r) => (
                  <TableRow key={r.id} className="hover:bg-stone-50">
                    <TableCell className="text-stone-700 text-sm font-medium">{r.clientEmail}</TableCell>
                    <TableCell className="text-stone-600 text-sm">{formatDate(r.startTime)}</TableCell>
                    <TableCell className="text-stone-600 text-sm">{formatDate(r.endTime)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.push('/dashboard/spaces')}>
          ← Volver a espacios
        </Button>
        <Button
          variant="outline"
          className="text-teal-600 border-teal-200 hover:bg-teal-50"
          onClick={() => router.push(`/dashboard/bookings`)}
        >
          Ver todas las reservas
        </Button>
      </div>
    </div>
  )
}
