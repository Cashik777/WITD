import { randomUUID } from 'crypto'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const BUCKET = process.env.R2_BUCKET
const PUBLIC_URL = process.env.R2_PUBLIC_URL // e.g. https://pub-xxxx.r2.dev, no trailing slash

export const isR2Configured = Boolean(ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY && BUCKET && PUBLIC_URL)

const client = isR2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: ACCESS_KEY_ID!, secretAccessKey: SECRET_ACCESS_KEY! },
    })
  : null

// Same brand canvas + fixed size set as scripts/migrate_product_images.cjs —
// an admin-panel upload needs to produce the exact same derivatives the bulk
// migration does, since every display site (ProductCard, gallery, emails...)
// just appends one of these `-{w}x{h}.jpg` suffixes to whatever base path a
// product's images/imagesByColor stores, local or R2-hosted alike.
const BG = '#151412'
const SIZES: [number, number][] = [
  [400, 500],
  [600, 750],
  [900, 1200],
  [1400, 1750],
  [200, 240],
  [180, 210],
  [112, 140],
  [96, 120],
]

// Takes one raw uploaded photo (expected to already have a transparent
// background, the same Printful "transparent mockup" export the bulk
// migration used), renders it into every fixed size the site needs, and
// uploads each to R2. Returns the base path to store on the product —
// `productImage()` on both the frontend and in email.ts appends the size
// suffix, so this looks exactly like any locally-committed image path to
// everything downstream, just served from R2 instead of this server.
export async function uploadProductImage(buffer: Buffer): Promise<string> {
  if (!client || !BUCKET || !PUBLIC_URL) {
    throw new Error('R2 is not configured.')
  }
  const id = randomUUID()
  await Promise.all(
    SIZES.map(async ([w, h]) => {
      const jpeg = await sharp(buffer)
        .trim()
        .flatten({ background: BG })
        .resize(w, h, { fit: 'contain', background: BG })
        .jpeg({ quality: 82 })
        .toBuffer()
      await client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: `uploads/${id}-${w}x${h}.jpg`,
          Body: jpeg,
          ContentType: 'image/jpeg',
        })
      )
    })
  )
  return `${PUBLIC_URL}/uploads/${id}`
}
