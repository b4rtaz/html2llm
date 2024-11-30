import { OmniParserBox } from './omni-parser-box';

export interface RenderBoxesConfiguration {
	scaleX: number;
	scaleY: number;
	hideLabels?: boolean;
	fontSize?: number;
}

export function renderBoxes(
	context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	boxes: Omit<OmniParserBox, 'probability'>[],
	config: RenderBoxesConfiguration
) {
	const fontSize = config.fontSize ?? 10;
	const font = `${fontSize}px Arial, Tahoma, sans-serif`;
	context.font = font;
	context.textBaseline = 'top';

	boxes.forEach((box, index) => {
		const label = String(index);
		const color = 'red';
		const x = box.x * config.scaleX;
		const y = box.y * config.scaleY;
		const width = box.w * config.scaleX;
		const height = box.h * config.scaleY;

		context.strokeStyle = color;
		context.lineWidth = 1;
		context.strokeRect(x, y, width, height);

		if (!config.hideLabels) {
			context.fillStyle = color;
			const textWidth = context.measureText(label).width;
			const textHeight = fontSize;
			const yText = y - (textHeight + context.lineWidth);
			context.fillRect(x - 1, yText < 0 ? 0 : yText, textWidth + context.lineWidth, textHeight + context.lineWidth);

			context.fillStyle = 'white';
			context.fillText(label, x - 1, yText < 0 ? 1 : yText + 1);
		}
	});
}
