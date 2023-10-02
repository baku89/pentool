export function toFixed(value: number, precision: number) {
	return value
		.toFixed(precision)
		.replace(/\.(.*?)[0]+$/, '.$1')
		.replace(/\.$/, '')
}
export const unsignedMod = (x: number, y: number) => ((x % y) + y) % y

export function isDecendantElementOf(child: Element, parent: Element) {
	let node: Element | null = child
	while (node) {
		if (node === parent) return true
		node = node.parentElement
	}

	return false
}
