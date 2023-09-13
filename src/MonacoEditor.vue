<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { defineProps, ref, onMounted, watch } from 'vue'

interface Props {
	modelValue: string
	cursorPosition: number
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: '',
	cursorPosition: 0,
})

const emits = defineEmits<{
	(e: 'update:modelValue', value: string): void
	(e: 'update:cursorPosition', index: number): void
}>()

const $root = ref<HTMLElement | null>(null)
const $editor = ref<HTMLElement | null>(null)

// initialze Monaco editor
onMounted(() => {
	if (!$editor.value || !$root.value) return

	const editor = monaco.editor.create($editor.value, {
		value: props.modelValue,
		language: 'javascript',

		// make the editor look prettier

		// @ts-ignore
		'bracketPairColorization.enabled': false,
		fontLigatures: true,
		fontFamily: 'Fira Code',
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

		emits('update:cursorPosition', index)
	})

	watch(
		() => props.modelValue,
		(value) => {
			if (editor.getValue() === value) return

			editor.setValue(value)
		}
	)
})
</script>

<template>
	<div class="MonacoEditor" ref="$root">
		<div class="editor" ref="$editor"></div>
	</div>
</template>

<style lang="stylus" scoped>

.editor
	width 100%
	height 100%
</style>
