<script setup lang="ts">
import {useColorMode} from '@vueuse/core'
import {Vec2} from 'linearly'
import * as monaco from 'monaco-editor'
import Tomorrow from 'monaco-themes/themes/Tomorrow.json'
import TomorrowNight from 'monaco-themes/themes/Tomorrow-Night.json'
import {defineProps, onMounted, ref, watch, watchEffect} from 'vue'

export interface ErrorInfo {
	message: string
	line: number
	column: number
}

interface Props {
	modelValue: string
	cursorIndex: number
	errors: ErrorInfo[] | null
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: '',
	cursorIndex: 0,
})

const emits = defineEmits<{
	(e: 'update:modelValue', value: string): void
	(e: 'update:cursorIndex', value: number): void
	(e: 'update:cursorPosition', value: Vec2): void
}>()

const $root = ref<HTMLElement | null>(null)
const $editor = ref<HTMLElement | null>(null)

// initialze Monaco editor
onMounted(() => {
	if (!$editor.value || !$root.value) return

	// get the font size of the root element
	const fontSize = parseFloat(
		window.getComputedStyle($root.value).fontSize ?? '16'
	)

	// Initialize the editor
	const editor = monaco.editor.create($editor.value, {
		value: props.modelValue,
		language: 'javascript',

		// make the editor look prettier

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		'bracketPairColorization.enabled': false,
		fontLigatures: true,
		fontFamily: 'Fira Code',
		fontSize,
		folding: false,
		lineNumbers: 'off',
		lineDecorationsWidth: 0,
		lineNumbersMinChars: 0,
		minimap: {
			enabled: false,
		},
		overviewRulerLanes: 0,
		renderIndentGuides: false,
		renderLineHighlight: 'none',
		scrollBeyondLastLine: false,
		scrollbar: {
			horizontalSliderSize: 2,
			useShadows: false,
			verticalSliderSize: 2,
			verticalScrollbarSize: 2,
		},
		tabSize: 2,
	})

	// fetch the theme file and apply to the editor
	monaco.editor.defineTheme('light', Tomorrow as any)
	monaco.editor.defineTheme('dark', TomorrowNight as any)

	const colorMode = useColorMode()
	watchEffect(() => {
		monaco.editor.setTheme(colorMode.value === 'dark' ? 'dark' : 'light')
	})

	// resize editor to match its parent element size
	new ResizeObserver(entries => {
		const {
			contentRect: {width, height},
		} = entries[0]

		editor.layout({width, height})
	}).observe($root.value)

	// allow ES5 JavaScript linting
	const options =
		monaco.languages.typescript.javascriptDefaults.getCompilerOptions()
	options.noLib = true
	options.target = monaco.languages.typescript.ScriptTarget.ES5
	options.lib = ['es6']

	// run the code on change
	editor.getModel()?.onDidChangeContent(() => {
		emits('update:modelValue', editor.getValue())
	})

	editor.onDidChangeCursorPosition(() => {
		const position = editor.getPosition()

		if (!position) return

		// Convert monaco editor's position to character-based index
		const index = editor.getModel()?.getOffsetAt(position) ?? 0
		emits('update:cursorIndex', index)

		// Convert monaco editor's position to pixel-based position
		const cursorInfo = editor.getScrolledVisiblePosition(position)
		if (cursorInfo) {
			const {top, left, height} = cursorInfo
			emits('update:cursorPosition', [left, top + height])
		}
	})

	watch(
		() => props.modelValue,
		value => {
			if (editor.getValue() === value) return

			const model = editor.getModel()
			if (!model) return

			editor.pushUndoStop()

			editor.executeEdits('name-of-edit', [
				{
					range: model.getFullModelRange(),
					text: value,
				},
			])
			editor.pushUndoStop()
		}
	)

	watch(
		() => props.cursorIndex,
		value => {
			const prevPosition = editor.getPosition()
			const position = editor.getModel()?.getPositionAt(value)
			if (!prevPosition || !position || position.equals(prevPosition)) {
				return
			}

			editor.setPosition(position)
		}
	)

	watch(
		() => props.errors,
		errors => {
			const model = editor.getModel()
			if (!model) return

			// Add error decorations to monaco editor
			monaco.editor.setModelMarkers(
				model,
				'my-source',
				(errors ?? []).map(error => ({
					message: error.message,
					severity: monaco.MarkerSeverity.Error,
					startLineNumber: error.line,
					endLineNumber: error.line,
					startColumn: error.column,
					endColumn: error.column,
				}))
			)
		}
	)
})
</script>

<template>
	<div ref="$root" class="MonacoEditor">
		<div ref="$editor" class="editor"></div>
	</div>
</template>

<style lang="stylus" scoped>
:deep(.monaco-editor)
	--vscode-editor-background: transparent
</style>
