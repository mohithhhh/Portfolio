import { z } from 'zod'

/** Contact form payload, validated on the client and again in /api/contact. */
export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Please add your name.').max(100),
  email: z.email('Please enter a valid email address.').max(200),
  subject: z.string().trim().max(150).default(''),
  message: z.string().trim().min(10, 'Your message is a little short (10 characters minimum).').max(5000),
  /** Honeypot: humans never see or fill this field. */
  website: z.string().max(0).optional().default(''),
  turnstileToken: z.string().optional(),
})

export type ContactInput = z.input<typeof contactSchema>
