import path from 'path'

export const OrderBy = {
  Asc: 'asc',
  Desc: 'desc',
} as const

export const SortBy = {
  Price: 'price',
  CreatedAt: 'createdAt',
  Sale: 'sale',
} as const

export const UPLOAD_DIR = path.resolve('upload')

export const ALL_LANGUAGES_CODE = 'all'

export type OrderByType = (typeof OrderBy)[keyof typeof OrderBy]
export type SortByType = (typeof SortBy)[keyof typeof SortBy]
