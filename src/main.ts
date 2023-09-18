import './style.styl'

import {createApp} from 'vue'

import App from './App.vue'

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
