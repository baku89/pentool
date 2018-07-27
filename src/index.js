import Vue from 'vue/dist/vue.esm.js'
import App from './app.vue'

const app = new Vue(App)
app.$mount('#app')


window.addEventListener('mousewheel', (e) => {
	e.preventDefault()
})