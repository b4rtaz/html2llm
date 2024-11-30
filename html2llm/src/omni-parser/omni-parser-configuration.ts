export interface OmniParserConfiguration {
	yoloModelUrl?: string;
	yoloModelBytes?: ArrayBuffer;
	nmsModelUrl?: string;
	nmsModelBytes?: ArrayBuffer;
	onnxWasmUrl?: string;
	onnxWasmBytes?: ArrayBuffer;
	yoloInputShape?: number[];
	topk?: number;
	iouThreshold?: number;
	boxThreshold?: number;
	progressCallback: (stage: string, timeMs: number) => void;
}
