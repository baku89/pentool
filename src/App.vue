<script lang="ts" setup>
import { ref, onMounted, watch, nextTick, computed, watchEffect } from 'vue'
import { Mat2d, mat2d, vec2 } from 'linearly'
import { useLocalStorage, useTitle } from '@vueuse/core'
// needs to import the latest version of acorn to use ES6 syntax in PaperScript
import * as acorn from 'acorn'
;(window as any).acorn = acorn

import paper from 'paper'

// Add offset functions for global paper.js object
import PaperOffset from 'paperjs-offset'
PaperOffset(paper)

import { replaceTextBetween } from './utils'
import MonacoEditor, { ErrorInfo } from './MonacoEditor.vue'
import OverlayPointHandle from './OverlayPointHandle.vue'
import OverlayColorPicker from './OverlayColorPicker.vue'
import OverlayNumberSlider from './OverlayNumberSlider.vue'
import { useZUI } from './useZUI'

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

const errors = ref<ErrorInfo[] | null>(null)

function executeCode() {
	if (!autoRefresh.value) return

	const _autoRefresh = autoRefresh.value
	autoRefresh.value = false

	errors.value = null

	try {
		paper.project.activeLayer.removeChildren()
		paper.tools.forEach((t) => t.remove())
		paper.PaperScript.execute(code.value, paper)
	} catch (e) {
		if (e instanceof SyntaxError) {
			const match = e.stack?.match(/(\d+):(\d+)/)
			if (match) {
				let [line, column] = match.slice(1).map(Number)
				errors.value = [
					{
						message: e.message,
						line,
						column,
					},
				]
			}
		} else if (e instanceof Error) {
			const match = e.stack?.match(/<anonymous>:(\d+):(\d+)/)

			if (match) {
				let [line, column] = match.slice(1).map(Number)

				if (line === 1) {
					column -= 70
				}

				errors.value = [
					{
						message: e.message,
						line,
						column,
					},
				]
			}
		}

		if (!errors.value) {
			errors.value = [
				{
					message: (e as Error).toString(),
					line: 1,
					column: 0,
				},
			]
		}
	} finally {
		autoRefresh.value = _autoRefresh
	}
}

watch([code, autoRefresh], () => nextTick(executeCode))

// Setup paper.js
const $canvas = ref<HTMLCanvasElement | null>(null)

const viewTransform = ref<Mat2d>([...mat2d.identity])

onMounted(() => {
	// setup paper.js
	if (!$canvas.value) return
	paper.setup($canvas.value)

	executeCode()

	const { cursor } = useZUI($canvas.value, (xform) => {
		viewTransform.value = mat2d.multiply(xform, viewTransform.value)
	})

	watch(viewTransform, () => {
		paper.view.matrix.set(viewTransform.value)
		paper.view.update()
	})

	watchEffect(() => {
		document.body.style.cursor = cursor.value
	})
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

const fileHandle = ref<FileSystemFileHandle | null>(null)

const fileName = computed(() => {
	return fileHandle.value?.name || 'Untitled'
})

useTitle(fileName)

const filePickerOptions: FilePickerOptions = {
	types: [
		{
			description: 'Paper.js Project',
			accept: {
				'text/plain': ['.js'],
			},
		},
	],
}

async function saveProject() {
	if (!fileHandle.value) {
		fileHandle.value = await window.showSaveFilePicker(filePickerOptions)
	}

	const writable = await fileHandle.value.createWritable()
	await writable.write(code.value)
	await writable.close()
}

async function openProject() {
	const handles = await window.showOpenFilePicker(filePickerOptions)

	fileHandle.value = handles[0]

	const file = await fileHandle.value.getFile()
	const text = await file.text()
	code.value = text
}

// Register shotcuts
window.addEventListener('keydown', (e) => {
	if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
		e.preventDefault()
		saveProject()
	} else if (e.key === 'o' && (e.ctrlKey || e.metaKey)) {
		e.preventDefault()
		openProject()
	}
})

window.addEventListener('drop', async (e) => {
	e.preventDefault()

	if (!e.dataTransfer) return

	const handle = await e.dataTransfer.items[0].getAsFileSystemHandle()

	if (!handle || handle.kind !== 'file') return

	fileHandle.value = handle as FileSystemFileHandle

	const file = await fileHandle.value.getFile()
	const text = await file.text()
	code.value = text
})
</script>

<template>
	<div class="App">
		<div class="title">
			<img class="icon" src="/favicon.svg" />
			{{ fileName }}
		</div>
		<main class="main">
			<div class="canvas-wrapper">
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
						<span class="material-symbols-outlined">content_copy</span>
					</button>
					<button @click="pasteSVGToCanvas">
						<span class="material-symbols-outlined">content_paste</span>
					</button>
					<button @click="saveProject">
						<span class="material-symbols-outlined">download</span>
					</button>
				</div>
				<div class="editor-wrapper">
					<MonacoEditor
						class="editor"
						v-model="code"
						v-model:cursorIndex="cursorIndex"
						v-model:cursorPosition="cursorPosition"
						:errors="errors"
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

.title
	display flex
	left env(titlebar-area-x, 0)
	top env(titlebar-area-y, 0)
	width env(titlebar-area-width, 100%)
	height var(--titlebar-area-height)
	display flex
	z-index 100
	user-select none

	position fixed
	background 'linear-gradient(to bottom, rgba(%s, .5) 20%, transparent)' % var(--ui-bg-rgb)
	backdrop-filter blur(2px)
	gap .6rem
	padding .4rem .4rem
	-webkit-app-region: drag;
	app-region: drag;

	line-height calc(var(--titlebar-area-height) - 0.8rem)

	@media (display-mode: window-controls-overlay)
		padding-left 0

	.icon
		height calc(var(--titlebar-area-height) - .8rem)
.main
	position relative
	height 100vh

	@media (display-mode: window-controls-overlay), (display-mode: standalone)
		padding-top 0

.canvas-wrapper
	position relative
	height 100%
	// draws dotted grid
	background-image radial-gradient(circle at 0 0, var(--ui-color) 1px, transparent 0)
	background-size 20px 20px

.canvas
	height 100%
	width 100%

.inspector
	position absolute
	padding 1rem
	border 1px solid 'rgba(%s, .1)' % var(--ui-color-rgb)
	outline  'rgba(%s, .5)' % var(--ui-bg-rgb) 1px solid
	background 'rgba(%s, .95)' % var(--ui-bg-rgb)
	backdrop-filter blur(4px)
	width 50%
	right 0
	bottom 0
	display flex
	flex-direction column
	gap 1rem

	top calc(env(titlebar-area-y, 0px) + var(--titlebar-area-height))
	border-width 1px 0 0 1px
	border-radius 1.4rem 0 0 0


.actions
	display flex
	align-items center
	gap 0.5rem

	.spacer
		flex-grow 1

	button
		display inline-flex
		justify-content center
		align-items center
		background var(--ui-button)
		color var(--ui-color)
		width 32px
		height 32px
		border-radius 9999px
		vertical-align middle
		padding 0 6px
		gap .4em
		transition all ease .2s

		&.play
			width auto
			padding 0 12px 0 6px
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
