import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vue from '@vitejs/plugin-vue'
import monacoEditorPlugin, {
	type IMonacoEditorOpts,
} from 'vite-plugin-monaco-editor'
const monacoEditorPluginDefault = (monacoEditorPlugin as any).default as (
	options: IMonacoEditorOpts
) => any

export default defineConfig({
	plugins: [
		vue(),
		monacoEditorPluginDefault({
			languageWorkers: ['editorWorkerService', 'typescript'],
		}),
		VitePWA({
			registerType: 'autoUpdate',
			injectRegister: 'auto',
			devOptions: {
				enabled: true,
			},
			manifest: {
				name: 'Paper.js Editor',
				short_name: 'Paper.js',
				theme_color: '#000000',
				display: 'standalone', // 'standalone', 'fullscreen', 'minimal-ui', 'browser
				display_override: ['window-controls-overlay', 'standalone'],
				icons: [
					{
						src: 'icon-192x192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: 'icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
					},
				],
			},
		}),
	],
})
