<script lang="ts" setup>
import {useCssVar, useTitle} from '@vueuse/core'
import * as acorn from 'acorn'
import {mat2d, scalar, vec2} from 'linearly'
import {
	computed,
	nextTick,
	onMounted,
	ref,
	shallowRef,
	watch,
	watchEffect,
} from 'vue'

// needs to import the latest version of acorn to use ES6 syntax in PaperScript
;(window as any).acorn = acorn

import paper from 'paper'
// Add offset functions for global paper.js object
import PaperOffset from 'paperjs-offset'
PaperOffset(paper)

import Tq, {ErrorInfo, useTweeq} from '@/tweeq'
import {useCommentMeta} from '@/use/useCommentMeta'
import {useZUI} from '@/use/useZUI'
import {replaceTextBetween} from '@/utils'

import OverlayColorPicker from './OverlayColorPicker.vue'
import OverlayNumberSlider from './OverlayNumberSlider.vue'
import OverlayPointHandle from './OverlayPointHandle.vue'

const {appStorage, registerActions, performAction} = useTweeq(
	'com.baku89.paperjs-editor'
)

const testString = ref('Hello World')
const testNumber = ref(Math.PI)
const testBoolean = ref(false)

// interface PaperDesc {
// 	id?: string
// 	name?: string
// 	icon?: string
// 	clearOnUpdate?: boolean
// 	parameters?: {
// 		[key: string]:
// 			| {type: 'number'; default: number}
// 			| {type: 'color'; default: string}
// 			| {type: 'boolean'; default: boolean}
// 	}
// }

const source = appStorage('source', '')

if (source.value === '') {
	source.value = `/*
{
	"id": "path",
	"clearOnUpdate": true,
	"parameters": []
}
*/
const path = new Path()
path.strokeColor = "red"

const start = new Point(100, 100)

path.moveTo(start)
path.lineTo(start + [200, 50])`
}

const {meta, content: code} = useCommentMeta(source)

const cursorIndex = ref(0)
const cursorPosition = ref(vec2.zero)

const autoRefresh = appStorage('autoRefresh', true)

const errors = ref<ErrorInfo[] | null>(null)

function executeCode() {
	if (!autoRefresh.value) return

	const _autoRefresh = autoRefresh.value
	autoRefresh.value = false

	errors.value = null

	try {
		paper.project.activeLayer.removeChildren()
		paper.tools.forEach(t => t.remove())
		paper.PaperScript.execute(code.value, paper)
	} catch (e) {
		if (e instanceof SyntaxError) {
			const match = e.stack?.match(/(\d+):(\d+)/)
			if (match) {
				const [line, column] = match.slice(1).map(Number)
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
				const line = Number(match[1])
				let column = Number(match[2])

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

// Setup paper.js
const $canvas = ref<HTMLCanvasElement | null>(null)

const titleBarOffset = computed(() => {
	return parseFloat(useCssVar('--titlebar-area-height').value)
})

const initialViewTransform = computed(() => {
	return mat2d.fromTranslation([20, 20 + titleBarOffset.value])
})

// Viewport navigation
const $canvasWrapper = ref<HTMLElement | null>(null)
const viewTransform = shallowRef(initialViewTransform.value)
const {cursor} = useZUI($canvasWrapper, xform => {
	const currentZoom = Math.sqrt(mat2d.determinant(viewTransform.value))
	const zoomDelta = Math.sqrt(mat2d.determinant(xform))

	const minZoom = 0.02,
		maxZoom = 256 // Same as Figma

	let z: number | null = null

	if (currentZoom * zoomDelta < minZoom) {
		z = minZoom / currentZoom
	} else if (currentZoom * zoomDelta > maxZoom) {
		z = maxZoom / currentZoom
	}

	if (z !== null) {
		const fp = mat2d.fixedPoint(xform)
		if (fp) {
			xform = mat2d.mul(xform, mat2d.fromScaling([z, z], fp))
		}
	}

	viewTransform.value = mat2d.mul(xform, viewTransform.value)
})

const zoom = computed(() => {
	return Math.sqrt(mat2d.determinant(viewTransform.value))
})

const canvasGridStyle = computed(() => {
	const [x, y] = vec2.transformMat2d(vec2.zero, viewTransform.value)

	const size = `${zoom.value * 20}px ${zoom.value * 20}px, 2px 2px, 2px 2px`
	const offset = `${x}px ${y}px, ${x}px ${y}px, ${x}px ${y}px`

	const opacity = scalar.smoothstep(0.1, 0.4, zoom.value)

	const op = `${opacity * 100}%`

	return {
		backgroundSize: size,
		backgroundPosition: offset,
		'--dot-color': `color-mix(in srgb, var(--tq-color-text) ${op}, transparent)`,
	}
})

onMounted(() => {
	// setup paper.js
	if (!$canvas.value) return
	paper.setup($canvas.value)

	watch([code, autoRefresh], () => nextTick(executeCode), {immediate: true})

	watchEffect(() => {
		paper.view.matrix.set(viewTransform.value)
	})

	watchEffect(() => {
		document.body.style.cursor = cursor.value
	})
})

const colorPickerVisible = ref(false)

const fileHandle = ref<FileSystemFileHandle | null>(null)
const lastSavedSource = ref('')

const fileName = computed(() => {
	return fileHandle.value?.name || 'Untitled'
})

const hasModified = computed(() => {
	return fileHandle.value && source.value !== lastSavedSource.value
})

const title = computed(() => {
	return fileName.value + (hasModified.value ? '*' : '')
})

useTitle(title)

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

registerActions([
	{
		id: 'reset-zoom',
		label: 'Reset Zoom',
		icon: 'zoom_out_map',
		input: 'esc',
		perform() {
			viewTransform.value = initialViewTransform.value
		},
	},
	{
		id: 'copy-canvas-as-svg',
		label: 'Copy Canvas as SVG',
		icon: 'content_copy',
		perform() {
			const svg = paper.project.exportSVG({asString: true})
			navigator.clipboard.writeText(svg.toString())
		},
	},
	{
		id: 'paste-svg-to-canvas',
		label: 'Paste SVG to Canvas',
		icon: 'content_paste',
		async perform() {
			const svg = await navigator.clipboard.readText()
			const svgCode = `project.importSVG(\`${svg}\`)\n`

			code.value = replaceTextBetween(
				code.value,
				cursorIndex.value,
				cursorIndex.value,
				svgCode
			)
		},
	},
	{
		id: 'open-project',
		label: 'Open Project',
		icon: 'file_open',
		async perform() {
			const handles = await window.showOpenFilePicker(filePickerOptions)

			fileHandle.value = handles[0]

			const file = await fileHandle.value.getFile()
			source.value = lastSavedSource.value = await file.text()
		},
	},
	{
		id: 'save-project',
		label: 'Save Project',
		icon: 'save',
		async perform() {
			if (!fileHandle.value) {
				fileHandle.value = await window.showSaveFilePicker(filePickerOptions)
			}

			const writable = await fileHandle.value.createWritable()
			await writable.write(source.value)
			await writable.close()

			lastSavedSource.value = source.value
		},
	},
])

// Register shotcuts
window.addEventListener('keydown', e => {
	if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
		e.preventDefault()
		performAction('save-project')
	} else if (e.key === 'o' && (e.ctrlKey || e.metaKey)) {
		e.preventDefault()
		performAction('open-project')
	}
})

window.addEventListener('drop', async e => {
	e.preventDefault()

	if (!e.dataTransfer) return

	const handle = await e.dataTransfer.items[0].getAsFileSystemHandle()

	if (!handle || handle.kind !== 'file') return

	fileHandle.value = handle as FileSystemFileHandle

	const file = await fileHandle.value.getFile()
	source.value = lastSavedSource.value = await file.text()
})
</script>

<template>
	<div class="App">
		<Tq.CommandPalette />
		<Tq.TitleBar name="Paper.js Editor" class="title" icon="favicon.svg">
			<template #left>
				{{ title }}
			</template>
			<template #right>
				<button class="zoom" @click="performAction('reset-zoom')">
					{{ (zoom * 100).toFixed(0) + '%' }}
				</button>
			</template>
		</Tq.TitleBar>
		<main class="main">
			<div ref="$canvasWrapper" class="canvas-wrapper">
				<div class="canvas-grid" :style="canvasGridStyle" />
				<canvas ref="$canvas" class="canvas" resize></canvas>
				<OverlayPointHandle
					v-model:code="code"
					:cursor-index="cursorIndex"
					:view-transform="viewTransform"
				/>
			</div>
		</main>
		<Tq.FloatingPane name="inspector-pane" icon="code">
			<Tq.Tabs class="inspector-tab" name="inspector.tab">
				<template #before-tablist>
					<Tq.RoundButton
						class="play"
						:icon="autoRefresh ? 'pause_circle' : 'play_circle'"
						:label="autoRefresh ? 'Pause' : 'Resume'"
						longest-label="Resume"
						@click="autoRefresh = !autoRefresh"
					/>
				</template>
				<Tq.Tab name="Settings">
					<Tq.MonacoEditor v-model="meta" class="editor" lang="text" />
				</Tq.Tab>
				<Tq.Tab name="Code">
					<Tq.MonacoEditor
						v-model="code"
						v-model:cursorIndex="cursorIndex"
						v-model:cursorPosition="cursorPosition"
						class="editor"
						lang="javascript"
						:errors="errors"
					/>
					<OverlayColorPicker
						v-model:code="code"
						v-model:visible="colorPickerVisible"
						:cursor-index="cursorIndex"
						:cursor-position="cursorPosition"
					/>
					<OverlayNumberSlider
						v-show="!colorPickerVisible"
						v-model:code="code"
						v-model:cursorIndex="cursorIndex"
						:cursor-position="cursorPosition"
					/>
				</Tq.Tab>
			</Tq.Tabs>
		</Tq.FloatingPane>
		<Tq.FloatingPane
			name="timeline"
			icon="timeline"
			:position="{anchor: 'bottom', height: 200}"
		>
			<Tq.ParameterGrid>
				<Tq.Parameter label="Distance">
					<Tq.InputString v-model="testString" />
				</Tq.Parameter>
				<Tq.Parameter label="Grow">
					<Tq.InputNumber v-model="testNumber" :min="0" :max="Math.PI * 2" />
				</Tq.Parameter>
				<Tq.Parameter label="Degrees">
					<Tq.InputRotery v-model="testNumber" />
				</Tq.Parameter>
				<Tq.Parameter label="Checkbox">
					<Tq.InputCheckbox v-model="testBoolean" />
				</Tq.Parameter>
				<Tq.Parameter label="Seed">
					<Tq.InputSeed v-model="testNumber" />
				</Tq.Parameter>
			</Tq.ParameterGrid>
		</Tq.FloatingPane>
	</div>
</template>

<style lang="stylus" scoped>
@import '../tweeq/common.styl'

.title
	.zoom
		font-numeric()
		font-size 11px
		border 1px solid transparent
		border-radius 4px
		padding 0 .6rem
		-webkit-app-region: no-drag;
		app-region: no-drag
		hover-transition(border-color)

		&:hover
			border-color var(--tq-color-primary)

.main
	position relative
	height 100vh

	@media (display-mode: window-controls-overlay), (display-mode: standalone)
		padding-top 0

.canvas-wrapper
	position relative
	height 100%

.canvas-grid, .canvas
	position absolute
	top 0
	left 0
	height 100%
	width 100%

.canvas-grid
	// draws dotted grid
	--axis-color var(--tq-color-pane-border)
	background-image radial-gradient(circle at 0 0, var(--dot-color) 1px, transparent 0), linear-gradient(to bottom, var(--axis-color) 1px, transparent 0), linear-gradient(to right, var(--axis-color) 1px, transparent 0)
	background-repeat repeat, repeat-x, repeat-y

.inspector-tab
	height 100%


.editor
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
@/tweeq/useAppStorage ../tweeq/Tabs
@/tweeq/FloatingPane@/tweeq/MonacoEditor@/tweeq/useAppStorage
