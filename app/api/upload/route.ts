import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'

const MAX_FILE_SIZE = 20 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif'])

function looksLikeImage(file: File) {
  return file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif|heic|heif)$/i.test(file.name)
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 })
    }
    if (!looksLikeImage(file) || (file.type && !ALLOWED_TYPES.has(file.type))) {
      return NextResponse.json({ error: 'Please choose a supported image file.' }, { status: 415 })
    }
    if (file.size === 0) {
      return NextResponse.json({ error: 'That image is empty. Please choose another file.' }, { status: 400 })
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Each image must be 20 MB or smaller.' }, { status: 413 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase()
    try {
      const blob = await put(`property-images/${crypto.randomUUID()}-${safeName}`, file, {
        access: 'public',
        addRandomSuffix: false,
      })
      return NextResponse.json({ url: blob.url, storage: 'blob' })
    } catch (error) {
      console.error('[v0] Blob upload failed, using inline fallback:', error)
      if (file.size <= 5 * 1024 * 1024) {
        const bytes = Buffer.from(await file.arrayBuffer())
        const mime = file.type || 'image/jpeg'
        return NextResponse.json({ url: `data:${mime};base64,${bytes.toString('base64')}`, storage: 'inline' })
      }
      return NextResponse.json({ error: 'Image upload failed. Please use an image smaller than 5 MB.' }, { status: 500 })
    }
  } catch (error) {
    console.error('[v0] Image upload request failed:', error)
    return NextResponse.json({ error: 'Image upload failed.' }, { status: 500 })
  }
}
