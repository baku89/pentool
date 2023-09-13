import './style.styl'

import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')

// import useDirectManipulation from './use-direct-manipulation'
// import useCopyPasteFeatures from './use-copy-paste-features'

// // auto-refresh
// const initialAutoRefresh =
// 	(localStorage.getItem('auto-refresh') ?? 'true') === 'true'

// const autoRefreshElement = document.getElementById(
// 	'auto-refresh'
// ) as HTMLInputElement

// autoRefreshElement.checked = initialAutoRefresh

// autoRefreshElement.addEventListener('change', () => {
// 	const autoRefresh = autoRefreshElement.checked
// 	localStorage.setItem('auto-refresh', JSON.stringify(autoRefresh))

// 	if (autoRefresh) {
// 		const code = editor.getValue()
// 		run(code)
// 	}
// })

// // manual execution
// document.getElementById('run')?.addEventListener('click', () => {
// 	run(editor.getValue())
// })

// if (initialAutoRefresh) {
// 	run(initialCode)
// }

// // enable copy and paste features
// useCopyPasteFeatures(editor)

// // direct manipulation features
// const { updateOverlays } = useDirectManipulation(editor)
