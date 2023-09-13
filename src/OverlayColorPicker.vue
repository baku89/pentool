<script lang="ts" setup>
import { Vec2 } from 'linearly'
import { computed, watchEffect } from 'vue'
import {
	findTextBetweenDelimiters,
	normalizeColorToHexCode,
	replaceTextBetween,
} from './utils'

interface Props {
	code: string
	cursorIndex: number
	cursorPosition: Vec2
}

const props = withDefaults(defineProps<Props>(), {
	code: '',
	cursorIndex: 0,
})

const emits = defineEmits<{
	(e: 'update:code', value: string): void
	(e: 'update:visible', value: boolean): void
}>()

const selection = computed(() => {
	// displays a color picker on pointing color strings
	const matchStringLiteral =
		findTextBetweenDelimiters(props.code, props.cursorIndex, '"', '"') ??
		findTextBetweenDelimiters(props.code, props.cursorIndex, "'", "'")

	if (matchStringLiteral && CSS.supports('color', matchStringLiteral.text)) {
		const { text } = matchStringLiteral

		const color = normalizeColorToHexCode(text)

		return {
			...matchStringLiteral,
			color,
		}
	}

	return null
})

watchEffect(() => {
	emits('update:visible', !!selection.value)
})

const style = computed(() => {
	if (!selection.value) return {} as Record<string, string>

	const [x, y] = props.cursorPosition

	return {
		visibility: 'visible',
		left: x + 'px',
		top: y + 'px',
	}
})

const color = computed(() => {
	if (!selection.value) return ''

	return selection.value.color ?? 'black'
})

function onInput(e: Event) {
	if (!selection.value) return

	const color = (e.target as HTMLInputElement).value

	const newCode = replaceTextBetween(
		props.code,
		selection.value.startIndex,
		selection.value.endIndex,
		color
	)

	emits('update:code', newCode)
}
</script>

<template>
	<input
		class="OverlayColorPicker"
		type="color"
		:style="style"
		:value="color"
		@input="onInput"
	/>
</template>

<style lang="stylus" scoped>
.OverlayColorPicker
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
