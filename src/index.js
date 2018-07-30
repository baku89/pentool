import Vue from 'vue/dist/vue.esm.js'
import App from './App.vue'
const app = new Vue(App)
app.$mount('#app')

window.addEventListener('mousewheel', (e) => {
	e.preventDefault()
})