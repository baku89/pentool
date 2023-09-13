<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
// needs to import the latest version of acorn to use ES6 syntax in PaperScript
import * as acorn from 'acorn'
;(window as any).acorn = acorn

import paper from 'paper'

// Add offset functions for global paper.js object
import PaperOffset from 'paperjs-offset'
PaperOffset(paper)

import MonacoEditor from './MonacoEditor.vue'
import PointHandle from './PointHandle.vue'
import { replaceTextBetween } from './utils'

const code = useLocalStorage('code', '')

if (code.value === '') {
	code.value = `const path = new Path()
path.strokeColor = "red"

const start = new Point(100, 100)

path.moveTo(start)
path.lineTo(start + [200, 50])`
}

const cursorPosition = ref(0)

const autoRefresh = useLocalStorage('autoRefresh', true)

function executeCode() {
	if (!autoRefresh.value) return

	const _autoRefresh = autoRefresh.value
	autoRefresh.value = false

	try {
		paper.project.activeLayer.removeChildren()
		paper.tools.forEach((t) => t.remove())
		paper.PaperScript.execute(code.value, paper)
	} finally {
		autoRefresh.value = _autoRefresh
	}
}

watch([code, autoRefresh], executeCode, { flush: 'post' })

// Setup paper.js
const $canvas = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
	// setup paper.js
	if (!$canvas.value) return
	paper.setup($canvas.value)

	executeCode()
})

function copyCanvasAsSVG() {
	const svg = paper.project.exportSVG({ asString: true })
	navigator.clipboard.writeText(svg.toString())
}

async function pasteSVGToCanvas() {
	const svg = await navigator.clipboard.readText()
	const svgCode = `project.importSVG(\`${svg}\`)\n`

	code.value = replaceTextBetween(
		code.value,
		cursorPosition.value,
		cursorPosition.value,
		svgCode
	)
}
</script>

<template>
	<div class="App">
		<div>
			<canvas class="canvas" ref="$canvas" resize></canvas>
			<PointHandle v-model:code="code" :cursorPosition="cursorPosition" />
		</div>

		<div class="inspector">
			<div class="actions">
				<button class="play" @click="autoRefresh = !autoRefresh">
					<span class="material-symbols-outlined">{{
						autoRefresh ? 'pause_circle' : 'play_circle'
					}}</span>
					{{ autoRefresh ? 'Pause' : 'Resume' }}
				</button>
				<div class="spacer" />
				<button @click="copyCanvasAsSVG">
					<span class="material-symbols-outlined">content_copy</span>Copy
				</button>
				<button @click="pasteSVGToCanvas">
					<span class="material-symbols-outlined">content_paste</span>Paste
				</button>
			</div>
			<MonacoEditor
				class="editor"
				v-model="code"
				v-model:cursorPosition="cursorPosition"
			/>
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

	.spacer
		flex-grow 1

	button
		display inline-flex
		align-items center
		background #eee
		color black
		padding 0 12px 0 6px
		height 32px
		border-radius 9999px
		vertical-align middle
		gap .4em
		transition all ease .2s

		&.play
			background black
			color white

		&:hover
			background blue
			color white


.editor
	position relative
	flex-grow 1

/* Direct Manipulation */
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
./utils
