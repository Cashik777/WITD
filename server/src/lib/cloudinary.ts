import { v2 as cloudinary } from 'cloudinary'

export const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
)

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

// Every product photo on the site is displayed inside a 4:5 box with the
// same dark background (#151412 -- see ProductCard.tsx/ProductGallery.tsx).
// Rather than relying on whatever background the source photo happens to
// have, every upload is normalized here: Cloudinary's AI background
// removal isolates the garment, then it's padded onto a fixed 1920x2400
// canvas filled with that exact site colour -- so every product photo
// matches, front and back, regardless of what the original backdrop was.
const SITE_BG = '151412'
const CANVAS_W = 1920
const CANVAS_H = 2400

export function uploadImage(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'witd-products',
        eager: [
          {
            effect: 'background_removal',
            transformation: [{ crop: 'pad', width: CANVAS_W, height: CANVAS_H, background: `rgb:${SITE_BG}` }],
          },
        ],
        eager_async: false,
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('Cloudinary upload returned no result.'))
        const processed = result.eager?.[0]?.secure_url
        resolve(processed ?? result.secure_url)
      }
    )
    stream.end(buffer)
  })
}
