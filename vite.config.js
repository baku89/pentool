import { defineConfig } from 'vite'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'

export default defineConfig({
	base: './',
	plugins: [
		monacoEditorPlugin.default({
			languageWorkers: ['editorWorkerService', 'typescript'],
		}),
	],
})
