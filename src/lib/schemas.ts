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
    (data) => {
      const start = new Date(data.startTime)
      const end = new Date(data.endTime)
      return end > start
    },
    { message: 'End time must be after start time', path: ['endTime'] },
  )
  .refine(
    (data) => {
      const bookingDate = new Date(data.bookingDate)
      const start = new Date(data.startTime)
      // Compare date portions only
      const bookingDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate())
      const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
      return startDay >= bookingDay
    },
    { message: 'Start time must be on or after the booking date', path: ['startTime'] },
  )

export type CreateBookingFormData = z.infer<typeof createBookingSchema>
