export function toFixedWithNoTrailingZeros(value: number, precision: number) {
	return value
		.toFixed(precision)
		.replace(/\.(.*?)[0]+$/, '.$1')
		.replace(/\.$/, '')
}
export const unsignedMod = (x: number, y: number) => ((x % y) + y) % y
