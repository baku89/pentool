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
			devOptions: {
				enabled: true,
			},
			injectRegister: 'auto',
			includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
			manifest: {
				name: 'Paper.js Editor',
				short_name: 'Paper.js',
				theme_color: '#ffffff',
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
