import * as monaco from 'monaco-editor'

const ctx = document.createElement('canvas').getContext('2d')

export function normalizeColorToHexCode(color: string) {
	if (!ctx) throw new Error()

	ctx.fillStyle = color
	return ctx.fillStyle + ''
}

export function findTextBetweenDelimitersAtColumn(
	subject: string,
	column: number,
	open: string,
	close: string
) {
	subject = subject.slice(0, column - 1) + '🍡' + subject.slice(column - 1)

	const regex = new RegExp(`${open}([^${open}]*?🍡[^${close}]*?)${close}`)

	const match = regex.exec(subject)

	if (!match) return null

	const text = match[1].replace('🍡', '')
	const startColumn = match.index + 2
	const endColumn = startColumn + text.length

	return { text, startColumn, endColumn }
}

export function findNumericLiteralAtColumn(subject: string, column: number) {
	subject = subject.slice(0, column - 1) + '🍡' + subject.slice(column - 1)

	const regex = /([+-\d.]*🍡[+-\d.]*)/

	const match = regex.exec(subject)

	if (!match) return null

	const text = match[1].replace('🍡', '')
	const startColumn = match.index + 1
	const endColumn = startColumn + text.length

	if (/^[+-]?\d+$/.test(text)) {
		return {
			value: parseInt(text),
			precision: 0,
			startColumn,
			endColumn,
		}
	}

	const floatMatch = /^[+-]?\d*\.(\d*)$/.exec(text)

	if (floatMatch) {
		return {
			precision: Math.max(1, floatMatch[1].length),
			value: parseFloat(text),
			startColumn,
			endColumn,
		}
	}

	return null
}

export function replaceCode(
	editor: monaco.editor.IStandaloneCodeEditor,
	line: number,
	startColumn: number,
	endColumn: number,
	text: string
) {
	const op = {
		range: new monaco.Range(line, startColumn, line, endColumn),
		text,
	}
	editor.getModel()?.pushEditOperations([], [op], () => null)
}
