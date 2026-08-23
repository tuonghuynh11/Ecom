import z from 'zod'

export const DateTimeSchema = z.union([z.iso.datetime(), z.date()])
// .transform((value) => (value instanceof Date ? value.toISOString() : value))
