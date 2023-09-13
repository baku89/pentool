<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { defineProps, ref, onMounted, watch } from 'vue'
import { Vec2 } from 'linearly'

interface Props {
	modelValue: string
	cursorIndex: number
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
	fetch(
		'https://raw.githubusercontent.com/brijeshb42/monaco-themes/master/themes/Tomorrow.json'
	)
		.then((res) => res.json())
		.then((data) => {
			monaco.editor.defineTheme('tomorrow', data)
			monaco.editor.setTheme('tomorrow')
		})

	// resize editor to match its parent element size
	new ResizeObserver((entries) => {
		const {
			contentRect: { width, height },
		} = entries[0]

		editor.layout({ width, height })
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
			const { top, left, height } = cursorInfo
			emits('update:cursorPosition', [left, top + height])
		}
	})

	watch(
		() => props.modelValue,
		(value) => {
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
})
</script>

<template>
	<div class="MonacoEditor" ref="$root">
		<div class="editor" ref="$editor"></div>
	</div>
</template>

<style lang="stylus" scoped></style>
