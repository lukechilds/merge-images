export type ImageSource = string | URL | ArrayBuffer | ArrayBufferView

export interface ImageSourceOptions {
  src: ImageSource
  x?: number
  y?: number
  opacity?: number
}

export type ImageInput = ImageSource | ImageSourceOptions

export interface CanvasRenderingContext2DLike {
  globalAlpha: number
  drawImage(...arguments_: any[]): void
}

export interface CanvasLike {
  width: number
  height: number
  getContext(contextId: '2d'): CanvasRenderingContext2DLike | null
  toDataURL(type?: string, quality?: number): string
  toDataURL(
    type: string,
    options: {
      quality: number
      progressive: boolean
    },
    callback: (error: Error | null, dataUrl?: string) => void
  ): void
}

export interface ImageLike {
  width: number
  height: number
  src: unknown
  crossOrigin?: string | null | undefined
  onerror: (() => void) | ((error: Error) => void) | null
  onload: (() => void) | null
}

export type CanvasConstructor = new (...arguments_: any[]) => CanvasLike
export type ImageConstructor = new (...arguments_: any[]) => ImageLike

export interface MergeImagesOptions {
  format?: string
  quality?: number
  width?: number
  height?: number
  Canvas?: CanvasConstructor
  Image?: ImageConstructor
  crossOrigin?: string
}

interface ResolvedMergeImagesOptions {
  format: string
  quality: number
  width: number | undefined
  height: number | undefined
  Canvas: CanvasConstructor | undefined
  Image: ImageConstructor | undefined
  crossOrigin: string | undefined
}

type LoadedImage = ImageSourceOptions & {
  img: ImageLike
}

const defaultOptions: ResolvedMergeImagesOptions = {
  format: 'image/png',
  quality: 0.92,
  width: undefined,
  height: undefined,
  Canvas: undefined,
  Image: undefined,
  crossOrigin: undefined
}

const normalizeSource = (source: ImageInput): ImageSourceOptions => {
  if (
    (source as { constructor: { name: string } }).constructor.name !== 'Object'
  ) {
    return {
      src: source as ImageSource
    }
  }

  return source as ImageSourceOptions
}

const getImageSize = (images: LoadedImage[], dimension: 'width' | 'height') =>
  Math.max(...images.map((image) => image.img[dimension]))

const mergeImages = (
  sources: ImageInput[] = [],
  options: MergeImagesOptions = {}
): Promise<string> =>
  new Promise((resolve) => {
    const resolvedOptions = {
      ...defaultOptions,
      ...options
    }

    // Setup browser/Node.js specific variables.
    const canvas = (
      resolvedOptions.Canvas
        ? new resolvedOptions.Canvas()
        : globalThis.document.createElement('canvas')
    ) as CanvasLike
    const ImageConstructor = (resolvedOptions.Image ||
      globalThis.Image) as ImageConstructor

    // Load sources.
    const images = sources.map(
      (source) =>
        new Promise<LoadedImage>((resolve, reject) => {
          const normalizedSource = normalizeSource(source)
          const img = new ImageConstructor()

          img.crossOrigin = resolvedOptions.crossOrigin
          img.onerror = () => {
            reject(new Error("Couldn't load image"))
          }

          img.onload = () => {
            resolve({
              ...normalizedSource,
              img
            })
          }

          img.src = normalizedSource.src
        })
    )

    // Get canvas context.
    const ctx = canvas.getContext('2d')!

    // When sources have loaded.
    resolve(
      Promise.all(images).then((images) => {
        // Set canvas dimensions.
        canvas.width = resolvedOptions.width || getImageSize(images, 'width')
        canvas.height = resolvedOptions.height || getImageSize(images, 'height')

        // Draw images to canvas.
        for (const image of images) {
          ctx.globalAlpha = image.opacity ? image.opacity : 1
          ctx.drawImage(image.img, image.x || 0, image.y || 0)
        }

        if (resolvedOptions.Canvas && resolvedOptions.format === 'image/jpeg') {
          // Resolve data URI for node-canvas jpeg async.
          return new Promise<string>((resolve, reject) => {
            canvas.toDataURL(
              resolvedOptions.format,
              {
                quality: resolvedOptions.quality,
                progressive: false
              },
              (error: Error | null, jpeg?: string) => {
                if (error) {
                  reject(error)
                  return
                }

                resolve(jpeg ?? '')
              }
            )
          })
        }

        // Resolve all other data URIs sync.
        return canvas.toDataURL(resolvedOptions.format, resolvedOptions.quality)
      })
    )
  })

export default mergeImages
