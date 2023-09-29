<script lang="ts">
import {some} from 'fp-ts/lib/Option'
import {checkIntersection} from 'line-intersect'
import {Vec2, vec2} from 'linearly'
import _ from 'lodash'
import {computed, defineComponent, Ref, ref} from 'vue'

import SvgIcon from '../SvgIcon.vue'
import useDrag from '../useDragV1'
import useModelLocalDisplay from '../useModelLocalDisplay'
import {unsignedMod} from '../util'

function signedAngleBetween(target: number, source: number) {
	const ret = target - source
	return unsignedMod(ret + Math.PI, Math.PI * 2) - Math.PI
}

function addDirectionVector(from: Vec2, rads: number, radius: number): Vec2 {
	return [from[0] + Math.cos(rads) * radius, from[1] + Math.sin(rads) * radius]
}

const PI = Math.PI
const PI_2 = Math.PI * 2

export default defineComponent({
	name: 'InputRotery',
	components: {
		SvgIcon,
	},
	inheritAttrs: false,
	props: {
		modelValue: {
			type: Number,
			required: true,
		},
		updateOnBlur: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['update:modelValue'],
	setup(props, {emit}) {
		const {local, display} = useModelLocalDisplay({
			props,
			emit,
			print(rad) {
				const deg = (rad / PI) * 180
				return deg.toFixed(1) + '°'
			},
			parse: v => some(parseFloat(v)),
		})

		const el: Ref<null | HTMLElement> = ref(null)

		const tweakMode = ref<'relative' | 'absolute'>('relative')

		let alreadyEmitted = false
		const tweakOrigin = ref(local.value)
		let tweakRawLocal = local.value

		const {
			isDragging: tweaking,
			origin,
			pos,
		} = useDrag(el, {
			disableClick: true,
			// lockPointer: true,
			onDragStart({pos, origin}) {
				if (tweakMode.value === 'absolute') {
					const p = vec2.sub(pos, origin)
					const angle = Math.atan2(p[1], p[0])
					const delta = signedAngleBetween(angle, local.value)
					tweakRawLocal = local.value + delta

					tweakOrigin.value = tweakRawLocal
					local.set(tweakRawLocal)
					alreadyEmitted = true
				} else {
					// Relative
					tweakRawLocal = local.value
					tweakOrigin.value = local.value
				}
			},
			onDrag({pos, prevPos, origin}) {
				if (alreadyEmitted) {
					alreadyEmitted = false
					return
				}

				const p = vec2.sub(pos, origin)
				const pp = vec2.sub(prevPos, origin)

				const prevAngle = Math.atan2(pp[1], pp[0])
				const alignedPos = vec2.rotate(p, -prevAngle)
				const delta = Math.atan2(alignedPos[1], alignedPos[0])
				tweakRawLocal += delta
				local.set(tweakRawLocal)
			},
			onDragEnd() {
				tweakMode.value = 'relative'
				local.conform()
			},
		})

		const rem = ref(16) //useRem()

		const overlayArrowAngle = computed(() => {
			const p = vec2.sub(pos.value, origin.value)
			return Math.atan2(p[1], p[0]) + Math.PI / 2
		})

		const overlayArcPath = computed(() => {
			if (!tweaking.value) return ''

			const baseRadius = rem.value * 8
			const radiusStep = rem.value * 0.6

			const start = tweakOrigin.value
			const end = local.value

			const tweakingPositive = end - start > 0

			const turns =
				Math.floor(Math.abs(end - start) / PI_2) * Math.sign(end - start)

			const c = origin.value

			// Create arc
			const arcRadius = baseRadius + turns * radiusStep

			let offsetInTurn = unsignedMod(signedAngleBetween(end, start), PI_2)
			offsetInTurn = tweakingPositive ? offsetInTurn : offsetInTurn - PI_2

			const startInTurn = unsignedMod(start, PI_2)
			const endInTurn = startInTurn + offsetInTurn

			const from = addDirectionVector(c, startInTurn, arcRadius)
			const to = addDirectionVector(c, endInTurn, arcRadius)

			const angleBetween = Math.abs(startInTurn - endInTurn)

			const largeArcFlag = angleBetween > PI ? 1 : 0
			const sweepFlag = tweakingPositive ? 1 : 0

			const arc = `
					M ${from.join(' ')}
					A ${arcRadius} ${arcRadius}
						0 ${largeArcFlag} ${sweepFlag}
						${to.join(' ')} `

			// Create revolutions
			let circles = ''
			for (let i = 0, step = Math.sign(turns); i !== turns; i += step) {
				const radius = baseRadius + i * radiusStep
				if (radius < 0) {
					continue
				}
				const right = `${c[0] + radius} ${c[1]}`
				const left = `${c[0] - radius} ${c[1]}`
				circles += `M ${right}
										A ${radius} ${radius} 0 1 0 ${left}
										A ${radius} ${radius} 0 1 0 ${right}`
			}

			return arc + circles
		})

		function clampPos(p: Vec2): Vec2 {
			const [ox, oy] = origin.value
			const [x, y] = p
			const margin = 40
			const left = margin,
				top = margin,
				right = window.innerWidth - margin,
				bottom = window.innerHeight - margin

			let ret: ReturnType<typeof checkIntersection>

			const check = _.partial(checkIntersection, x, y, ox, oy)

			if ((ret = check(left, top, right, top)).type === 'intersecting') {
				return [ret.point.x, ret.point.y]
			}

			if ((ret = check(right, top, right, bottom)).type === 'intersecting') {
				return [ret.point.x, ret.point.y]
			}

			if ((ret = check(right, bottom, left, bottom)).type === 'intersecting') {
				return [ret.point.x, ret.point.y]
			}

			if ((ret = check(left, bottom, left, top)).type === 'intersecting') {
				return [ret.point.x, ret.point.y]
			}

			return [x, y]
		}

		const overlayLineTo = computed(() => {
			const dist = vec2.distance(origin.value, pos.value)
			const dir: Vec2 = [Math.cos(local.value), Math.sin(local.value)]

			const p = vec2.scaleAndAdd(origin.value, dir, dist)

			return clampPos(p)
		})

		const overlayLabelPos = computed(() => {
			return clampPos(pos.value)
		})

		const overlayLineFrom = computed(() => {
			const o = origin.value
			const t = overlayLineTo.value
			const radius = 10

			const dir = vec2.normalize(vec2.sub(t, o))

			return vec2.scaleAndAdd(o, dir, radius)
		})

		return {
			el,
			local,
			tweaking,
			tweakMode,
			tweakOrigin,

			// overlay
			display,
			overlayLineTo,
			overlayLineFrom,
			overlayArcPath,
			overlayArrowAngle,
			overlayLabelPos,
		}
	},
})
</script>

<template>
	<button
		ref="el"
		class="InputRotery"
		:class="{tweaking}"
		:data-mode="tweakMode"
		v-bind="$attrs"
	>
		<SvgIcon mode="block" class="InputRotery__rotery">
			<circle class="InputRotery__circle" cx="16" cy="16" r="16" />
			<line
				class="InputRotery__scale"
				:style="{
					transform: `rotate(${local}rad)`,
				}"
				x1="20"
				y1="16"
				x2="30"
				y2="16"
				@pointerenter="tweakMode = 'absolute'"
				@pointerleave="!tweaking && (tweakMode = 'relative')"
			/>
		</SvgIcon>
	</button>
	<teleport to="body">
		<template v-if="tweaking">
			<svg class="InputRotery__overlay">
				<line
					v-if="tweakMode === 'absolute'"
					class="bold"
					:x1="overlayLineFrom[0]"
					:y1="overlayLineFrom[1]"
					:x2="overlayLineTo[0]"
					:y2="overlayLineTo[1]"
				/>
				<path
					v-if="tweakMode === 'relative'"
					class="bold"
					:d="overlayArcPath"
				/>
			</svg>
			<div
				ref="overlayLabel"
				class="InputRotery__overlay-label"
				:style="{
					top: overlayLabelPos[1] + 'px',
					left: overlayLabelPos[0] + 'px',
				}"
			>
				{{ display }}
				<span
					class="arrows"
					:style="{
						transform: `rotate(${overlayArrowAngle}rad)`,
					}"
				/>
			</div>
		</template>
	</teleport>
</template>

<style lang="stylus">
@import '../common.styl'

.InputRotery
	position relative
	display block
	overflow hidden
	width var(--tq-input-height)
	height var(--tq-input-height)
	border-radius var(--tq-input-border-radius)
	hover-transition(transform)

	&:hover, &.tweaking
		z-index 1

	&:focus:not(:hover):not(.tweaking)
		hover-transition(transform, background)

	&__rotery
		width var(--tq-input-height)
		height var(--tq-input-height)

	// Enlarge
	&:hover, &.tweaking
		transform scale(3)

	&__circle
		fill var(--tq-color-primary-container)
		stroke none
		hover-transition(fill)

		&:hover, ~/.tweaking[data-mode=relative] &
			fill var(--tq-color-primary)

	&__scale
		transform-origin 16px 16px
		stroke var(--tq-color-primary)
		stroke-width 3
		stroke-linecap round
		hover-transition(stroke)

		~/__circle:hover + &,
		~/.tweaking[data-mode=relative] &
			stroke var(--tq-color-primary-container)

	&__overlay
		input-overlay()

	&__overlay-label
		z-index 1001
		tooltip()
		position fixed
		font-numeric()
		cursor none
		transform translate(-50%, -50%)

		.arrows
			position absolute
			top 0
			left 0
			width 100%
			height 100%

			&:before, &:after
				position absolute
				top 50%
				display block
				width 1em
				text-align center
				font-weight normal
				transform translateY(-50%)

			&:before
				right 100%
				content '<'

			&:after
				left 100%
				content '>'
</style>
