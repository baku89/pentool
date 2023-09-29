<script lang="ts" setup>
import {useCssVar, useElementBounding, useWindowSize} from '@vueuse/core'
import * as Bndr from 'bndr-js'
import {computed, onMounted, ref, watch} from 'vue'

import {useAppStorage} from '@/use/useAppStorage'

interface Props {
	name: string
	icon: string
}
const props = defineProps<Props>()

type FloatingWidth = number | 'fill' | 'minimized'
type FloatingHeight = number | 'fill'

const minimizeThreshold = 150
const minHeight = 200
const resizeWidth = 12

const appStorage = useAppStorage()

const width = appStorage<FloatingWidth>(`${props.name}.width`, 400)
const height = appStorage<FloatingHeight>(`${props.name}.height`, 400)

const windowSize = useWindowSize()

const classes = computed(() => {
	return {
		minimized: width.value === 'minimized',
		'w-fill': width.value === 'fill',
		'h-fill': height.value === 'fill',
	}
})

const style = computed(() => {
	const w = width.value
	const h = height.value
	return {
		width: typeof w === 'number' ? w + 'px' : '',
		height: typeof h === 'number' ? h + 'px' : '',
	}
})

const $root = ref<HTMLElement | null>(null)
const $left = ref<HTMLElement | null>(null)
const $bottom = ref<HTMLElement | null>(null)

const bound = useElementBounding($root)

watch([windowSize.width, windowSize.height], ([ww, wh]) => {
	if (typeof width.value === 'number' && width.value > ww) {
		width.value = ww
	}

	if (typeof height.value === 'number' && height.value > wh) {
		height.value = wh
	}
})

onMounted(() => {
	if (!$left.value || !$bottom.value) return

	let wOrigin = 0
	Bndr.pointer($left.value)
		.drag({pointerCapture: true, preventDefault: true})
		.on(e => {
			if (e.justStarted) {
				if (width.value === 'fill') {
					wOrigin = window.innerWidth
				} else if (width.value === 'minimized') {
					wOrigin = bound.width.value
				} else {
					wOrigin = width.value
				}
			}
			const current = wOrigin - (e.current[0] - e.start[0])

			if (current <= minimizeThreshold) {
				width.value = 'minimized'
			} else if (current >= window.innerWidth - resizeWidth) {
				width.value = 'fill'
			} else {
				width.value = current
			}
		})

	let hOrigin = 0
	const titleBarAreaHeight = useCssVar('--titlebar-area-height')
	const maxHeight = computed(
		() => windowSize.height.value - parseFloat(titleBarAreaHeight.value)
	)

	Bndr.pointer($bottom.value)
		.drag({pointerCapture: true, preventDefault: true})
		.on(e => {
			if (e.justStarted) {
				if (height.value === 'fill') {
					hOrigin = maxHeight.value
				} else {
					hOrigin = height.value
				}
			}
			const current = hOrigin + (e.current[1] - e.start[1])

			if (current >= maxHeight.value - resizeWidth) {
				height.value = 'fill'
			} else {
				height.value = Math.max(current, minHeight)
			}
		})
})
</script>

<template>
	<div ref="$root" class="FloatingPane" :class="classes" :style="style">
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

.FloatingPane
	--resize-width 2rem

	position absolute
	padding 1rem
	border 1px solid 'rgba(%s, .1)' % var(--ui-color-rgb)
	outline 'rgba(%s, .5)' % var(--ui-bg-rgb) 1px solid
	background 'rgba(%s, .95)' % var(--ui-bg-rgb)
	backdrop-filter blur(4px)
	right 0

	top calc(env(titlebar-area-y, 0px) + var(--titlebar-area-height))
	border-width 1px
	border-radius var(--ui-pane-border-radius) 0 0 var(--ui-pane-border-radius)
	display grid
	grid-template-columns 1fr
	grid-template-rows 1fr
	transition border-radius .2s ease, border-color .2s ease

	&.minimized
		width 3rem
		transition width .2s ease

		& > .minimized-title
			opacity 1
		& > .content
			opacity 0

	&.w-fill
		width 100vw
		--ui-pane-border-radius 0rem

		& > .left:before
			left calc(50% - 1px)

		& > .bottom:before
			top calc(50% + 1px)



	&.h-fill
		height calc(100vh - var(--titlebar-area-height))
		border-bottom-left-radius 0rem

		& > .bottom
			left 0

.resize
	position absolute
	transition all .2s ease

	&:before
		content ''
		position absolute
		width 100%
		height 100%
		background blue
		transition all .2s ease
		opacity 0

	&:hover:before
			opacity 1
			transition opacity .2s ease .4s

.left
	left 0
	top var(--ui-pane-border-radius)
	width var(--resize-width)
	bottom var(--ui-pane-border-radius)
	cursor col-resize
	margin-left calc(-0.5 * var(--resize-width))

	&:before
		width 5px
		left calc(50% - 2.5px)

.bottom
	left var(--ui-pane-border-radius)
	bottom 0
	right 0
	height var(--resize-width)
	cursor row-resize
	background linear-gradient(to bottom, var(--gradient))
	margin-bottom calc(-0.5 * var(--resize-width))

	&:before
		height 5px
		top calc(50% - 2.5px)

.minimized-title
	position absolute
	top 50%
	left 1.5rem
	transform translate(-50%, -50%)
	pointer-events none
	opacity 0
	transition opacity .2s ease
.content
	position relative
	height 100%
	overflow	hidden
	transition opacity .2s ease
</style>
