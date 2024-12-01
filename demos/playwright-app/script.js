const SHOW_NOT_FOUND = false;

const labels = [];
let parser = null;

async function convertBase64ToArrayBuffer(base64) {
	return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

async function loadHtml2Llm() {
	return html2llm.OmniParser.load({
		yoloModelBytes: convertBase64ToArrayBuffer('__YOLO_MODEL__'),
		nmsModelBytes: convertBase64ToArrayBuffer('__NMS_MODEL__'),
		onnxWasmBytes: convertBase64ToArrayBuffer('__ONNX_WASM__'),
		iouThreshold: 0.1,
		boxThreshold: 0.05,
		progressCallback: (stage, timeMs) => {
			console.log('OmniParser', stage, timeMs);
		}
	});
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
	if (SHOW_NOT_FOUND) {
		for (const b of extractedElements.notFoundBoxes) {
			addLabel(b, '0, 0, 255', '?');
		}
	}
}

function loadBase64Image(base64) {
	return new Promise(resolve => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.src = 'data:image/png;base64,' + base64;
	});
}

window.runHtml2Llm = async screenshot => {
	const image = await loadBase64Image(screenshot);

	const canvas = document.createElement('canvas');
	canvas.width = image.width;
	canvas.height = image.height;
	const context = canvas.getContext('2d');
	context.drawImage(image, 0, 0);

	if (!parser) {
		parser = await loadHtml2Llm();
	}
	const result = await parser.process(canvas);
	console.log('result', result);

	const extractedElements = html2llm.ElementExtractor.extract(result, {
		scrollX: scroll.x,
		scrollY: scroll.y,
		customDevicePixelRatio: 1
	});

	showLabels(extractedElements);
	console.log('extractedElements', extractedElements);
};
