const ctx = document.createElement('canvas').getContext('2d')

export function normalizeColorToHexCode(color: string) {
	if (!ctx) throw new Error()

	ctx.fillStyle = color
	return ctx.fillStyle + ''
}

export function findTextBetweenDelimiters(
	subject: string,
	index: number,
	open: string,
	close: string
) {
	subject = subject.slice(0, index) + '🍡' + subject.slice(index)

	const regex = new RegExp(
		`\\${open}([^\\${open}]*?🍡[^\\${close}]*?)\\${close}`
	)

	const match = regex.exec(subject)

	if (!match) return null

	const text = match[1].replace('🍡', '')
	const startIndex = match.index + 1
	const endIndex = startIndex + text.length

	return {text, startIndex, endIndex}
}

export function findNumericLiteralAtColumn(subject: string, index: number) {
	subject = subject.slice(0, index) + '🍡' + subject.slice(index)

	const regex = /([+-\d.]*🍡[+-\d.]*)/

	const match = regex.exec(subject)

	if (!match) return null

	const text = match[1].replace('🍡', '')
	const startIndex = match.index
	const endIndex = startIndex + text.length

	if (/^[+-]?\d+$/.test(text)) {
		return {
			value: parseInt(text),
			precision: 0,
			startIndex,
			endIndex,
		}
	}

	const floatMatch = /^[+-]?\d*\.(\d*)$/.exec(text)

	if (floatMatch) {
		return {
			precision: Math.max(1, floatMatch[1].length),
			value: parseFloat(text),
			startIndex,
			endIndex,
		}
	}

	return null
}

export function replaceTextBetween(
	subject: string,
	startIndex: number,
	endIndex: number,
	replacement: string
) {
	return subject.slice(0, startIndex) + replacement + subject.slice(endIndex)
}
