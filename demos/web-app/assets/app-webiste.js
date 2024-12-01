const labels = [];
let to = null;
let parser = null;

async function screenShotVisibleArea() {
	const innerSize = { x: window.innerWidth, y: window.innerHeight };
	const scroll = { x: window.scrollX, y: window.scrollY };
	const sourceContext = await htmlToImage.toCanvas(document.body, {
		pixelRatio: 1
	});
	const canvas = document.createElement('canvas');
	canvas.width = innerSize.x;
	canvas.height = innerSize.y;
	const context = canvas.getContext('2d');
	if (!context) {
		throw new Error('Failed to get 2d context');
	}
	context.drawImage(sourceContext, 0, scroll.y, innerSize.x, innerSize.y, 0, 0, innerSize.x, innerSize.y);
	return { context, canvas, scroll };
}

async function loadHtml2Llm() {
	const parser = await html2llm.OmniParser.load({
		yoloModelUrl: './assets/omni-parser-yolov8.onnx',
		nmsModelUrl: './assets/nms-yolov8.onnx',
		onnxWasmUrl: './assets/ort-wasm-simd-threaded.wasm',
		iouThreshold: 0.1,
		boxThreshold: 0.05,
		progressCallback: (stage, timeMs) => {
			console.log('OmniParser', stage, timeMs);
		}
	});
	return parser;
}

function clearLabels() {
	for (const label of labels) {
		document.body.removeChild(label);
	}
	labels.length = 0;
}

function addLabel(d, color, text) {
	const label = document.createElement('div');
	label.style.position = 'absolute';
	label.style.top = Math.floor(d.absY) + 'px';
	label.style.left = Math.floor(d.absX) + 'px';
	label.style.width = d.w + 'px';
	label.style.height = d.h + 'px';
	label.style.color = `rgb(${color})`;
	label.style.backgroundColor = `rgba(${color}, 0.25)`;
	label.style.fontWeight = 'bold';
	label.style.border = `2px solid rgb(${color})`;
	label.style.zIndex = '999999999';
	label.style.overflow = 'hidden';
	label.title = text;
	label.innerText = text;
	labels.push(label);
	document.body.appendChild(label);
	label.addEventListener(
		'click',
		() => {
			document.body.removeChild(label);
		},
		false
	);
}

function showLabels(extractedElements) {
	for (const fe of extractedElements.foundElements) {
		addLabel(fe, '255, 0, 0', `${fe.label} (${html2llm.elementTypeToString(fe.type)})`);
	}
	for (const b of extractedElements.notFoundBoxes) {
		addLabel(b, '0, 0, 255', '?');
	}
}

async function process() {
	if (!parser) {
		throw new Error('Parser is not loaded');
	}

	const { canvas, context, scroll } = await screenShotVisibleArea();
	const result = await parser.process(canvas);

	html2llm.renderBoxes(context, result.boxes, {
		scaleX: result.scaleX,
		scaleY: result.scaleY
	});

	const extractedElements = html2llm.ElementExtractor.extract(result, {
		scrollX: scroll.x,
		scrollY: scroll.y,
		customDevicePixelRatio: 1
	});

	console.log('extractedElements', JSON.stringify(extractedElements, null, 2));
	showLabels(extractedElements);
}

function scheduleProcess() {
	clearLabels();
	if (to) {
		clearTimeout(to);
	}
	to = setTimeout(() => {
		to = null;
		process();
	}, 1000);
}

async function init() {
	parser = await loadHtml2Llm();
	scheduleProcess();
	window.addEventListener('resize', scheduleProcess, false);
	window.addEventListener('scroll', scheduleProcess, false);
}

init();
