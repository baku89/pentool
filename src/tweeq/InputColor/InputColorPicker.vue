<script lang="ts" setup>
import {computedWithControl} from '@vueuse/core'
import chroma from 'chroma-js'

import InputColorChannelPad from './InputColorChannelPad.vue'
import InputColorChannelSlider from './InputColorChannelSlider.vue'
import InputColorChannelValues from './InputColorChannelValues.vue'
import InputColorPresets from './InputColorPresets.vue'
import {
	Channels,
	DefualtColorUI,
	hsv2rgb,
	InputColorProps,
	rgb2hsv,
} from './types'

const props = withDefaults(defineProps<InputColorProps>(), {
	ui: () => DefualtColorUI,
})

const emit = defineEmits<{
	'update:modelValue': [string]
}>()

let prevChannels: Channels = {r: 1, g: 1, b: 1, a: 1, h: 0, s: 0, v: 1}
let prevValue = ''

const channels = computedWithControl(
	() => props.modelValue,
	() => {
		if (prevValue === props.modelValue || !chroma.valid(props.modelValue)) {
			return prevChannels
		}

		const rgba = chroma(props.modelValue).rgba()

		const r = rgba[0] / 255
		const g = rgba[1] / 255
		const b = rgba[2] / 255
		const a = rgba[3]

		const hsv = rgb2hsv([r, g, b])
		let [h, s] = hsv
		const v = hsv[2]

		if (isNaN(h) || v === 0) {
			h = prevChannels.h
		}
		if (isNaN(s) || v === 0) {
			s = prevChannels.s
		}

		prevChannels = {r, g, b, a, h, s, v}

		return prevChannels
	}
)

function updateChannels(updated: Partial<Channels>) {
	let newChannels = {...channels.value, ...updated}

	const isHSV = 'h' in updated || 's' in updated || 'v' in updated
	const isRGB = 'r' in updated || 'g' in updated || 'b' in updated

	const [r, g, b] = hsv2rgb([newChannels.h, newChannels.s, newChannels.v])
	const [h, s, v] = rgb2hsv([newChannels.r, newChannels.g, newChannels.b])

	if (isHSV) {
		newChannels = {...newChannels, r, g, b}
	}

	if (isRGB) {
		newChannels = {...newChannels, h, s, v}
	}

	const newValue = chroma(
		newChannels.r * 255,
		newChannels.g * 255,
		newChannels.b * 255,
		newChannels.a
	).hex()

	prevValue = newValue
	prevChannels = newChannels

	channels.trigger()

	emit('update:modelValue', newValue)
}

// EyeDropper
const isEyeDropperSupported = 'EyeDropper' in window

async function pickColor() {
	const eyeDropper = new (window as any)['EyeDropper']()
	const newValue: string = (await eyeDropper.open()).sRGBHex

	emit('update:modelValue', newValue)
}
</script>

<template>
	<div class="InputColorPicker">
		<template v-for="(u, i) in ui">
			<InputColorChannelPad
				v-if="u[0] === 'pad'"
				:key="i"
				:channels="channels"
				:axes="u[1]"
				@updateChannels="updateChannels"
			/>
			<InputColorChannelSlider
				v-if="u[0] === 'slider'"
				:key="i"
				:channels="channels"
				:axis="u[1]"
				@updateChannels="updateChannels"
			/>
			<InputColorChannelValues
				v-if="u[0] === 'values'"
				:key="i"
				:modelValue="modelValue"
				:channels="channels"
				@update:modelValue="emit('update:modelValue', $event)"
				@updateChannels="updateChannels"
			/>
		</template>
		<InputColorPresets
			:presets="presets"
			@update:modelValue="emit('update:modelValue', $event)"
		/>
		<button v-if="isEyeDropperSupported" class="eyeDropper" @click="pickColor">
			<span class="material-symbols-outlined"> colorize </span>
		</button>
	</div>
</template>

<style lang="stylus" scoped>
@import './common.styl'

.InputColorPicker
	padding 0
	display grid
	gap var(--tq-input-gap)


.eyeDropper
	display block
	margin 0 auto
</style>
