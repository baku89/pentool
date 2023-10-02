<script lang="ts" setup>
import {scalar, vec2} from 'linearly'
import {computed, ref} from 'vue'

import useDrag from '@/tweeq/useDragV1'

import GlslCanvas from '../GlslCanvas.vue'
import {unsignedMod} from '../util'
import FragmentString from './pad.frag'
import {Channels, ColorChannel, colorChannelToIndex} from './types'

interface Props {
	axes: [ColorChannel, ColorChannel]
	channels: Channels
}

const props = defineProps<Props>()

const emit = defineEmits<{
	updateChannels: [Partial<Channels>]
}>()

const $root = ref<null | HTMLElement>(null)

const {isDragging: sliderTweaking} = useDrag($root, {
	disableClick: true,
	onDrag({pos, right, left, bottom, top}) {
		const chs = [...vec2.invlerp([left, bottom], [right, top], pos)]

		for (let i = 0; i < 2; i++) {
			if (props.axes[i] === 'h') {
				chs[i] = unsignedMod(chs[i], 1)
			} else {
				chs[i] = scalar.clamp(chs[i], 0, 1)
			}
		}

		const newChannel: Partial<Channels> = {
			[props.axes[0]]: chs[0],
			[props.axes[1]]: chs[1],
		}

		emit('updateChannels', newChannel)
	},
})

const uniforms = computed(() => {
	const {h, s, v, a} = props.channels
	return {
		hsva: [h, s, v, a],
		axes: props.axes.map(colorChannelToIndex),
	}
})

const circleStyle = computed(() => {
	const x = props.channels[props.axes[0]]
	const y = props.channels[props.axes[1]]
	const {r, g, b} = props.channels

	const background = `rgba(${r * 255}, ${g * 255}, ${b * 255})`

	return {
		left: `${x * 100}%`,
		bottom: `${y * 100}%`,
		background,
		cursor: sliderTweaking.value ? 'none' : undefined,
	}
})
</script>

<template>
	<div ref="$root" class="InputColorChannelPad">
		<GlslCanvas
			class="canvas"
			:fragmentString="FragmentString"
			:uniforms="uniforms"
		/>
		<button
			class="circle"
			:class="{tweaking: sliderTweaking}"
			:style="circleStyle"
		/>
	</div>
</template>

<style lang="stylus" scoped>
@import './common.styl'

.InputColorChannelPad
	position relative
	width 100%
	aspect-ratio 1

.canvas
	position absolute
	width 100%
	height 100%
	border-radius var(--tq-input-border-radius)
	background red
	background-checkerboard()

.circle
	circle()
	z-index 1
</style>
