import { z } from 'zod'

export const createSpaceSchema = z.object({
  locationId: z.string().uuid('Debe seleccionar un lugar válido'),
  name: z.string().min(1, 'El nombre es requerido').max(200, 'El nombre no puede superar 200 caracteres'),
  reference: z.string().max(500, 'La referencia no puede superar 500 caracteres').optional(),
  capacity: z.number().int('La capacidad debe ser un número entero').min(1, 'La capacidad debe ser al menos 1'),
  description: z.string().max(2000, 'La descripción no puede superar 2000 caracteres').optional(),
})

export type CreateSpaceFormData = z.infer<typeof createSpaceSchema>

export const createLocationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200, 'El nombre no puede superar 200 caracteres'),
  latitude: z.number().min(-90, 'La latitud debe estar entre -90 y 90').max(90, 'La latitud debe estar entre -90 y 90'),
  longitude: z.number().min(-180, 'La longitud debe estar entre -180 y 180').max(180, 'La longitud debe estar entre -180 y 180'),
})

export type CreateLocationFormData = z.infer<typeof createLocationSchema>

export const createBookingSchema = z
  .object({
    spaceId: z.string().uuid('Please select a valid space'),
    clientEmail: z.string().email('Please enter a valid email address'),
    bookingDate: z.string().min(1, 'Booking date is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
  })
  .refine(
    (data) => data.endTime > data.startTime,
    { message: 'End time must be after start time', path: ['endTime'] },
  )

export type CreateBookingFormData = z.infer<typeof createBookingSchema>
