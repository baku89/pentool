import * as monaco from 'monaco-editor'

import {
	findNumericLiteralAtColumn,
	findTextBetweenDelimitersAtColumn,
	normalizeColorToHexCode,
	replaceCode,
} from './util'

export default function useDirectManipulation(editor) {
	const colorPicker = document.getElementById('color-picker')
	const pointHandle = document.getElementById('point-handle')
	const editorRootElement = editor.getDomNode()

	const updateOverlays = () => {
		const model = editor.getModel()
		const position = editor.getPosition()

		if (!model || !position) return

		// reset all of event listeners and styles of overlay UIs
		colorPicker.style.visibility = 'hidden'
		colorPicker.oninput = null

		editorRootElement.onwheel = null

		pointHandle.onpointerdown = null
		pointHandle.style.visibility = 'hidden'

		const line = model.getLineContent(position.lineNumber)

		// displays a color picker on pointing color strings
		const matchStringLiteral =
			findTextBetweenDelimitersAtColumn(line, position.column, '"', '"') ??
			findTextBetweenDelimitersAtColumn(line, position.column, "'", "'")

		if (matchStringLiteral && CSS.supports('color', matchStringLiteral.text)) {
			const { startColumn } = matchStringLiteral

			let value = matchStringLiteral.text

			// show color picker
			colorPicker.value = normalizeColorToHexCode(value)
			colorPicker.style.visibility = 'visible'
			colorPicker.oninput = () => {
				const endColumn = startColumn + value.length
				value = colorPicker.value
				replaceCode(editor, position.lineNumber, startColumn, endColumn, value)
			}

			const cursorPosition = editor.getScrolledVisiblePosition(position)

			if (cursorPosition) {
				colorPicker.style.top = cursorPosition.top + 20 + 'px'
				colorPicker.style.left = cursorPosition.left + 'px'
			}

			return
		}

		// scrolls to tweak numeric literal
		const matchNumericLiteral = findNumericLiteralAtColumn(
			line,
			position.column
		)
		if (matchNumericLiteral) {
			let { value, precision, startColumn, endColumn } = matchNumericLiteral
			const step = Math.pow(10, -precision)

			editorRootElement.onwheel = (e) => {
				value += e.deltaY * step

				const literal = value.toFixed(precision)

				replaceCode(
					editor,
					position.lineNumber,
					startColumn,
					endColumn,
					literal
				)

				endColumn = startColumn + literal.length

				// needs to call this manually to update the point handle
				updateOverlays()
			}
		}

		// show point handle
		let matchBrackets = [
			findTextBetweenDelimitersAtColumn(line, position.column, '\\[', '\\]'),
			findTextBetweenDelimitersAtColumn(line, position.column, '\\(', '\\)'),
		].filter(Boolean)

		for (const matchBracket of matchBrackets) {
			const reg2DCoord = /^\s*([+-.\d]+)\s*,\s*([+-.\d]+)\s*$/
			const match2DCoord = reg2DCoord.exec(matchBracket.text)

			if (match2DCoord) {
				let [x, y] = match2DCoord.slice(1, 3).map(parseFloat)
				let { startColumn, endColumn } = matchBracket

				pointHandle.style.visibility = 'visible'
				pointHandle.style.left = x + 'px'
				pointHandle.style.top = y + 'px'

				pointHandle.onpointerdown = (e) => {
					pointHandle.setPointerCapture(e.pointerId)

					let prevX = e.clientX,
						prevY = e.clientY

					pointHandle.onpointermove = (e) => {
						x += e.clientX - prevX
						y += e.clientY - prevY
						;[prevX, prevY] = [e.clientX, e.clientY]

						// updates the position of the point handle
						pointHandle.style.left = x + 'px'
						pointHandle.style.top = y + 'px'

						// replace the numeric literals in the code
						const text = x.toFixed(0) + ', ' + y.toFixed(0)

						replaceCode(
							editor,
							position.lineNumber,
							startColumn,
							endColumn,
							text
						)

						endColumn = startColumn + text.length
					}

					pointHandle.onpointerup = (e) => {
						pointHandle.releasePointerCapture(e.pointerId)
						pointHandle.onpointerup = pointHandle.onpointermove = null
					}
				}

				break
			}
		}
	}

	editor.onDidChangeCursorPosition(updateOverlays)

	return { updateOverlays }
}
