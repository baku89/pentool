import './style.css'
import * as monaco from 'monaco-editor'

// needs to import the latest version of acorn to use ES6 syntax in PaperScript
import * as acorn from 'acorn'
window.acorn = acorn

import paper from 'paper'

// Add offset functions for global paper.js object
import PaperOffset from 'paperjs-offset'
PaperOffset(paper)

import useDirectManipulation from './use-direct-manipulation'
import useCopyPasteFeatures from './use-copy-paste-features'

const initialCode =
	localStorage.getItem('code') ||
	`const path = new Path()
path.strokeColor = "red"

const start = new Point(100, 100)

path.moveTo(start)
path.lineTo(start + [200, 50])`

const editorElement = document.getElementById('editor')

// initialze Monaco editor
const editor = monaco.editor.create(editorElement, {
	value: initialCode,
	language: 'javascript',

	// make the editor look prettier
	'bracketPairColorization.enabled': false,
	fontLigatures: true,
	fontFamily: 'Fira Code',
	folding: false,
	lineNumbers: 'off',
	lineDecorationsWidth: 0,
	lineNumbersMinChars: 0,
	minimap: {
		enabled: false,
	},
	overviewRulerLanes: 0,
	renderIndentGuides: false,
	scrollBeyondLastLine: false,
	tabSize: 2,
})

// fetch the theme file and apply to the editor
fetch(
	'https://raw.githubusercontent.com/brijeshb42/monaco-themes/master/themes/Tomorrow.json'
)
	.then((res) => res.json())
	.then((data) => {
		monaco.editor.defineTheme('tomorrow', data)
		monaco.editor.setTheme('tomorrow')
	})

// resize editor to match its parent element size
new ResizeObserver((entries) => {
	const {
		contentRect: { width, height },
	} = entries[0]

	editor.layout({ width, height })
}).observe(editorElement.parentElement)

// setup paper.js
const canvas = document.getElementById('canvas')
paper.setup(canvas)

// run the current code
const run = (code) => {
	const doAutoRefresh = localStorage.getItem('auto-refresh') ?? 'true'
	localStorage.setItem('auto-refresh', 'false')

	try {
		paper.project.activeLayer.removeChildren()
		paper.tools.forEach((t) => t.remove())
		paper.PaperScript.execute(code, paper)
	} finally {
		localStorage.setItem('auto-refresh', doAutoRefresh)
	}
}

// run the code on change
editor.getModel().onDidChangeContent(() => {
	const code = editor.getValue()
	localStorage.setItem('code', code)

	const doAutoRefresh = localStorage.getItem('auto-refresh') === 'true'

	// if the checkbox is turned on, run the code immediately
	if (doAutoRefresh) {
		run(code)
	}

	updateOverlays()
})

// auto-refresh
const initialAutoRefresh =
	(localStorage.getItem('auto-refresh') ?? 'true') === 'true'

const autoRefreshElement = document.getElementById('auto-refresh')

autoRefreshElement.checked = initialAutoRefresh

autoRefreshElement.addEventListener('change', () => {
	const autoRefresh = autoRefreshElement.checked
	localStorage.setItem('auto-refresh', JSON.stringify(autoRefresh))

	if (autoRefresh) {
		const code = editor.getValue()
		run(code)
	}
})

// manual execution
document.getElementById('run').addEventListener('click', () => {
	run(editor.getValue())
})

if (initialAutoRefresh) {
	run(initialCode)
}

// enable copy and paste features
useCopyPasteFeatures(editor)

// direct manipulation features
const { updateOverlays } = useDirectManipulation(editor)
