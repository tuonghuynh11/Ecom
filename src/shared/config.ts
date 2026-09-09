import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'
import z from 'zod'

const nodeEnv = process.env.NODE_ENV
const pathEnv = nodeEnv ? `.env.${nodeEnv}` : '.env'

console.log(`Server đang chạy trong môi trường ${nodeEnv}`)
console.log('File env đang khởi chạy là: ', pathEnv)

config({
  path: pathEnv,
})

if (!fs.existsSync(path.resolve(pathEnv))) {
  console.log(`Không tìm thấy file ${pathEnv}`)
  process.exit(1)
}

const configScheme = z.object({
  DATABASE_URL: z.string(),
  PAYMENT_SECRET_API_KEY: z.string(),
  ACCESS_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRES_IN: z.string(),
  REFRESH_TOKEN_EXPIRES_IN: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  PORT: z.string(),
  ADMIN_EMAIL: z.string(),
  ADMIN_PASSWORD: z.string(),
  ADMIN_NAME: z.string(),
  ADMIN_PHONE_NUMBER: z.string(),
  OTP_EXPIRES_IN: z.string(),
  RESEND_API_KEY: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string(),
  GOOGLE_CLIENT_REDIRECT_URI: z.string(),
  APP_NAME: z.string(),
  PREFIX_STATIC_ENDPOINT: z.string(),
  S3_REGION: z.string(),
  S3_BUCKET_NAME: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  REDIS_URL: z.string(),
  BANK_ACCOUNT: z.string(),
  BANK_NAME: z.string(),
})

const configServer = configScheme.safeParse(process.env)

if (!configServer.success) {
  console.log('Các giá trị khai báo trong file .env không hợp lệ')
  console.error(configServer.error)
  process.exit(1)
}

const envConfig = configServer.data
export default envConfig
