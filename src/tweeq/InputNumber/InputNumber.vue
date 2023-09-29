<script lang="ts" setup>
import {useElementBounding, useFocus, useKeyModifier} from '@vueuse/core'
import {useWheel} from '@vueuse/gesture'
import {scalar, Vec2} from 'linearly'
import {computed, ref, watch, watchEffect} from 'vue'

import {useDrag} from '../useDrag'
import {toFixed, unsignedMod} from '../util'

interface Props {
	modelValue: number
	min?: number
	max?: number
	clampMin?: boolean
	clampMax?: boolean
	invalid?: boolean
	disabled?: boolean
	precision?: number
}

const props = withDefaults(defineProps<Props>(), {
	min: Number.MIN_SAFE_INTEGER,
	max: Number.MAX_SAFE_INTEGER,
	clampMin: true,
	clampMax: true,
	precision: 4,
})

const emit = defineEmits<{
	'update:modelValue': [number]
}>()

const root = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)

const local = ref(props.modelValue)
const display = ref(toFixed(props.modelValue, props.precision))

const {left, top, width, height, right} = useElementBounding(root)

const alt = useKeyModifier('Alt')
const shift = useKeyModifier('Shift')

const hasRange = computed(() => {
	return (
		props.min !== Number.MIN_SAFE_INTEGER &&
		props.max !== Number.MAX_SAFE_INTEGER
	)
})

const validMin = computed(() =>
	props.clampMin ? props.min : Number.MIN_SAFE_INTEGER
)
const validMax = computed(() =>
	props.clampMax ? props.max : Number.MAX_SAFE_INTEGER
)

const speedMultiplierKey = computed(() => {
	return (alt.value ? 0.1 : 1) * (shift.value ? 10 : 1)
})
const speedMultiplierGesture = ref(1)
const speed = computed(() => {
	return speedMultiplierKey.value * speedMultiplierGesture.value
})

const getDisplayPrecision = () => {
	const floats = /\.[0-9]*$/.exec(display.value)
	return floats ? floats[0].length - 1 : 0
}
const displayPrecision = ref(0)

const tweakPrecision = computed(() => {
	const prec = Math.max(0, Math.ceil(-Math.log10(speed.value)))
	return Math.max(prec, displayPrecision.value)
})
const tweakInitialValue = ref(props.modelValue)

const tweakDirection = ref(0)
const pointerSize = ref(0)

let resetTweakModeTimer: NodeJS.Timeout
const tweakMode = ref<null | 'value' | 'speed'>(null)

const {dragging: tweaking, pointerLocked} = useDrag(root, {
	lockPointer: true,
	disabled: computed(() => props.disabled || useFocus(input).focused.value),
	onClick() {
		input.value?.focus()
	},
	onDragStart(state, event) {
		const isTipDragged = (event.target as Element).classList.contains('tip')
		const insideRange = props.min <= local.value && local.value <= props.max
		if (hasRange.value && insideRange && !isTipDragged) {
			// Absolute mode
			local.value = scalar.efit(
				state.xy[0],
				left.value,
				right.value,
				props.min,
				props.max
			)
			emit('update:modelValue', local.value)
		}

		tweakMode.value = null
		tweakInitialValue.value = props.modelValue
		speedMultiplierGesture.value = 1
		displayPrecision.value = getDisplayPrecision()
	},
	onDrag(state, event) {
		const [dx, dy] = state.delta

		const isMouse = event.pointerType === 'mouse' || event.pointerType === 'pen'

		tweakDirection.value = dx
		pointerSize.value =
			event.width *
			0.75 *
			scalar.smoothstep(
				(event.width * 0.7) / 2,
				(event.width * 0.5) / 2,
				Math.abs(state.xy[1] - (top.value + height.value / 2))
			)

		if (state.pointerLocked) {
			scaleOffset.value = 0
		} else {
			scaleOffset.value = state.xy[0] - (left.value + width.value / 2)
		}

		if (!tweakMode.value) {
			if (isMouse) {
				tweakMode.value = Math.abs(dx) >= Math.abs(dy) ? 'value' : 'speed'
			} else {
				tweakMode.value = 'value'
			}
		}

		if (tweakMode.value === 'value') {
			const baseSpeed = hasRange.value
				? (props.max - props.min) / width.value
				: 1

			local.value = props.modelValue + dx * baseSpeed * speed.value
			local.value = scalar.clamp(local.value, validMin.value, validMax.value)
			emit('update:modelValue', local.value)
		} else {
			speedMultiplierGesture.value = scalar.clamp(
				speedMultiplierGesture.value * Math.pow(0.98, dy),
				10 ** -props.precision,
				1000
			)
		}

		if (isMouse) {
			clearTimeout(resetTweakModeTimer)
			resetTweakModeTimer = setTimeout(() => (tweakMode.value = null), 250)
		}
	},
	onDragEnd() {
		display.value = toFixed(props.modelValue, tweakPrecision.value)
		tweakMode.value = null
		speedMultiplierGesture.value = 1
	},
})

useWheel(
	({delta: [, y], event}: {delta: Vec2; event: WheelEvent}) => {
		event.preventDefault()

		local.value = props.modelValue + y * speedMultiplierGesture.value
		local.value = scalar.clamp(local.value, validMin.value, validMax.value)
		display.value = props.modelValue.toFixed(tweakPrecision.value)

		emit('update:modelValue', local.value)
	},
	{domTarget: root, eventOptions: {passive: false}}
)

let hasChanged = false
let initialDisplay = ''

const onFocus = (e: FocusEvent) => {
	const el = e.target as HTMLInputElement
	el.select()
	hasChanged = false
	initialDisplay = display.value
}

const onInput = (e: Event) => {
	const el = e.target as HTMLInputElement

	display.value = el.value

	const value = parseFloat(el.value)
	if (isNaN(value)) return

	local.value = scalar.clamp(value, validMin.value, validMax.value)
	hasChanged = true

	emit('update:modelValue', local.value)
}

const increment = (delta: number) => {
	const prec = Math.max(
		getDisplayPrecision(),
		-Math.log10(speedMultiplierKey.value)
	)
	local.value += delta * speedMultiplierKey.value
	local.value = scalar.clamp(local.value, validMin.value, validMax.value)
	display.value = toFixed(local.value, prec)
	hasChanged = true
	emit('update:modelValue', local.value)
}

const onBlur = () => {
	if (hasChanged) {
		display.value = toFixed(props.modelValue, props.precision)
	} else {
		// 変な文字を打ったときはhasChanged === falseなので、これでリセットをかける
		display.value = initialDisplay
	}
}

watchEffect(() => {
	if (tweaking.value) {
		display.value = props.modelValue.toFixed(tweakPrecision.value)
	}
})

const scaleOffset = ref(0)

const scaleAttrs = (offset: number) => {
	const precision = unsignedMod(
		-Math.log10(speedMultiplierGesture.value) + offset,
		3
	)
	const halfWidth = (width.value + height.value * 20) / 2

	const opacity = scalar.smoothstep(1, 2, precision)

	return {
		x1: -halfWidth,
		x2: halfWidth,
		style: {
			strokeDashoffset: -halfWidth,
			strokeDasharray: `0 ${Math.pow(10, precision)}`,
			opacity,
		},
	}
}

const cursorStyle = computed(() => {
	return {
		transform: `translateX(${scaleOffset.value}px)`,
		width: `${pointerSize.value}px`,
		marginLeft: `${pointerSize.value / -2}px`,
		opacity: scalar.smoothstep(
			width.value * 0.5,
			width.value * 0.6,
			Math.abs(scaleOffset.value)
		),
	}
})

// For iPad. Swiping with second finger to change the drag speed
window.addEventListener('touchstart', (e: TouchEvent) => {
	if (!tweaking.value) return

	const secondTouch = e.touches.item(1)
	if (!secondTouch) return

	const ox = secondTouch.clientX
	const initialSpeedMultiplierGesture = speedMultiplierGesture.value

	const stop = watch(tweaking, () => {
		window.removeEventListener('touchmove', onSecondTouchMove)
		window.removeEventListener('touchend', onSecondTouchEnd)
		stop()
	})

	window.addEventListener('touchmove', onSecondTouchMove)
	window.addEventListener('touchend', onSecondTouchEnd)

	function onSecondTouchMove(e: TouchEvent) {
		const firstTouch = e.touches.item(0)
		const secondTouch = e.touches.item(1)
		if (!firstTouch || !secondTouch) return

		const cx = firstTouch.clientX
		const x = secondTouch.clientX

		tweakMode.value = 'speed'

		const mul = Math.abs((ox - cx) / (x - cx))
		speedMultiplierGesture.value = scalar.clamp(
			initialSpeedMultiplierGesture * mul,
			10 ** -props.precision,
			1000
		)
	}

	function onSecondTouchEnd() {
		if (!e.touches.item(1)) return

		tweakMode.value = 'value'

		window.removeEventListener('touchmove', onSecondTouchMove)
		window.removeEventListener('touchend', onSecondTouchEnd)
	}
})
</script>

<template>
	<div ref="root" class="InputNumber" :class="{tweaking}" v-bind="$attrs">
		<div
			v-if="hasRange"
			class="bar"
			:style="{width: scalar.invlerp(min, max, modelValue) * 100 + '%'}"
		>
			<div class="tip"></div>
		</div>

		<input
			ref="input"
			class="input"
			type="text"
			min="0"
			inputmode="numeric"
			pattern="d*"
			:value="display"
			:invalid="invalid"
			:disabled="disabled"
			@focus="onFocus"
			@input="onInput"
			@blur="onBlur"
			@keydown.up.prevent="increment(1)"
			@keydown.down.prevent="increment(-1)"
		/>
		<div
			v-if="tweaking"
			class="cursor"
			:class="{floating: !pointerLocked}"
			:style="cursorStyle"
		>
			<!-- <IconDec
				class="dec"
				:class="{active: tweakMode === 'value' && tweakDirection < 0}"
				:size="height"
			></IconDec>
			<IconInc
				class="inc"
				:class="{active: tweakMode === 'value' && tweakDirection > 0}"
				:size="height"
			></IconInc> -->
		</div>
	</div>
	<teleport to="body">
		<svg v-if="tweaking || true" class="InputNumber__overlay">
			<g
				:transform="`translate(${left + width / 2 + scaleOffset}, ${
					top + height / 2
				})`"
			>
				<g v-if="tweakMode === 'speed'">
					<line class="scale" v-bind="scaleAttrs(0)"></line>
					<line class="scale" v-bind="scaleAttrs(1)"></line>
					<line class="scale" v-bind="scaleAttrs(2)"></line>
				</g>
			</g>
		</svg>
	</teleport>
</template>

<style lang="stylus">
@import '../common.styl'

.InputNumber
	input-base()

	input
		position relative
		text-align center
		font-numeric()
		pointer-events none

.bar
	top 0
	left 0
	position absolute
	height 100%
	hover-transition(background)
	background var(--tq-color-primary-container)

.tip
	position absolute
	height 100%
	width 2px
	right -1px
	background var(--tq-color-inverse-primary)
	hover-transition(opacity)

	&:before
		content ''
		position absolute
		display block
		height 100%
		left calc(var(--tq-input-height) / -2)
		right @left

	.tweaking &, &:hover
		background var(--tq-color-primary)

.InputNumber:hover, .InputNumber:focus-within
	.bar
		background var(--tq-color-inverse-primary)
</style>

<style lang="stylus">
.InputNumber__overlay
	position fixed
	overflow visible
	pointer-events none
	width 100%
	height: 100%
	inset 0
	z-index 200

	.scale
		fill none
		stroke-width 4
		stroke-linecap round
		stroke var(--tq-color-primary)

	.pointer
		fill var(--tq-color-primary)
</style>
