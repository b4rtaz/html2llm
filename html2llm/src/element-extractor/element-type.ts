export enum ElementType {
	link = 1,
	button = 2,
	input = 3,
	select = 4
}

export function elementTypeToString(type: ElementType) {
	switch (type) {
		case ElementType.link:
			return 'link';
		case ElementType.button:
			return 'button';
		case ElementType.input:
			return 'input';
		case ElementType.select:
			return 'select';
	}
}
