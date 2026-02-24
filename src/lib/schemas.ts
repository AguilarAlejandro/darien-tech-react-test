import { z } from 'zod'

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
