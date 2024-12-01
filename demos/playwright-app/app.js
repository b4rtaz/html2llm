const { chromium } = require('playwright');
const { resolve } = require('path');
const { readFileSync } = require('fs');

function readTextFile(path) {
	return readFileSync(resolve(__dirname, path), 'utf8');
}

function readFileAsBase64(path) {
	return readFileSync(resolve(__dirname, path), 'base64');
}

function buildScriptContent() {
	const html2llm = readTextFile('../../html2llm/dist/index.umd.js');
	const script = readTextFile('./script.js')
		.replace('__YOLO_MODEL__', readFileAsBase64('../../html2llm/models/omni-parser-yolov8.onnx'))
		.replace('__NMS_MODEL__', readFileAsBase64('../../html2llm/models/nms-yolov8.onnx'))
		.replace('__ONNX_WASM__', readFileAsBase64('../../html2llm/node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm'));
	return `${html2llm}\n${script}`;
}

async function main() {
	const URL = process.argv[2] ?? 'https://github.com/b4rtaz/html2llm';
	console.log(`Opening ${URL}`);

	const browser = await chromium.launch({
		headless: false,
		devtools: false
	});
	const context = await browser.newContext({
		bypassCSP: true
	});
	const page = await context.newPage();
	await page.addInitScript({
		content: buildScriptContent()
	});
	await page.goto(URL);

	console.log('Waiting for page to load');
	await page.waitForLoadState('networkidle');

	const screenshotBase64 = (
		await page.screenshot({
			type: 'png'
		})
	).toString('base64');

	console.log(`Screenshot taken (${screenshotBase64.length} bytes)`);

	await page.evaluate(sb64 => runHtml2Llm(sb64), screenshotBase64);
}

main();
