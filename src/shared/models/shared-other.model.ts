import z from 'zod'

// export const DateTimeSchema = z.union([z.iso.datetime(), z.string().date()])
export const DateTimeSchema = z.iso.datetime()
// .transform((value) => (value instanceof Date ? value.toISOString() : value))
