import { Tensor, InferenceSession, env } from 'onnxruntime-web';
import { downloadBinaryFile, downloadImageFile } from './utils';
import { ImagePreprocessor } from './image-preprocessor';
import { OmniParserBox } from './omni-parser-box';
import { OmniParserConfiguration } from './omni-parser-configuration';
import { OmniParserResult } from './omni-parser-result';

export class OmniParser {
	public static async load(config: OmniParserConfiguration): Promise<OmniParser> {
		const yoloInputShape = config.yoloInputShape ?? [1, 3, 640, 640];
		const topk = config.topk ?? 100;
		const iouThreshold = config.iouThreshold ?? 0.05;
		const boxThreshold = config.boxThreshold ?? 0.01;

		const t0 = Date.now();

		const [yoloWeights, nmsWeights, onnxWasm] = await Promise.all([
			resolveModelBytes(config.yoloModelBytes, config.yoloModelUrl),
			resolveModelBytes(config.nmsModelBytes, config.nmsModelUrl),
			resolveModelBytes(config.onnxWasmBytes, config.onnxWasmUrl)
		]);

		const t1 = Date.now();
		config.progressCallback('modelsDownloaded', t1 - t0);

		env.wasm.wasmBinary = onnxWasm;

		const yolo = await InferenceSession.create(yoloWeights);

		const t2 = Date.now();
		config.progressCallback('yoloModelLoaded', t2 - t1);

		const nms = await InferenceSession.create(nmsWeights);

		const t3 = Date.now();
		config.progressCallback('nmsModelLoaded', t3 - t2);

		return new OmniParser(yoloInputShape, topk, iouThreshold, boxThreshold, yolo, nms, config.progressCallback);
	}

	private constructor(
		private readonly yoloInputShape: number[],
		private readonly topk: number,
		private readonly iouThreshold: number,
		private readonly boxThreshold: number,
		private readonly yolo: InferenceSession,
		private readonly nms: InferenceSession,
		private readonly progressCallback: (name: string, ms: number) => void
	) {}

	public async process(imageUrl: string | ImageBitmap): Promise<OmniParserResult> {
		const yoloInputWidth = this.yoloInputShape[2];
		const yoloInputHeight = this.yoloInputShape[3];
		const image = typeof imageUrl === 'string' ? await downloadImageFile(imageUrl) : imageUrl;

		const t0 = Date.now();

		const input = ImagePreprocessor.preprocess(image, yoloInputWidth, yoloInputHeight);

		const t1 = Date.now();
		this.progressCallback('preprocessed', t1 - t0);

		const tensor = new Tensor(input, this.yoloInputShape);
		const config = new Tensor('float32', new Float32Array([this.topk, this.iouThreshold, this.boxThreshold]));

		const { output0 } = await this.yolo.run({ images: tensor });

		const t2 = Date.now();
		this.progressCallback('inference', t2 - t1);

		const { selected } = await this.nms.run({ detection: output0, config: config });

		const t3 = Date.now();
		this.progressCallback('nms', t3 - t2);

		const boxes: OmniParserBox[] = [];

		for (let index = 0; index < selected.dims[1]; index++) {
			const data = selected.data.slice(index * selected.dims[2], (index + 1) * selected.dims[2]);
			const box = data.slice(0, 4);
			const scores = data.slice(4);
			const score = Math.max(...scores);
			const label = scores.indexOf(score);

			const [x, y, w, h] = [box[0] - 0.5 * box[2], box[1] - 0.5 * box[3], box[2], box[3]];

			boxes.push({
				label,
				score,
				x,
				y,
				w,
				h
			});
		}
		return {
			scaleX: image.width / yoloInputWidth,
			scaleY: image.height / yoloInputHeight,
			boxes
		};
	}

	public async release() {
		await this.yolo.release();
		await this.nms.release();
	}
}

function resolveModelBytes(bytes: ArrayBuffer | undefined, url: string | undefined): Promise<ArrayBuffer> {
	if (bytes) {
		return Promise.resolve(bytes);
	}
	if (url) {
		return downloadBinaryFile(url);
	}
	throw new Error('Model bytes or URL must be provided');
}
