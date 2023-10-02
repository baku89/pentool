<script lang="ts" setup>
import {useMagicKeys} from '@vueuse/core'
import chroma from 'chroma-js'
import {vec2} from 'linearly'
import {clamp} from 'lodash'
import {computed, ref} from 'vue'

import GlslCanvas from '../GlslCanvas.vue'
import Popover from '../Popover.vue'
import useDraggable from '../useDragV1'
import {unsignedMod} from '../util'
import InputColorPicker from './InputColorPicker.vue'
import PadFragmentString from './pad.frag'
import SliderFragmentString from './slider.frag'
import {colorChannelToIndex, hsv2rgb, InputColorProps, rgb2hsv} from './types'

const props = withDefaults(defineProps<InputColorProps>(), {})

const emit = defineEmits<{
	'update:modelValue': [string]
}>()

const $button = ref<HTMLElement | null>(null)
const open = ref(false)

const {shift, alt} = useMagicKeys()
const tweakMode = computed(() => {
	return shift.value ? 'hue' : alt.value ? 'alpha' : 'pad'
})

const tweakChannels = ref({h: 0, s: 0, v: 0, a: 0})

const tweakWidth = 300

function getHSVA() {
	if (!chroma.valid(props.modelValue)) {
		return {h: 0, s: 0, v: 0, a: 1}
	}

	const rgba = chroma(props.modelValue).rgba()
	const [r, g, b, a] = rgba
	const hsv = rgb2hsv([r / 255, g / 255, b / 255])

	if (isNaN(hsv[0])) {
		hsv[0] = 0
	}
	if (isNaN(hsv[1])) {
		hsv[1] = 0
	}

	return {h: hsv[0], s: hsv[1], v: hsv[2], a: a}
}

const {origin, isDragging: tweaking} = useDraggable($button, {
	lockPointer: true,
	onClick() {
		open.value = !open.value
	},
	onDragStart() {
		tweakChannels.value = getHSVA()
	},
	onDrag({delta}) {
		const [dx, dy] = vec2.div(delta, [tweakWidth, -tweakWidth])

		let dh = 0,
			ds = 0,
			dv = 0,
			da = 0

		if (tweakMode.value === 'hue') {
			dh -= dx
		} else if (tweakMode.value === 'alpha') {
			da -= dx
		} else {
			ds -= dx
			dv -= dy
		}

		let {h, s, v, a} = tweakChannels.value
		h = unsignedMod(h + dh, 1)
		s = clamp(s + ds, 0, 1)
		v = clamp(v + dv, 0, 1)
		a = clamp(a + da, 0, 1)

		tweakChannels.value = {h, s, v, a}

		const [r, g, b] = hsv2rgb([h, s, v])

		const newValue = chroma(r * 255, g * 255, b * 255, a).hex()

		emit('update:modelValue', newValue)
	},
})

const tweakPreviewStyle = computed(() => {
	let color = chroma.valid(props.modelValue)
		? chroma(props.modelValue)
		: chroma('black')

	if (tweakMode.value !== 'alpha') {
		color = color.alpha(1)
	}

	return {background: color.css()}
})

const padStyle = computed(() => {
	return {
		left: `${origin.value[0] - tweakChannels.value.s * tweakWidth}px`,
		top: `${origin.value[1] - (1 - tweakChannels.value.v) * tweakWidth}px`,
	}
})

const padUniforms = computed(() => {
	const {h, s, v, a} = tweakChannels.value
	return {
		hsva: [h, s, v, a],
		axes: [colorChannelToIndex('s'), colorChannelToIndex('v')],
	}
})

const tweakUIOffset = computed(() => {
	return {
		left: `${origin.value[0]}px`,
		top: `${origin.value[1]}px`,
	}
})

const sliderAlphaStyle = computed(() => {
	return {
		left: `${origin.value[0] - (tweakChannels.value.a - 0.5) * tweakWidth}px`,
		top: `${origin.value[1]}px`,
	}
})

const sliderHueUniforms = computed(() => {
	const {h, s, v, a} = tweakChannels.value
	return {
		hsva: [h, s, v, a],
		axis: colorChannelToIndex('h'),
		offset: h + 0.5,
	}
})
</script>

<template>
	<button
		ref="$button"
		class="InputColor"
		:class="{open, tweaking}"
		v-bind="$attrs"
		@click="open = true"
	>
		<div class="preview" :style="{background: modelValue}" />
	</button>
	<Popover v-model:open="open" :reference="$button" placement="bottom-start">
		<div class="floating">
			<InputColorPicker
				:modelValue="modelValue"
				:ui="ui"
				:presets="presets"
				@update:modelValue="emit('update:modelValue', $event)"
			/>
		</div>
	</Popover>
	<teleport to="body">
		<div
			v-if="tweaking"
			class="InputColor__overlay"
			:class="{'tweaking-slider': tweakMode !== 'pad'}"
		>
			<GlslCanvas
				class="pad"
				:class="{show: tweakMode === 'pad'}"
				:fragmentString="PadFragmentString"
				:uniforms="padUniforms"
				:style="padStyle"
			/>
			<GlslCanvas
				class="slider hue"
				:class="{show: tweakMode == 'hue'}"
				:fragmentString="SliderFragmentString"
				:uniforms="sliderHueUniforms"
				:style="tweakUIOffset"
			/>
			<div
				class="slider alpha"
				:class="{show: tweakMode == 'alpha'}"
				:style="sliderAlphaStyle"
			>
				<div
					class="alpha-gradient"
					:style="{
						background: `linear-gradient(to right, transparent, ${props.modelValue})`,
					}"
				/>
			</div>
		</div>
		<button
			class="tweak-preview"
			:style="tweakUIOffset"
			:class="{tweaking, checkerboard: tweakMode == 'alpha'}"
		>
			<div class="preview" :style="tweakPreviewStyle" />
		</button>
	</teleport>
</template>

<style lang="stylus" scoped>
@import './common.styl'
.InputColor
	position relative
	width var(--tq-input-height)
	height var(--tq-input-height)
	border-radius var(--tq-input-border-radius)
	hover-transition(background)
	background-checkerboard()
	hover-transition(box-shadow)
	overflow hidden

	&:hover, &.tweaking
		box-shadow 0 0 0 1px var(--tq-color-primary)

.preview
	display block
	position absolute
	inset 0

.floating
	width var(--tq-popup-width)
	padding var(--tq-popup-padding)
	border 1px solid var(--tq-color-pane-border)
	border-radius var(--tq-popup-border-radius)
	position relative
	box-shadow 0 0 20px -15px var(--tq-color-shadow)

.pad, .slider
	z-index 200
	position fixed
	border-radius var(--tq-input-border-radius)
	width 300px
	opacity 0
	overflow hidden
	hover-transition(opacity)

	&.show
		opacity 1

.pad
	position absolute
	aspect-ratio 1
	background red

.slider
	height calc(0.7 * var(--tq-input-height))
	transform translate(-50%, -50%)

	&.hue
		-webkit-mask linear-gradient(to right, transparent 5%, black 30%, black 70%, transparent 95%)

	&.alpha
		background-checkerboard()

.alpha-gradient
	position absolute
	top 0
	left 0
	width 100%
	height 100%

.tweak-preview


	z-index 200
	position fixed
	border-radius var(--tq-input-border-radius)
	overflow hidden
	width var(--tq-input-height)
	height var(--tq-input-height)
	margin calc(var(--tq-input-height) / -2) 0 0 calc(var(--tq-input-height) / -2)
	pointer-events none
	opacity 0
	transition transform var(--tq-hover-transition-duration) ease, border-radius var(--tq-hover-transition-duration) ease, opacity 0s ease var(--tq-hover-transition-duration)

	&.tweaking
		transition transform var(--tq-hover-transition-duration) ease, border-radius var(--tq-hover-transition-duration) ease
		opacity 1
		transform scale(3)
		border-radius calc(var(--tq-input-height) / 2)

	&.checkerboard
		background-checkerboard()
</style>
