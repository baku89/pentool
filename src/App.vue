<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import MonacoEditor from './MonacoEditor.vue'
import { useLocalStorage } from '@vueuse/core'

// needs to import the latest version of acorn to use ES6 syntax in PaperScript
import * as acorn from 'acorn'
window.acorn = acorn

import paper from 'paper'

// Add offset functions for global paper.js object
import PaperOffset from 'paperjs-offset'
PaperOffset(paper)

const code = useLocalStorage(
	'code',
	`const path = new Path()
path.strokeColor = "red"

const start = new Point(100, 100)

path.moveTo(start)
path.lineTo(start + [200, 50])`
)

const autoRefresh = useLocalStorage('autoRefresh', true)

function run(code: string) {
	if (!autoRefresh.value) return

	const _autoRefresh = autoRefresh.value
	autoRefresh.value = false

	try {
		paper.project.activeLayer.removeChildren()
		paper.tools.forEach((t) => t.remove())
		paper.PaperScript.execute(code, paper)
	} finally {
		autoRefresh.value = _autoRefresh
	}
}

watch(code, (code) => {
	run(code)
})

// Setup paper.js
const $canvas = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
	// setup paper.js
	if (!$canvas.value) return
	paper.setup($canvas.value)
})
</script>

<template>
	<div class="App">
		<div>
			<canvas class="canvas" ref="$canvas" resize></canvas>
			<div id="point-handle"></div>
		</div>

		<div class="inspector">
			<div class="actions">
				<button id="run">{{ autoRefresh ? 'Pause' : 'Resume' }}</button>
				<button id="copy">Copy</button>
				<button id="paste">Paste</button>
			</div>
			<MonacoEditor class="editor" v-model="code" />
		</div>
	</div>
</template>

<style lang="stylus" scoped>
.App
	display flex
	box-sizing border-box
	margin 0
	padding 1rem
	height 100vh
	gap 1rem

	& > div
		position relative
		width 50%

.canvas
	width 100%
	height 100%
	// draws dotted grid
	background-image radial-gradient(circle at 0 0, black 1px, transparent 0)
	background-size 20px 20px

.inspector
	display flex
	flex-direction column
	gap 1rem

.actions
	display flex
	align-items center
	gap 0.5rem

	button
		background black
		color white
		padding 0 1em
		height 2rem
		border-radius 9999px

.editor
	position relative
	flex-grow 1

/* Direct Manipulation */
#point-handle
	position absolute
	visibility hidden
	margin -10px 0 0 -10px
	width 21px
	height 21px
	outline 1px solid rgba(255, 255, 255, 0.5)
	border 1px solid blue
	border-radius 50%
	background white

#color-picker
	position absolute
	visibility hidden
	width 3.2rem
	height 1.6rem
	background transparent
	transform translateX(-50%)

	&::-webkit-color-swatch-wrapper
		padding 0

	&::-webkit-color-swatch
		border 0
		border-radius 0.8rem
</style>
