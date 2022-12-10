import { MergeImageOptions, MergeImageSource } from './utils/types';
import { Image as ImageType } from 'canvas';

// Defaults
const defaultOptions: MergeImageOptions = {
    format: 'image/png',
    quality: 0.92,
    width: undefined,
    height: undefined,
    Canvas: undefined,
    crossOrigin: undefined
};

// Return Promise
const mergeImages = (sources: Array<string | MergeImageSource> = [], options: MergeImageOptions = {}) =>
    new Promise<string>((resolve) => {
        options = Object.assign({}, defaultOptions, options);

        // Setup browser/Node.js specific variables
        const canvas = options.Canvas ? new options.Canvas(1, 1, 'image') : window.document.createElement('canvas');
        const Image = options.Image || window.Image;

        // Load sources
        const images = sources.map(
            (source) =>
                new Promise<{
                    img: ImageType | HTMLImageElement;
                    src?: string;
                    opacity?: number;
                    x?: number;
                    y?: number;
                }>((resolve, reject) => {
                    // Convert string sources to objects
                    if (typeof source === 'string') {
                        source = { src: source };
                    }

                    // Resolve source and img when loaded
                    const img = new Image();

                    if (img instanceof HTMLImageElement && options.crossOrigin) {
                        img.crossOrigin = options.crossOrigin;
                    }

                    img.onerror = () => reject(new Error("Couldn't load image"));
                    img.onload = () => resolve(Object.assign({}, source, { img }));
                    img.src = source.src;
                })
        );

        // Get canvas context
        const ctx = canvas.getContext('2d');

        // When sources have loaded
        resolve(
            Promise.all(images).then((images) => {
                // Set canvas dimensions
                const getSize = (dim: 'width' | 'height') =>
                    options[dim] || Math.max(...images.map((image) => image.img[dim]));
                canvas.width = getSize('width');
                canvas.height = getSize('height');

                if (ctx instanceof CanvasRenderingContext2D) {
                    // Draw images to canvas
                    images.forEach((image) => {
                        ctx.globalAlpha = image.opacity ? image.opacity : 1;
                        if (image.img instanceof HTMLImageElement) {
                            /** @TODO Need add a fixer for type error in Node Js */
                            return ctx.drawImage(image.img, image.x || 0, image.y || 0);
                        }
                    });
                }

                if (options.Canvas && options.format === 'image/jpeg') {
                    // Resolve data URI for node-canvas jpeg async
                    return new Promise<string>((resolve, reject) => {
                        canvas.toDataURL(
                            'image/jpeg',
                            {
                                quality: options.quality,
                                progressive: false
                            },
                            (err, jpeg) => {
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                resolve(jpeg);
                            }
                        );
                    });
                }

                // Resolve all other data URIs sync
                return canvas.toDataURL(options.format, options.quality);
            })
        );
    });

export default mergeImages;
export { MergeImageOptions, MergeImageSource };
