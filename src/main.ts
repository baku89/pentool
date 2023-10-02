import 'tweeq/global.styl'

import {createApp} from 'vue'

import App from './components/App.vue'

createApp(App).mount('#app')

// Prevent pinch zooming on tablets
window.addEventListener(
	'touchstart',
	e => {
		if (e.touches.length > 1) {
			e.preventDefault()
		}
	},
	{passive: false}
)
