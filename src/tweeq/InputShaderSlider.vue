<template>
	<div ref="sliderEl" class="InputShaderSlider">
		<GlslCanvas
			class="InputShaderSlider__slider-shader"
			:fragmentString="sliderFragmentString"
			:uniforms="uniforms"
		/>
		<button
			class="InputShaderSlider__knob"
			:class="{tweaking}"
			:style="circleStyle"
		>
			<GlslCanvas
				class="InputShaderSlider__knob-shader"
				:uniforms="uniforms"
				:fragmentString="knobFragmentString"
			/>
		</button>
		<teleport to="body">
			<div v-if="tweaking" class="InputShaderSlider__overlay" />
		</teleport>
	</div>
</template>

<script lang="ts">
import {clamp} from 'lodash'
import {computed, defineComponent, PropType, ref} from 'vue'

import useDrag from '@/tweeq/useDragV1'

import GlslCanvas from '../layouts/GlslCanvas.vue'

interface UniformsProp {
	[name: string]: number[] | string
}

export default defineComponent({
	name: 'InputShaderSlider',
	components: {
		GlslCanvas,
	},
	props: {
		modelValue: {
			type: Number,
			required: true,
		},
		uniforms: {
			type: Object as PropType<UniformsProp>,
			default: () => ({}),
		},
		knobFragmentString: {
			type: String,
			required: true,
		},
		sliderFragmentString: {
			type: String,
			required: true,
		},
	},
	setup(props, context) {
		const sliderEl = ref<null | HTMLElement>(null)

		const {isDragging: tweaking} = useDraggable(sliderEl, {
			disableClick: true,
			onDrag({pos: [x], right, left}) {
				const v = clamp((x - left) / (right - left), 0, 1)

				context.emit('update:modelValue', v)
			},
		})

		const circleStyle = computed(() => {
			const v = props.modelValue

			return {
				left: `${v * 100}%`,
			}
		})

		return {
			sliderEl,
			circleStyle,
			tweaking,
		}
	},
})
</script>

<style lang="stylus">
@import './InputColorPicker/common.styl'

$circle-diameter = 0.7 * var(--tq-input-height)
$circle-radius = 0.5 * $circle-diameter

.InputShaderSlider
	position relative
	height $circle-diameter
	border-radius var(--tq-input-border-round)

	&__slider-shader
		position absolute
		width 100%
		height 100%
		border-radius var(--tq-input-border-round)

	&__knob
		circle()
		z-index 2
		overflow hidden

	&__knob-shader
		position absolute
		top 0
		left 0
		width 100%
		height 100%
		border-radius var(--tq-input-border-round)

	&__overlay
		input-overlay()
		cursor none
</style>
