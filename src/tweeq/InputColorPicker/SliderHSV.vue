<template>
	<div class="SliderHSV">
		<div ref="padEl" class="SliderHSV__pad">
			<GlslCanvas
				class="SliderHSV__canvas"
				:fragmentString="PadFragmentString"
				:uniforms="padUniforms"
			/>
			<button
				class="SliderHSV__circle pad"
				:class="{tweaking: padTweaking}"
				:style="padCircleStyle"
			/>
		</div>
		<div ref="sliderEl" class="SliderHSV__slider">
			<GlslCanvas
				class="SliderHSV__canvas"
				:fragmentString="SliderFragmentString"
				:uniforms="sliderUniforms"
			/>
			<button
				class="SliderHSV__circle"
				:class="{tweaking: sliderTweaking}"
				:style="sliderCircleStyle"
			/>
		</div>
	</div>
	<teleport to="body">
		<div v-if="tweaking" class="SliderHSV__overlay" />
	</teleport>
</template>

<script lang="ts">
import {vec2} from 'linearly'
import {clamp} from 'lodash'
import {computed, defineComponent, PropType, ref, toRef} from 'vue'

import useDrag from '@/tweeq/useDragV1'
import {unsignedMod} from '@/tweeq/util'

import GlslCanvas from '../GlslCanvas.vue'
import PadFragmentString from './picker-hsv-pad.frag'
import SliderFragmentString from './picker-hsv-slider.frag'
import useHSV, {HSV, hsv2color, RGBA} from './use-hsv'

function modeToIndex(element: string) {
	return element === 'h' ? 0 : element === 's' ? 1 : 2
}

export default defineComponent({
	name: 'SliderHSV',
	components: {
		GlslCanvas,
	},
	props: {
		rgba: {
			type: Object as PropType<RGBA>,
			required: true,
		},
		mode: {
			type: String,
			default: 'svh',
		},
	},
	emits: ['partialUpdate'],
	setup(props, context) {
		const {hsv, hsv2rgb} = useHSV(toRef(props, 'rgba'))

		// Pad
		const padEl = ref<null | HTMLElement>(null)

		const {isDragging: padTweaking} = useDrag(padEl, {
			disableClick: true,
			onDrag({pos, top, right, bottom, left}) {
				const newHSV = {...hsv.value}

				const modes = props.mode.slice(0, 2).split('')
				const ts = vec2.invlerp([left, right], [bottom, top], pos)

				for (let i = 0; i < 2; i++) {
					const m = modes[i]
					const t = ts[i]

					if (m === 'h') {
						newHSV.h = unsignedMod(t, 1)
					} else if (m === 's') {
						newHSV.s = clamp(t, 0, 1)
					} else if (m === 'v') {
						newHSV.v = clamp(t, 0, 1)
					}
				}

				context.emit('partialUpdate', hsv2rgb(newHSV))
			},
		})

		const padCircleStyle = computed(() => {
			const x = hsv.value[props.mode[0] as keyof HSV]
			const y = hsv.value[props.mode[1] as keyof HSV]

			return {
				left: `${x * 100}%`,
				bottom: `${y * 100}%`,
				background: hsv2color(hsv.value),
			}
		})

		const padUniforms = computed(() => {
			const {h, s, v} = hsv.value
			return {
				hsv: [h, s, v],
				modeX: modeToIndex(props.mode[0]),
				modeY: modeToIndex(props.mode[1]),
			}
		})

		// Slider
		const sliderEl = ref<null | HTMLElement>(null)

		const {isDragging: sliderTweaking} = useDrag(sliderEl, {
			disableClick: true,
			onDrag({pos: [x], right, left}) {
				const mode = props.mode[2]
				const t = (x - left) / (right - left)
				const newHSV = {...hsv.value}

				if (mode === 'h') {
					newHSV.h = unsignedMod(t, 1)
				} else if (mode === 's') {
					newHSV.s = clamp(t, 0, 1)
				} else if (mode === 'v') {
					newHSV.v = clamp(t, 0, 1)
				}

				context.emit('partialUpdate', hsv2rgb(newHSV))
			},
		})

		const sliderCircleStyle = computed(() => {
			const mode = props.mode[2]
			const t = hsv.value[mode as keyof HSV]
			const bg = hsv2color(
				mode === 'h' ? {...hsv.value, s: 1, v: 1} : hsv.value
			)

			return {
				left: `${t * 100}%`,
				background: bg,
			}
		})

		const sliderUniforms = computed(() => {
			const {h, s, v} = hsv.value
			return {
				hsv: [h, s, v],
				mode: modeToIndex(props.mode[2]),
				offset: 0,
			}
		})

		// Tweaking
		const tweaking = computed(() => padTweaking.value || sliderTweaking.value)

		return {
			hsv,

			PadFragmentString,
			padEl,
			padCircleStyle,
			padUniforms,
			padTweaking,

			SliderFragmentString,
			sliderEl,
			sliderCircleStyle,
			sliderUniforms,
			sliderTweaking,

			tweaking,
		}
	},
})
</script>

<style lang="stylus">
@import './common.styl'

.SliderHSV
	&__canvas
		position absolute
		top 0
		left 0
		width 100%
		height 100%
		border-radius var(--tq-input-border-round)

	&__circle
		circle()
		z-index 1

		&.pad
			margin-bottom calc(-0.35 * var(--tq-input-height))

	&__pad
		position relative
		margin-bottom $picker-gap
		padding-top 100%
		height 0
		border-radius var(--tq-input-border-round)

	&__slider
		position relative
		height $circle-diameter

	&__overlay
		input-overlay()
		cursor none
</style>
