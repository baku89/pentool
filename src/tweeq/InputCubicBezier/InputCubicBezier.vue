<template>
	<button
		ref="buttonEl"
		class="InputCubicBezier"
		:class="{opened}"
		v-bind="$attrs"
		@click="opened = true"
	>
		<svg class="InputCubicBezier__icon" viewBox="0 0 1 1">
			<path :d="easingPath" />
		</svg>
	</button>
	<Popover ref="$button" v-model:open="opened" placement="bottom">
		<div class="InputCubicBezier__popover-frame">
			<InputCubicBezierPicker
				:modelValue="modelValue"
				@update:modelValue="$emit('update:modelValue', $event)"
			/>
		</div>
	</Popover>
</template>

<script lang="ts" setup>
import {computed, ref} from 'vue'

import Popover from '../Popover.vue'
import InputCubicBezierPicker from './InputCubicBezierPicker.vue'
import {CubicBezier} from './types'

interface Props {
	modelValue: CubicBezier
}

const props = defineProps<Props>()

defineEmits<{
	'update:modelValue': [CubicBezier]
}>()

defineOptions({
	inheritAttrs: false,
})

const $button = ref<HTMLElement | null>(null)
const opened = ref(false)

const easingPath = computed(() => {
	const [x1, y1, x2, y2] = props.modelValue

	return `M 0,0 C ${x1},${y1} ${x2},${y2} 1,1`
})
</script>

<style lang="stylus">
@import '../common.styl'

.InputCubicBezier
	position relative
	width var(--tq-input-height)
	height var(--tq-input-height)
	border-radius var(--tq-input-border-round)
	hover-transition(background)
	color base16('05')

	&:focus
		background base16('01')

	&:hover, &.opened
		background base16('accent', 0.5)

	&__icon
		margin $subcontrol-margin
		width var(--tq-input-height)
		height var(--tq-input-height)
		border-radius var(--tq-input-border-round)
		background var(--tq-color-primary)

		path
			transform scaleY(-1)
			transform-origin 50% 50%
			stroke-width 1.5
			stroke var(--tq-color-text)
			stroke-linecap round
			fill none
			vector-effect non-scaling-stroke

	&__popover-frame
		margin 0.5rem
		width 15rem
		height 15rem
		border 1px solid $color-frame
		border-radius $popup-round
		glass-bg('pane')
		position relative
		box-shadow 0 0 20px 0 base16('00', 0.9)
</style>
