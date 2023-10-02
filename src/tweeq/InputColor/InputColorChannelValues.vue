<script setup lang="ts">
import chroma from 'chroma-js'
import {computed, ref} from 'vue'

import InputDropdown from '../InputDropdown.vue'
import InputNumber from '../InputNumber'
import InputString from '../InputString'
import {Channels, ColorChannel, ColorSpace} from './types'

interface Props {
	modelValue: string
	channels: Channels
	hasAlpha?: boolean
}

const props = withDefaults(defineProps<Props>(), {hasAlpha: true})

const emit = defineEmits<{
	'update:modelValue': [string]
	updateChannels: [Partial<Channels>]
}>()

const colorSpace = ref<ColorSpace>('hsv')

const r = computed(() => props.channels.r * 255)
const g = computed(() => props.channels.g * 255)
const b = computed(() => props.channels.b * 255)
const a = computed(() => props.channels.a * 100)

const h = computed(() => props.channels.h * 360)
const s = computed(() => props.channels.s * 100)
const v = computed(() => props.channels.v * 100)

function onUpdateChannel(channel: ColorChannel, value: number) {
	let max = 255

	if (channel === 'h') {
		max = 360
	} else if (channel === 'a' || channel === 's' || channel === 'v') {
		max = 100
	}

	emit('updateChannels', {[channel]: value / max})
}

const colorCode = computed(() => {
	if (props.modelValue.startsWith('#')) {
		return props.modelValue.slice(1).toUpperCase()
	}

	return props.modelValue
})

function colorCodeValidator(value: string) {
	if (value.startsWith('0x')) {
		value = value.slice(2)
	}

	if (chroma.valid(value)) {
		return value
	} else if (chroma.valid(`#${value}`)) {
		return `#${value}`
	} else if (/^[0-9a-f]$/.test(value)) {
		return `#${value.repeat(6)}`
	}
	return undefined
}
</script>

<template>
	<div class="InputColorChannelValues">
		<InputDropdown
			v-model="colorSpace"
			theme="minimal"
			:options="['rgb', 'hsv', 'hex']"
			:labelizer="s => s.toUpperCase()"
		/>
		<div v-if="colorSpace === 'rgb'" class="values">
			<InputNumber
				class="channel"
				:modelValue="r"
				:min="0"
				:max="255"
				:precision="0"
				:bar="false"
				horizontalPosition="left"
				@update:modelValue="onUpdateChannel('r', $event)"
			/>
			<InputNumber
				class="channel"
				:modelValue="g"
				:min="0"
				:max="255"
				:precision="0"
				:bar="false"
				horizontalPosition="middle"
				@update:modelValue="onUpdateChannel('g', $event)"
			/>
			<InputNumber
				class="channel"
				:modelValue="b"
				:min="0"
				:max="255"
				:precision="0"
				:bar="false"
				horizontalPosition="middle"
				@update:modelValue="onUpdateChannel('b', $event)"
			/>
			<InputNumber
				v-if="props.hasAlpha"
				class="channel"
				:modelValue="a"
				:min="0"
				:max="100"
				:precision="0"
				:bar="false"
				unit="%"
				horizontalPosition="right"
				@update:modelValue="onUpdateChannel('a', $event)"
			/>
		</div>
		<div v-if="colorSpace === 'hsv'" class="values">
			<InputNumber
				class="channel"
				:modelValue="h"
				:min="0"
				:max="360"
				:precision="0"
				:bar="false"
				unit="°"
				horizontalPosition="left"
				@update:modelValue="onUpdateChannel('h', $event)"
			/>
			<InputNumber
				class="channel"
				:modelValue="s"
				:min="0"
				:max="100"
				:precision="0"
				:bar="false"
				unit="%"
				horizontalPosition="middle"
				@update:modelValue="onUpdateChannel('s', $event)"
			/>
			<InputNumber
				class="channel"
				:modelValue="v"
				:min="0"
				:max="100"
				:precision="0"
				:bar="false"
				unit="%"
				horizontalPosition="middle"
				@update:modelValue="onUpdateChannel('v', $event)"
			/>
			<InputNumber
				v-if="props.hasAlpha"
				class="channel"
				:modelValue="a"
				:min="0"
				:max="100"
				:precision="0"
				:bar="false"
				unit="%"
				horizontalPosition="right"
				@update:modelValue="onUpdateChannel('a', $event)"
			/>
		</div>
		<InputString
			v-if="colorSpace === 'hex'"
			font="monospace"
			class="channel"
			:modelValue="colorCode"
			:validator="colorCodeValidator"
			@update:modelValue="emit('update:modelValue', $event)"
		/>
	</div>
</template>

<style lang="stylus" scoped>

.InputColorChannelValues
	display grid
	gap var(--tq-input-gap)
	grid-template-columns 60px 1fr

.values
	display flex

.channel
	flex-grow 1
</style>
