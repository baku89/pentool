<script lang="ts" setup>
import {Vec2} from 'linearly'
import {computed} from 'vue'

import {findNumericLiteralAtColumn, replaceTextBetween} from '@/utils'

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
	'update:code': [value: string]
	'update:cursorIndex': [value: number]
}>()

const selection = computed(() => {
	// displays a color picker on pointing color strings
	return findNumericLiteralAtColumn(props.code, props.cursorIndex)
})

const style = computed(() => {
	if (!selection.value) return {} as Record<string, string>

	const [x, y] = props.cursorPosition

	return {
		visibility: 'visible',
		left: x + 'px',
		top: y + 'px',
		backgroundPosition: `${Math.round(-selection.value.value)}px 50%`,
	}
})

function onPointerdown(e: PointerEvent) {
	const target = e.target as HTMLElement
	target.requestPointerLock()

	target.addEventListener('pointermove', onPointermove)
}

function onPointermove(e: PointerEvent) {
	if (!selection.value) return

	const {precision, startIndex, endIndex, isUnsigned} = selection.value

	const dx = e.movementX
	const delta = -dx * Math.pow(10, -precision)

	let value = selection.value.value + delta

	if (isUnsigned) {
		value = Math.max(0, value)
	}

	const code = replaceTextBetween(
		props.code,
		startIndex,
		endIndex,
		(isUnsigned ? '+' : '') + value.toFixed(precision)
	)

	emits('update:cursorIndex', selection.value.startIndex)
	emits('update:code', code)
}

function onPointerup(e: PointerEvent) {
	const target = e.target as HTMLElement
	target.removeEventListener('pointermove', onPointermove)

	document.exitPointerLock()
}
</script>

<template>
	<div
		class="OverlayNumericSlider"
		:style="style"
		@pointerdown="onPointerdown"
		@pointerup="onPointerup"
	/>
</template>

<style lang="stylus" scoped>
.OverlayNumericSlider
	position absolute
	visibility hidden
	transform translateX(-50%)
	width 8rem
	height 1.6rem
	background var(--ui-button)
	border-radius 9999px
	cursor col-resize

	background-image linear-gradient(to right, var(--ui-color) 4%, transparent 4%)
	background-size 25px 40%
	background-repeat repeat-x
</style>
./utils
