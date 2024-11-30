export class ImagePreprocessor {
	public static resize(
		source: ImageBitmap,
		width: number,
		height: number
	): {
		canvas: OffscreenCanvas;
		context: OffscreenCanvasRenderingContext2D;
	} {
		if (typeof OffscreenCanvas === 'undefined') {
			throw new Error('OffscreenCanvas is not supported');
		}
		const canvas = new OffscreenCanvas(width, height);
		const context = canvas.getContext('2d');
		if (!context) {
			throw new Error('2d context is not available');
		}
		context.drawImage(source, 0, 0, width, height);
		return {
			canvas,
			context
		};
	}

	public static preprocess(source: ImageBitmap, modelWidth: number, modelHeight: number): Float32Array {
		const { context } = ImagePreprocessor.resize(source, modelWidth, modelHeight);

		const pixels = context.getImageData(0, 0, modelWidth, modelHeight).data;

		const red: number[] = [];
		const green: number[] = [];
		const blue: number[] = [];
		for (let index = 0; index < pixels.length; index += 4) {
			red.push(pixels[index] / 255.0);
			green.push(pixels[index + 1] / 255.0);
			blue.push(pixels[index + 2] / 255.0);
		}
		return Float32Array.from([...red, ...green, ...blue]);
	}
}
