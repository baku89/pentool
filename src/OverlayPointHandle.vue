<script lang="ts" setup>
import { defineProps, computed, ref } from 'vue'
import { findTextBetweenDelimiters, replaceTextBetween } from './utils'

interface Props {
	code: string
	cursorIndex: number
}

const props = withDefaults(defineProps<Props>(), {
	code: '',
	cursorIndex: 0,
})

const emits = defineEmits<{
	(e: 'update:code', value: string): void
}>()

const selection = computed(() => {
	// show point handle
	const matchBrackets = [
		findTextBetweenDelimiters(props.code, props.cursorIndex, '[', ']'),
		findTextBetweenDelimiters(props.code, props.cursorIndex, '(', ')'),
	].filter(Boolean) as Array<
		Exclude<ReturnType<typeof findTextBetweenDelimiters>, null>
	>

	for (const matchBracket of matchBrackets) {
		const reg2DCoord = /^\s*([+-.\d]+)\s*,\s*([+-.\d]+)\s*$/
		const match2DCoord = reg2DCoord.exec(matchBracket.text)

		if (match2DCoord) {
			const [x, y] = match2DCoord.slice(1, 3).map(parseFloat)
			const { startIndex, endIndex } = matchBracket

			return {
				x,
				y,
				startIndex,
				endIndex,
			}
		}
	}

	return null
})

const style = computed(() => {
	if (!selection.value) return {} as Record<string, string>

	const { x, y } = selection.value

	return {
		visibility: 'visible',
		left: x + 'px',
		top: y + 'px',
	}
})

const $handle = ref<HTMLElement | null>(null)

let prevX: number, prevY: number

function onPointerdown(e: PointerEvent) {
	prevX = e.clientX
	prevY = e.clientY

	$handle.value?.setPointerCapture(e.pointerId)
	$handle.value?.addEventListener('pointermove', onPointermove)
}

function onPointermove(e: PointerEvent) {
	if (!selection.value) return

	const x = selection.value.x + e.clientX - prevX
	const y = selection.value.y + e.clientY - prevY

	prevX = e.clientX
	prevY = e.clientY

	// replace the numeric literals in the code
	const text = x.toFixed(0) + ', ' + y.toFixed(0)

	const newCode = replaceTextBetween(
		props.code,
		selection.value.startIndex,
		selection.value.endIndex,
		text
	)

	emits('update:code', newCode)
}

function onPointerup(e: PointerEvent) {
	$handle.value?.releasePointerCapture(e.pointerId)
	$handle.value?.removeEventListener('pointermove', onPointermove)
}
</script>

<template>
	<div
		class="OverlayPointHandle"
		@pointerdown="onPointerdown"
		@pointerup="onPointerup"
		ref="$handle"
		:style="style"
	></div>
</template>

<style lang="stylus" scoped>
.OverlayPointHandle
	position absolute
	visibility hidden
	margin -8px 0 0 -8px
	width 17px
	height 17px
	outline 1px solid rgba(255, 255, 255, 0.5)
	border 1px solid var(--ui-accent)
	border-radius 50%
	background var(--ui-bg)

	&:before
		content ''
		position absolute
		inset -10px
		border-radius 50%

	&:hover
		background var(--ui-accent)
</style>
