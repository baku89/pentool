<script lang="ts" setup>
import {scalar} from 'linearly'
import {computed, ref} from 'vue'

import useDrag from '@/tweeq/useDragV1'

import GlslCanvas from '../GlslCanvas.vue'
import {unsignedMod} from '../util'
import SliderFragmentString from './slider.frag'
import {Channels, ColorChannel, colorChannelToIndex} from './types'

interface Props {
	axis: ColorChannel
	channels: Channels
}

const props = defineProps<Props>()

const emit = defineEmits<{
	updateChannels: [Partial<Channels>]
}>()

const $root = ref<null | HTMLElement>(null)

const {isDragging: sliderTweaking} = useDrag($root, {
	disableClick: true,
	onDrag({pos: [x], right, left}) {
		let ch = scalar.invlerp(left, right, x)

		if (props.axis === 'h') {
			ch = unsignedMod(ch, 1)
		} else {
			ch = scalar.clamp(ch, 0, 1)
		}

		emit('updateChannels', {[props.axis]: ch})
	},
})

const uniforms = computed(() => {
	const {a, h, s, v} = props.channels
	return {
		hsva: [h, s, v, a],
		axis: colorChannelToIndex(props.axis),
		offset: 0,
	}
})

const circleStyle = computed(() => {
	const t = props.channels[props.axis]
	const {r, g, b} = props.channels

	const background = `rgba(${r * 255}, ${g * 255}, ${b * 255})`

	return {
		left: `${t * 100}%`,
		background,
		cursor: sliderTweaking.value ? 'none' : undefined,
	}
})
</script>

<template>
	<div ref="$root" class="InputColorChannelSlider">
		<GlslCanvas
			class="canvas"
			:fragmentString="SliderFragmentString"
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

.InputColorChannelSlider
	position relative
	width 100%
	height calc(0.7 * var(--tq-input-height))

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
