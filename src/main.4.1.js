import './style.2.css'
import * as monaco from 'monaco-editor'
import paper from 'paper'

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
})

// setup paper.js
const canvas = document.getElementById('canvas')
paper.setup(canvas)

// run the current code
const run = (code) => {
	paper.project.activeLayer.removeChildren()
	paper.PaperScript.execute(code, paper)
}

// run the code on change
editor.getModel().onDidChangeContent(() => {
	const code = editor.getValue()
	localStorage.setItem('code', code)

	run(code)
})

run(initialCode)
