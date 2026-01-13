// lib/validation.ts
// Input validation schemas for API routes
import { z } from 'zod'

// Artwork schemas
export const artworkCreateSchema = z.object({
  id: z.string().max(8).optional(),
  filename: z.string().max(255).default(''),
  // Allow both relative URLs (/api/images/...) and full URLs (https://...)
  image_url: z.string().max(500).nullable().optional(),
  title_cs: z.string().min(1, 'Czech title is required').max(500),
  title_en: z.string().min(1, 'English title is required').max(500),
  medium_cs: z.string().max(255).default(''),
  medium_en: z.string().max(255).default(''),
  dimensions: z.string().max(100).default(''),
  year: z.number().int().min(1900).max(2100).default(() => new Date().getFullYear()),
  category: z.enum(['painting', 'watercolor', 'ink']).default('painting'),
  status: z.enum(['available', 'sold', 'donated', 'private']).default('available'),
})

export const artworkUpdateSchema = artworkCreateSchema.partial().extend({
  id: z.string().max(8),
})

// Gallery schemas
export const galleryCreateSchema = z.object({
  id: z.string().max(36).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  type: z.enum(['year', 'series', 'carousel', 'featured']),
  name_cs: z.string().min(1).max(255),
  name_en: z.string().min(1).max(255),
  description_cs: z.string().max(1000).optional(),
  description_en: z.string().max(1000).optional(),
  category: z.enum(['painting', 'watercolor', 'ink']).nullable().optional(),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  series_key: z.string().max(100).nullable().optional(),
  is_visible: z.boolean().default(true),
  sort_order: z.number().int().default(0),
})

export const galleryUpdateSchema = galleryCreateSchema.partial()

// Gallery items schema
export const galleryItemsSchema = z.object({
  artwork_ids: z.array(z.string().max(8)).max(100),
})

export const galleryReorderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    position: z.number().int().min(0),
  })).max(100),
})

// Theme settings schema
export const themeSettingsSchema = z.object({
  settings: z.array(z.object({
    key: z.string().max(100).regex(/^[a-zA-Z0-9-]+$/, 'Invalid key format'),
    value: z.string().max(255),
  })).max(50),
})

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(1, 'Password is required').max(128),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128)
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
})

// Publish schema
export const publishSchema = z.object({
  notes: z.string().max(500).optional(),
})

// Helper to validate and return typed result or error response
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; response: Response } {
  const result = schema.safeParse(data)

  if (!result.success) {
    // Zod 4 uses .issues instead of .errors
    const errors = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
    return {
      success: false,
      response: Response.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      ),
    }
  }

  return { success: true, data: result.data }
}
