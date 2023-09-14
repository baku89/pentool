<script lang="ts" setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { vec2 } from 'linearly'
import { useLocalStorage } from '@vueuse/core'
// needs to import the latest version of acorn to use ES6 syntax in PaperScript
import * as acorn from 'acorn'
;(window as any).acorn = acorn

import paper from 'paper'

// Add offset functions for global paper.js object
import PaperOffset from 'paperjs-offset'
PaperOffset(paper)

import { replaceTextBetween } from './utils'
import MonacoEditor from './MonacoEditor.vue'
import OverlayPointHandle from './OverlayPointHandle.vue'
import OverlayColorPicker from './OverlayColorPicker.vue'
import OverlayNumberSlider from './OverlayNumberSlider.vue'

const code = useLocalStorage('code', '')

if (code.value === '') {
	code.value = `const path = new Path()
path.strokeColor = "red"

const start = new Point(100, 100)

path.moveTo(start)
path.lineTo(start + [200, 50])`
}

const cursorIndex = ref(0)
const cursorPosition = ref(vec2.zero)

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

watch([code, autoRefresh], () => nextTick(executeCode))

// Setup paper.js
const $canvas = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
	// setup paper.js
	if (!$canvas.value) return
	paper.setup($canvas.value)

	executeCode()
})

const colorPickerVisible = ref(false)

function copyCanvasAsSVG() {
	const svg = paper.project.exportSVG({ asString: true })
	navigator.clipboard.writeText(svg.toString())
}

async function pasteSVGToCanvas() {
	const svg = await navigator.clipboard.readText()
	const svgCode = `project.importSVG(\`${svg}\`)\n`

	code.value = replaceTextBetween(
		code.value,
		cursorIndex.value,
		cursorIndex.value,
		svgCode
	)
}
</script>

<template>
	<div class="App">
		<div class="title">
			<img class="icon" src="/favicon.svg" />
			Paper.js Editor
		</div>
		<main class="main">
			<div>
				<canvas class="canvas" ref="$canvas" resize></canvas>
				<OverlayPointHandle v-model:code="code" :cursorIndex="cursorIndex" />
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
				<div class="editor-wrapper">
					<MonacoEditor
						class="editor"
						v-model="code"
						v-model:cursorIndex="cursorIndex"
						v-model:cursorPosition="cursorPosition"
					/>
					<OverlayColorPicker
						v-model:code="code"
						:cursorIndex="cursorIndex"
						:cursorPosition="cursorPosition"
						v-model:visible="colorPickerVisible"
					/>
					<OverlayNumberSlider
						v-show="!colorPickerVisible"
						v-model:code="code"
						v-model:cursorIndex="cursorIndex"
						:cursorPosition="cursorPosition"
					/>
				</div>
			</div>
		</main>
	</div>
</template>

<style lang="stylus" scoped>
.App
	display flex
	flex-direction column
.title
	display none

	@media (display-mode: window-controls-overlay)
		margin-left env(titlebar-area-x, 0)
		margin-top env(titlebar-area-y, 0)
		width env(titlebar-area-width, 100%)
		height env(titlebar-area-height, 33px)

		display flex
		gap .6rem
		padding .4rem 0
		-webkit-app-region: drag;
		app-region: drag;

		line-height calc(env(titlebar-area-height, 33px) - 0.8rem)
		.icon
			height calc(env(titlebar-area-height, 33px) - .8rem)
.main
	flex-grow 1
	display flex
	box-sizing border-box
	padding 1rem
	height 100vh
	gap 1rem

	@media (display-mode: window-controls-overlay), (display-mode: standalone)
		padding-top 0

	& > div
		position relative
		width 50%

.canvas
	width 100%
	height 100%
	// draws dotted grid
	background-image radial-gradient(circle at 0 0, var(--ui-color) 1px, transparent 0)
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
		background var(--ui-button)
		color var(--ui-color)
		padding 0 12px
		height 32px
		border-radius 9999px
		vertical-align middle
		gap .4em
		transition all ease .2s

		&.play
			background var(--ui-color)
			color var(--ui-bg)

		&:hover
			background var(--ui-accent)
			color var(--ui-bg)
.editor-wrapper
	position relative
	flex-grow 1

.editor
	width 100%
	height 100%

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
