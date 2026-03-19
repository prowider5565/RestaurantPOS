const MAX_IMAGE_WIDTH = 1600
const MAX_IMAGE_HEIGHT = 1600
const JPEG_QUALITY = 0.82
const WEBP_QUALITY = 0.8

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Unable to load image'))
    }

    image.src = objectUrl
  })
}

function getTargetSize(width: number, height: number) {
  const scale = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height, 1)

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }

      reject(new Error('Unable to compress image'))
    }, type, quality)
  })
}

export async function compressProductImage(file: File) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file
  }

  const image = await loadImage(file)
  const { width, height } = getTargetSize(image.naturalWidth, image.naturalHeight)

  if (width === image.naturalWidth && height === image.naturalHeight && file.type !== 'image/jpeg' && file.type !== 'image/webp') {
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) return file

  context.drawImage(image, 0, 0, width, height)

  const quality = file.type === 'image/jpeg' ? JPEG_QUALITY : file.type === 'image/webp' ? WEBP_QUALITY : undefined
  const blob = await canvasToBlob(canvas, file.type, quality)

  if (blob.size >= file.size) return file

  return new File([blob], file.name, {
    type: blob.type || file.type,
    lastModified: Date.now(),
  })
}
