<script lang="ts" setup>
import {useCssVar, useElementBounding, useWindowSize} from '@vueuse/core'
import * as Bndr from 'bndr-js'
import {computed, onMounted, ref, watch} from 'vue'

import {useAppStorage} from '../useAppStorage'

type PaneDimension = number | 'minimized'

type Position =
	| {anchor: 'maximized'}
	| {anchor: 'top'; height: PaneDimension}
	| {anchor: 'left-top'; width: PaneDimension; height: PaneDimension}
	| {anchor: 'left'; width: PaneDimension}
	| {anchor: 'left-bottom'; width: PaneDimension; height: PaneDimension}
	| {anchor: 'bottom'; height: PaneDimension}
	| {anchor: 'right-bottom'; width: PaneDimension; height: PaneDimension}
	| {anchor: 'right'; width: PaneDimension}
	| {anchor: 'right-top'; width: PaneDimension; height: PaneDimension}

interface Props {
	name: string
	icon: string
	position?: Position
}
const props = withDefaults(defineProps<Props>(), {
	position: () => {
		return {
			anchor: 'right-top',
			width: 400,
			height: 400,
		}
	},
})

const minimizeThreshold = 90
const resizeWidth = 12

const appStorage = useAppStorage()

const position = appStorage<Position>(`${props.name}.position`, props.position)

const windowSize = useWindowSize()

const classes = computed(() => {
	const p = position.value
	return {
		'anchor-maximized': p.anchor === 'maximized',
		'anchor-top': p.anchor.includes('top'),
		'anchor-right': p.anchor.includes('right'),
		'anchor-bottom': p.anchor.includes('bottom'),
		'anchor-left': p.anchor.includes('left'),
		'w-minimized': 'width' in p && p.width === 'minimized',
		'h-minimized': 'height' in p && p.height === 'minimized',
	}
})

const style = computed(() => {
	const w = 'width' in position.value ? position.value.width : null
	const h = 'height' in position.value ? position.value.height : null
	return {
		width: typeof w === 'number' ? w + 'px' : '',
		height: typeof h === 'number' ? h + 'px' : '',
	}
})

const $root = ref<HTMLElement | null>(null)
const $top = ref<HTMLElement | null>(null)
const $right = ref<HTMLElement | null>(null)
const $left = ref<HTMLElement | null>(null)
const $bottom = ref<HTMLElement | null>(null)

const bound = useElementBounding($root)

watch([windowSize.width, windowSize.height], ([ww, wh]) => {
	const p = position.value

	if ('width' in p && typeof p.width === 'number' && p.width > ww) {
		position.value = {...p, width: ww}
	}

	if ('height' in p && typeof p.height === 'number' && p.height > wh) {
		position.value = {...p, height: wh}
	}
})

onMounted(() => {
	if (!$top.value || !$right.value || !$left.value || !$bottom.value) return

	Bndr.pointer($left.value)
		.drag({pointerCapture: true, preventDefault: true})
		.on(e => onDragHoriz(e, true))

	Bndr.pointer($right.value)
		.drag({pointerCapture: true, preventDefault: true})
		.on(e => onDragHoriz(e, false))

	let widthAtDragStart = 0

	function onDragHoriz(e: Bndr.DragData, isLeft: boolean) {
		const p = position.value

		if (e.justStarted) {
			widthAtDragStart = bound.width.value
		}

		const dir = isLeft ? -1 : 1
		const current = Math.round(
			widthAtDragStart + (e.current[0] - e.start[0]) * dir
		)

		if (current <= minimizeThreshold) {
			if ('width' in p) {
				position.value = {...p, width: 'minimized'}
			}
		} else if (current >= window.innerWidth - resizeWidth) {
			if (p.anchor === 'right' || p.anchor === 'left') {
				position.value = {anchor: 'maximized'}
			} else if (p.anchor === 'right-top' || p.anchor === 'left-top') {
				position.value = {anchor: 'top', height: p.height}
			} else if (p.anchor === 'right-bottom' || p.anchor === 'left-bottom') {
				position.value = {anchor: 'bottom', height: p.height}
			}
		} else if ('width' in p) {
			position.value = {...p, width: current}
		} else {
			const opposite = isLeft ? 'right' : 'left'
			if (p.anchor === 'maximized') {
				position.value = {
					anchor: opposite,
					width: current,
				}
			} else if (p.anchor === 'top' || p.anchor === 'bottom') {
				position.value = {
					anchor: `${opposite}-${p.anchor}` as any,
					width: current,
					height: p.height,
				}
			}
		}
	}

	let heightAtDragStart = 0

	const maxHeight = computed(() => {
		return (
			windowSize.height.value -
			parseFloat(useCssVar('--titlebar-area-height').value)
		)
	})

	Bndr.pointer($top.value)
		.drag({pointerCapture: true, preventDefault: true})
		.on(e => onDragVert(e, true))

	Bndr.pointer($bottom.value)
		.drag({pointerCapture: true, preventDefault: true})
		.on(e => onDragVert(e, false))

	function onDragVert(e: Bndr.DragData, isTop: boolean) {
		const p = position.value

		if (e.justStarted) {
			heightAtDragStart = bound.height.value
		}

		const dir = isTop ? -1 : 1
		const current = Math.round(
			heightAtDragStart + (e.current[1] - e.start[1]) * dir
		)

		if (current <= minimizeThreshold) {
			if ('height' in p) {
				position.value = {...p, height: 'minimized'}
			}
		} else if (current >= maxHeight.value - resizeWidth) {
			if (p.anchor === 'top' || p.anchor === 'bottom') {
				position.value = {anchor: 'maximized'}
			} else if (p.anchor === 'right-top' || p.anchor === 'right-bottom') {
				position.value = {anchor: 'right', width: p.width}
			} else if (p.anchor === 'left-top' || p.anchor === 'left-bottom') {
				position.value = {anchor: 'left', width: p.width}
			}
		} else if ('height' in p) {
			position.value = {...p, height: current}
		} else {
			const opposite = isTop ? 'bottom' : 'top'
			if (p.anchor === 'maximized') {
				position.value = {
					anchor: opposite,
					height: current,
				}
			} else if (p.anchor === 'right' || p.anchor === 'left') {
				position.value = {
					anchor: `${p.anchor}-${opposite}` as any,
					width: p.width,
					height: current,
				}
			}
		}
	}
})
</script>

<template>
	<div ref="$root" class="FloatingPane" :class="classes" :style="style">
		<div ref="$top" class="resize top" />
		<div ref="$right" class="resize right" />
		<div ref="$left" class="resize left" />
		<div ref="$bottom" class="resize bottom" />
		<span class="minimized-title material-symbols-outlined">
			{{ icon }}
		</span>
		<div class="content">
			<slot />
		</div>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.FloatingPane
	pane()
	--resize-width 1rem
	--border 5px

	--br-top-left var(--tq-pane-border-radius)
	--br-top-right var(--tq-pane-border-radius)
	--br-bottom-right var(--tq-pane-border-radius)
	--br-bottom-left var(--tq-pane-border-radius)

	position fixed
	padding 12px
	border-width 1px
	border-radius var(--br-top-left) var(--br-top-right) var(--br-bottom-right) var(--br-bottom-left)
	display grid
	grid-template-columns 1fr
	grid-template-rows 1fr
	hover-transition(border-radius, border-color)
	z-index 101
	top var(--app-margin-top)
	right 0
	bottom 0
	left 0

	&:has(.resize:hover)
		border-color var(--tq-color-primary)

	&.anchor-maximized
		--br-bottom-right 0px
		--br-bottom-left 0px

	&.anchor-left
		--br-top-left 0px
		--br-bottom-left 0px
		border-left-color transparent !important

	&.anchor-right
		--br-top-right 0px
		--br-bottom-right 0px
		border-right-color transparent !important

	&.anchor-bottom
		--br-bottom-left 0px
		--br-bottom-right 0px
		border-bottom-color transparent !important

	&.w-minimized, &.h-minimized
		background var(--tq-color-primary-container)
		hover-transition(width, height, background)

		.minimized-title
			opacity 1
		.content
			opacity 0

	&.w-minimized
		width 4rem

	&.h-minimized
		height 4rem

	&.anchor-top
		bottom unset

		.top
			display none

	&.anchor-right
		left unset

		.right
			display none

	&.anchor-bottom
		top unset

		.bottom
			display none

	&.anchor-left
		right unset

		.left
			display none

.resize
	position absolute
	hover-transition()

	&:before
		content ''
		position absolute
		width 100%
		height 100%
		background var(--tq-color-primary)
		hover-transition()
		opacity 0

	&:hover:before
			opacity 1
			transition opacity var(--tq-hover-transition-duration) ease


.top, .bottom
	cursor row-resize
	height var(--resize-width)

	&:before
		height var(--border)

.top
	left var(--br-top-left)
	right var(--br-top-right)
	top calc(-0.5 * var(--resize-width))
	&:before
		top calc(50%)
.bottom
	left var(--br-bottom-left)
	right var(--br-bottom-right)
	bottom calc(-0.5 * var(--resize-width))
	&:before
		bottom calc(50%)

.left, .right
	width var(--resize-width)
	cursor col-resize

	&:before
		width var(--border)

.left
	top var(--br-top-left)
	bottom var(--br-bottom-left)
	left calc(-0.5 * var(--resize-width))
	&:before
		left calc(50%)

.right
	top var(--br-top-right)
	bottom var(--br-bottom-right)
	right calc(-0.5 * var(--resize-width))
	&:before
		right calc(50%)

.minimized-title
	position absolute
	top 50%
	left 50%
	transform translate(-50%, -50%)
	pointer-events none
	opacity 0
	color var(--tq-color-on-primary-container)
	hover-transition(opacity)

.content
	position relative
	height 100%
	hover-transition(opacity)
</style>
