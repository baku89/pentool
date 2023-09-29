<script lang="ts" setup>
import * as Bndr from 'bndr-js'
import {type Mat2d, mat2d, vec2} from 'linearly'
import {computed, defineProps, onMounted, ref} from 'vue'

import {findTextBetweenDelimiters, replaceTextBetween} from '@/utils'

interface Props {
	code: string
	cursorIndex: number
	viewTransform: Mat2d
}

const props = withDefaults(defineProps<Props>(), {
	code: '',
	cursorIndex: 0,
})

const emits = defineEmits<{
	'update:code': [value: string]
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
			const {startIndex, endIndex} = matchBracket

			return {
				position: vec2.of(x, y),
				startIndex,
				endIndex,
			}
		}
	}

	return null
})

const style = computed(() => {
	if (!selection.value) return {} as Record<string, string>

	const {position} = selection.value

	const [x, y] = vec2.transformMat2d(position, props.viewTransform)

	return {
		visibility: 'visible',
		left: x + 'px',
		top: y + 'px',
	}
})

const $handle = ref<HTMLElement | null>(null)

const viewTransformInv = computed(() => {
	return mat2d.invert(props.viewTransform) ?? mat2d.identity
})

const zoom = computed(() => {
	return Math.sqrt(mat2d.determinant(props.viewTransform))
})

onMounted(() => {
	if (!$handle.value) return

	const pointer = Bndr.pointer($handle.value)

	pointer
		.position()
		.while(pointer.pressed({pointerCapture: true}))
		.map(pos => vec2.transformMat2d(pos, viewTransformInv.value))
		.delta((prev, curt) => vec2.sub(curt, prev))
		.on(delta => {
			if (!selection.value) return

			const [x, y] = vec2.add(selection.value.position, delta)

			const precision = Math.ceil(Math.log10(zoom.value))

			// replace the numeric literals in the code
			const text = x.toFixed(precision) + ', ' + y.toFixed(precision)

			const newCode = replaceTextBetween(
				props.code,
				selection.value.startIndex,
				selection.value.endIndex,
				text
			)

			emits('update:code', newCode)
		})
})
</script>

<template>
	<div ref="$handle" class="OverlayPointHandle" :style="style"></div>
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
