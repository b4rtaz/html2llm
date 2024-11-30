const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const output = document.getElementById('output');
const fileInput = document.getElementById('fileInput');

let parser = null;

function progressCallback(name, ms) {
	output.value = `${name}: ${ms}ms\n` + output.value;
}

async function processImage(image) {
	canvas.width = image.width;
	canvas.height = image.height;

	const { boxes, scaleX, scaleY } = await parser.process(image);
	context.drawImage(image, 0, 0, image.width, image.height);
	html2llm.renderBoxes(context, boxes, {
		scaleX,
		scaleY
	});
}

window.addEventListener('load', async () => {
	parser = await html2llm.OmniParser.load({
		yoloModelUrl: './assets/omni-parser-yolov8.onnx',
		nmsModelUrl: './assets/nms-yolov8.onnx',
		onnxWasmUrl: './assets/ort-wasm-simd-threaded.wasm',
		progressCallback,
		iouThreshold: 0.1,
		boxThreshold: 0.05
	});

	const image = await html2llm.downloadImageFile('./assets/demo-winme.png');
	await processImage(image);
});

fileInput.addEventListener('change', async () => {
	const file = fileInput.files[0];
	if (!file) {
		return;
	}
	output.value = '';
	const reader = new FileReader();
	reader.onload = async () => {
		const image = new Image();
		image.onload = async () => {
			await processImage(image);
		};
		image.src = reader.result;
	};
	reader.readAsDataURL(file);
});
