import { defineConfig } from 'vite'
import monacoEditorPlugin, {
	type IMonacoEditorOpts,
} from 'vite-plugin-monaco-editor'
const monacoEditorPluginDefault = (monacoEditorPlugin as any).default as (
	options: IMonacoEditorOpts
) => any

export default defineConfig({
	plugins: [
		monacoEditorPluginDefault({
			languageWorkers: ['editorWorkerService', 'typescript'],
		}),
	],
})
