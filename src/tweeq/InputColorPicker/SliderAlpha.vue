<template>
	<div ref="sliderEl" class="SliderAlpha">
		<div class="SliderAlpha__gradient" :style="gradientStyle" />
		<button
			class="SliderAlpha__circle"
			:class="{tweaking}"
			:style="circleStyle"
		>
			<span class="SliderAlpha__circle-color" :style="circleColorStyle" />
		</button>
		<teleport to="body">
			<div v-if="tweaking" class="SliderAlpha__overlay" />
		</teleport>
	</div>
</template>

<script lang="ts">
import chroma from 'chroma-js'
import {clamp} from 'lodash'
import {computed, defineComponent, PropType, ref} from 'vue'

import useDrag from '../useDragV1'
import {RGBA} from './use-hsv'

export default defineComponent({
	name: 'SliderAlpha',
	props: {
		rgba: {
			type: Object as PropType<RGBA>,
			required: true,
		},
	},
	emits: ['partialUpdate'],
	setup(props, context) {
		const sliderEl = ref<null | HTMLElement>(null)

		const {isDragging: tweaking} = useDrag(sliderEl, {
			disableClick: true,
			onDrag({pos: [x], right, left}) {
				const a = clamp((x - left) / (right - left), 0, 1)
				context.emit('partialUpdate', {a})
			},
		})

		const cssColor = computed(() => {
			const {r, g, b} = props.rgba
			return chroma(r * 255, g * 255, b * 255).css()
		})

		const gradientStyle = computed(() => {
			const bg = cssColor.value
			return {
				background: `linear-gradient(to right, transparent 0%, ${bg} 100%)`,
			}
		})

		const circleStyle = computed(() => {
			const a = props.rgba.a

			return {
				left: `${a * 100}%`,
			}
		})

		const circleColorStyle = computed(() => {
			return {
				backgroundColor: cssColor.value,
				opacity: props.rgba.a,
			}
		})

		return {
			sliderEl,
			gradientStyle,
			circleStyle,
			circleColorStyle,
			tweaking,
		}
	},
})
</script>

<style lang="stylus">
@import './common.styl'

.SliderAlpha
	position relative
	height calc(0.7 * var(--tq-input-height))
	background-checkerboard()
	border-radius var(--tq-input-border-round)

	&__gradient
		position absolute
		width 100%
		height 100%
		border-radius var(--tq-input-border-round)

	&__circle
		circle()
		background-checkerboard()
		z-index 2
		overflow hidden

	&__circle-color
		position absolute
		top 0
		left 0
		width 100%
		height 100%

	&__overlay
		input-overlay()
		cursor none
</style>
