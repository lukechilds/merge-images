import { Buffer } from 'node:buffer'
import { Canvas, Image } from 'canvas'
import mergeImages, {
  type ImageSourceOptions,
  type MergeImagesOptions
} from '../src/index'

const sources: ImageSourceOptions[] = [
  {
    src: Buffer.from([]),
    x: 0,
    y: 0,
    opacity: 0.5
  }
]

const options: MergeImagesOptions = {
  format: 'image/png',
  quality: 0.92,
  width: 128,
  height: 128,
  Canvas,
  Image,
  crossOrigin: 'Anonymous'
}

const result: Promise<string> = mergeImages(sources, options)

void result
