import './style.2.css'
import * as monaco from 'monaco-editor'

const initialCode = 'console.log("hello")'

const editorElement = document.getElementById('editor')

// initialze Monaco editor
const editor = monaco.editor.create(editorElement, {
	value: initialCode,
	language: 'javascript',
})

// run the current code
const run = (code) => {
	eval(code)
}

// run the code on change
editor.getModel().onDidChangeContent(() => {
	const code = editor.getValue()
	run(code)
})

run(initialCode)
