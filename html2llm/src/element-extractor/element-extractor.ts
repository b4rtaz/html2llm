import { OmniParserResult } from '../omni-parser/omni-parser-result';
import { ElementType } from './element-type';

export interface TypedElement {
	el: HTMLElement;
	type: ElementType;
}

export interface Box {
	absX: number;
	absY: number;
	x: number;
	y: number;
	w: number;
	h: number;
}

export type ExtractedElement = Box & TypedElement & { label: string | null; value: string | null };

export interface ExtractedElements {
	pixelRatio: number;
	foundElements: ExtractedElement[];
	notFoundBoxes: Box[];
}

export class ElementExtractor {
	public static extract(
		result: OmniParserResult,
		config: {
			scrollX: number;
			scrollY: number;
			customDevicePixelRatio?: number;
		}
	): ExtractedElements {
		const pixelRatio = config.customDevicePixelRatio ?? window.devicePixelRatio;
		const offsets = [0.1, 0.5, 0.9];

		const foundElements: ExtractedElement[] = [];
		const notFoundBoxes: Box[] = [];

		for (const box of result.boxes) {
			const x = (box.x * result.scaleX) / pixelRatio;
			const y = (box.y * result.scaleY) / pixelRatio;
			const w = (box.w * result.scaleX) / pixelRatio;
			const h = (box.h * result.scaleY) / pixelRatio;
			const absX = x + scrollX;
			const absY = y + scrollY;

			const elements = offsets
				.map(offset => {
					const x0 = x + w * offset;
					const y0 = y + h * offset;
					return elementFromPoint(x0, y0);
				})
				.filter(Boolean) as HTMLElement[];

			const resolved = resolveElements(elements);
			if (resolved) {
				const label = getLabel(resolved.type, resolved.el);
				const value = getValue(resolved.type, resolved.el);
				foundElements.push({ absX, absY, x, y, w, h, ...resolved, label, value });
			} else {
				notFoundBoxes.push({ absX, absY, x, y, w, h });
			}
		}

		return {
			pixelRatio,
			foundElements,
			notFoundBoxes
		};
	}
}

function elementFromPoint(x: number, y: number): Element | null {
	let root: Document | ShadowRoot | null | undefined = document;
	let el: Element | null = null;
	while (root) {
		el = root.elementFromPoint(x, y);
		root = el?.shadowRoot;
	}
	return el;
}

function resolveElements(elements: HTMLElement[]): TypedElement | null {
	if (elements.length === 0) {
		return null;
	}

	for (const el of elements) {
		const type = getElementType(el);
		if (type !== null) {
			return { el, type };
		}
	}

	for (const el of elements) {
		const clickableParent = getFirstClickableParent(el);
		if (clickableParent) {
			return clickableParent;
		}
	}
	return null;
}

function getFirstClickableParent(el: HTMLElement, limit = 16): { el: HTMLElement; type: ElementType } | null {
	let current = el.parentElement;
	for (let i = 0; i < limit; i++) {
		if (!current) {
			return null;
		}
		const type = getClickableElementType(current);
		if (type !== null) {
			return { el: current, type };
		}
		current = current.parentElement;
	}
	return null;
}

function getClickableElementType(el: HTMLElement): ElementType | null {
	const tagName = el.tagName;
	if (tagName === 'A') {
		return ElementType.link;
	}
	if (tagName === 'BUTTON') {
		return ElementType.button;
	}
	const role = el.getAttribute('role');
	if (role) {
		if (role === 'button') {
			return ElementType.button;
		}
		if (role === 'link') {
			return ElementType.link;
		}
	}
	return null;
}

function getElementType(el: HTMLElement): ElementType | null {
	if (el.tagName === 'INPUT') {
		const type = (el as HTMLInputElement).type;
		if (type === 'submit' || type === 'button') {
			return ElementType.button;
		}
		return ElementType.input;
	}
	if (el.tagName === 'TEXTAREA') {
		return ElementType.input;
	}
	if (el.tagName === 'SELECT') {
		return ElementType.select;
	}
	const clickableType = getClickableElementType(el);
	if (clickableType !== null) {
		return clickableType;
	}
	return null;
}

function getLabel(type: ElementType, el: HTMLElement) {
	if (type === ElementType.input) {
		const val = (el as HTMLInputElement).placeholder || (el as HTMLInputElement).value;
		if (val) {
			return val;
		}
	}
	if (type === ElementType.select) {
		// TODO
	}
	if (type === ElementType.link || type === ElementType.button) {
		const val = el.innerText.trim();
		if (val) {
			return val;
		}
	}
	const ariaLabel = el.getAttribute('aria-label')?.trim();
	if (ariaLabel) {
		return ariaLabel;
	}
	const labelledBy = el.getAttribute('aria-labelledby');
	if (labelledBy) {
		const label = document.getElementById(labelledBy)?.innerText.trim();
		if (label) {
			return label;
		}
	}
	const describedBy = el.getAttribute('aria-describedby');
	if (describedBy) {
		const label = document.getElementById(describedBy)?.innerText.trim();
		if (label) {
			return label;
		}
	}
	const title = el.title?.trim();
	if (title) {
		return title;
	}
	const imgs = el.getElementsByTagName('img');
	if (imgs.length > 0) {
		const img = imgs[0];
		if (img.alt) {
			return img.alt;
		}
		if (img.title) {
			return img.title;
		}
	}
	const childArialLabel = el.querySelector('[aria-label]');
	if (childArialLabel) {
		const label = childArialLabel.getAttribute('aria-label')?.trim();
		if (label) {
			return label;
		}
	}
	return null;
}

function getValue(type: ElementType, el: HTMLElement) {
	if (type === ElementType.input) {
		return (el as HTMLInputElement).value;
	}
	return null;
}
