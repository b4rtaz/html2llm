import { ExtractedElement } from './element-extractor';
import { elementTypeToString } from './element-type';

export interface ExtractedElementGroup {
	label: string;
	section: HTMLElement | null;
	elements: ExtractedElement[];
}

export class SectionExtractor {
	public static groupBySections(ee: ExtractedElement[]): ExtractedElementGroup[] {
		const map = new Map<HTMLElement | null, ExtractedElement[]>();

		for (const element of ee) {
			const section = findClosestGeneralParentSection(element.el);
			let list = map.get(section);
			if (!list) {
				list = [];
				map.set(section, list);
			}
			list.push(element);
		}

		const groups: ExtractedElementGroup[] = [];
		for (const [section, elements] of map.entries()) {
			const label = section ? resolveSectionLabel(section) : null;
			if (label) {
				groups.push({ label, section, elements });
			} else {
				groups.push({ label: `Section ${groups.length}`, section, elements });
			}
		}
		return groups;
	}

	public static toMarkdown(groups: ExtractedElementGroup[]): string {
		let md = '';
		let index = 0;
		for (const group of groups) {
			//md += `* ${group.label}\n`;
			for (const element of group.elements) {
				md += `${index++}. `;
				md += `type: ${formatInlineCode(elementTypeToString(element.type))}, `;
				md += `label: ${formatInlineCode(element.label ?? '')}`;
				if (element.value !== null) {
					md += `, current value: ${formatInlineCode(element.value)}`;
				}
				md += '\n';
			}
		}
		return md;
	}
}

function formatInlineCode(text: string) {
	const safeText = text.replace(/`/g, '\\`');
	return `\`${safeText}\``;
}

function findClosestGeneralParentSection(element: HTMLElement) {
	let current: HTMLElement | null = element;
	while (current) {
		// SECTION and ARTICLE seem to be too popular, so we want to take only general groups
		if (current.tagName === 'MAIN' || current.tagName === 'ASIDE' || current.tagName === 'NAV' || current.tagName === 'FORM') {
			return current;
		}
		const role = current.getAttribute('role');
		if (role === 'banner' || role === 'main' || role === 'navigation') {
			return current;
		}
		current = current.parentElement;
	}
	return null;
}

function resolveSectionLabel(section: HTMLElement) {
	const ariaLabel = section.getAttribute('aria-label')?.trim();
	if (ariaLabel) {
		return ariaLabel;
	}
	if (section.tagName === 'MAIN') {
		return 'Main content';
	}
	if (section.tagName === 'ASIDE') {
		return 'Aside';
	}
	if (section.tagName === 'NAV') {
		return 'Navigation';
	}
	if (section.tagName === 'FORM') {
		return 'Form';
	}
	return null;
}
