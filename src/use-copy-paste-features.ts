// copy and paste features
import * as monaco from 'monaco-editor'
import paper from 'paper'
import { replaceCode } from './util'

export default function useCopyPasteFeatures(
	editor: monaco.editor.IStandaloneCodeEditor
) {
	document.getElementById('copy')?.addEventListener('click', () => {
		const svg = paper.project.exportSVG({ asString: true })
		navigator.clipboard.writeText(svg.toString())
	})

	document.getElementById('paste')?.addEventListener('click', async () => {
		const position = editor.getPosition()

		if (!position) {
			return
		}

		const svg = await navigator.clipboard.readText()
		const code = `project.importSVG(\`${svg}\`)\n`

		replaceCode(
			editor,
			position.lineNumber,
			position.column,
			position.column,
			code
		)
	})
}
