<script lang="ts" setup>
import {useCssVar, useLocalStorage} from '@vueuse/core'
import {computed, onMounted, ref} from 'vue'

interface Props {
	name: string
}

defineProps<Props>()

const width = useLocalStorage('FloatingPane.width', 400)
const height = useLocalStorage('FloatingPane.height', 400)

const virtualHeight = ref(height.value)

const style = computed(() => {
	return {
		width: width.value + 'px',
		height: height.value + 'px',
	}
})

import Bndr from 'bndr-js'
import {vec2} from 'linearly'

const $left = ref<HTMLElement | null>(null)
const $bottom = ref<HTMLElement | null>(null)

const maxHeight = computed(() => {
	return (
		window.innerHeight - parseFloat(useCssVar('--titlebar-area-height').value)
	)
})

onMounted(() => {
	if (!$left.value || !$bottom.value) return

	const leftPointer = Bndr.pointer($left.value)

	leftPointer
		.position()
		.while(leftPointer.pressed({pointerCapture: true}), true)
		.delta(vec2.sub)
		.on(([x]) => {
			width.value += x
		})

	const bottomPointer = Bndr.pointer($bottom.value)
	const bottomPointerPressed = bottomPointer.pressed({pointerCapture: true})

	bottomPointerPressed.up().on(() => {
		height.value = virtualHeight.value
	})

	bottomPointer
		.position()
		.while(bottomPointerPressed, true)
		.delta(vec2.sub)
		.on(([, y]) => {
			height.value -= y
			virtualHeight.value = Math.min(maxHeight.value, height.value)
		})
})
</script>

<template>
	<div class="FloatingPane" :style="style">
		<div ref="$left" class="resize left" />
		<div ref="$bottom" class="resize bottom" />
		<div class="content">
			<slot />
		</div>
	</div>
</template>

<style lang="stylus" scoped>

.FloatingPane
	--resize-width 1rem
	--border-radius 1.4rem

	position absolute
	padding 1rem
	border 1px solid 'rgba(%s, .1)' % var(--ui-color-rgb)
	outline 'rgba(%s, .5)' % var(--ui-bg-rgb) 1px solid
	background 'rgba(%s, .95)' % var(--ui-bg-rgb)
	backdrop-filter blur(4px)
	right 0

	top calc(env(titlebar-area-y, 0px) + var(--titlebar-area-height))
	border-width 1px 0 1px 1px
	border-radius var(--border-radius) 0 0 var(--border-radius)
	display grid
	grid-template-columns 1fr
	grid-template-rows 1fr

.resize
	position absolute
	opacity 0
	border-radius 9999px

	--gradient transparent 40%, blue 40%, blue 60%, transparent 60%

	&:hover
		opacity 1

.left
	left 0
	top var(--border-radius)
	width var(--resize-width)
	bottom var(--border-radius)
	cursor ew-resize
	transform translateX(-50%)
	background linear-gradient(to right, var(--gradient))

.bottom
	left var(--border-radius)
	bottom 0
	right 0
	height var(--resize-width)
	cursor ns-resize
	transform translateY(50%)
	background linear-gradient(to bottom, var(--gradient))

.content
	position relative
	height 100%
	overflow	hidden
</style>
