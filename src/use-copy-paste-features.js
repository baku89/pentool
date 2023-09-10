// copy and paste features
import paper from 'paper'
import { replaceCode } from './util'

export default function useCopyPasteFeatures(editor) {
	document.getElementById('copy').addEventListener('click', () => {
		const svg = paper.project.exportSVG({ asString: true })
		navigator.clipboard.writeText(svg.toString())
	})

	document.getElementById('paste').addEventListener('click', async () => {
		const position = editor.getPosition()

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
