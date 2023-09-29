import {unrefElement} from '@vueuse/core'
import {Vec2, vec2} from 'linearly'
import {reactive, Ref, toRefs, watch} from 'vue'

interface DragState {
	xy: Vec2
	previous: Vec2
	initial: Vec2
	delta: Vec2
	dragging: boolean
	pointerLocked: boolean
}

type PointerType = 'mouse' | 'pen' | 'touch'

interface UseDragOptions {
	disabled?: Ref<boolean>
	lockPointer?: boolean
	pointerType?: PointerType[]
	dragDelaySeconds?: number

	onClick?: () => void
	onDrag?: (state: DragState, event: PointerEvent) => void
	onDragStart?: (state: DragState, event: PointerEvent) => void
	onDragEnd?: (state: DragState, event: PointerEvent) => void
}

export function useDrag(
	target: Ref<null | HTMLElement>,
	{
		disabled,
		lockPointer = false,
		pointerType = ['mouse', 'pen', 'touch'],
		dragDelaySeconds = 0.5,
		onClick,
		onDrag,
		onDragStart,
		onDragEnd,
	}: UseDragOptions = {}
) {
	const state = reactive<Omit<DragState, 'event'>>({
		// All coordinates are relative to the viewport
		xy: vec2.zero,
		previous: vec2.zero,
		initial: vec2.zero,
		delta: vec2.zero,

		dragging: false,
		pointerLocked: false,
	})

	let dragDelayTimer = -1

	function setup(el: HTMLElement) {
		el.addEventListener('pointerdown', onPointerDown)

		function fireDragStart(event: PointerEvent) {
			if (lockPointer && 'requestPointerLock' in el) {
				el.requestPointerLock()
				state.pointerLocked = true
			} else {
				state.pointerLocked = false
			}

			state.dragging = true
			state.initial = state.previous
			onDragStart?.(state, event)
		}

		function onPointerDown(event: PointerEvent) {
			if (disabled?.value) return
			if (event.button === 2) return // Ignore right click
			if (!event.isPrimary) return
			if (!pointerType.includes(event.pointerType as PointerType)) return

			// Initialzize pointer position
			state.xy = state.previous = state.initial = [event.clientX, event.clientY]

			dragDelayTimer = setTimeout(fireDragStart, dragDelaySeconds * 1000)

			el.setPointerCapture(event.pointerId)

			window.addEventListener('pointermove', onPointerMove)
			window.addEventListener('pointerup', onPointerUp)
		}

		function onPointerMove(event: PointerEvent) {
			if (disabled?.value) return
			if (!event.isPrimary) return

			if (event.movementX !== undefined && event.movementY !== undefined) {
				const movement: Vec2 = [event.movementX, event.movementY]
				state.xy = vec2.add(state.xy, movement)
			} else {
				state.xy = [event.clientX, event.clientY]
			}

			state.delta = vec2.sub(state.xy, state.previous)

			if (vec2.squaredLength(state.delta) === 0) return

			if (state.dragging) {
				onDrag?.(state, event)
			} else {
				// Determine whether dragging has started
				const d = vec2.dist(state.initial, state.xy)
				const minDragDistance = event.pointerType === 'mouse' ? 3 : 7
				if (d >= minDragDistance) {
					fireDragStart(event)
					clearTimeout(dragDelayTimer)
				}
			}

			state.previous = vec2.clone(state.xy)
		}

		function onPointerUp(event: PointerEvent) {
			if (disabled?.value) return
			if (!event.isPrimary) return

			if (lockPointer && 'exitPointerLock' in document) {
				document.exitPointerLock()
			}
			state.pointerLocked = false

			if (state.dragging) {
				onDragEnd?.(state, event)
			} else {
				onClick?.()
			}

			// Reset
			clearTimeout(dragDelayTimer)
			state.dragging = false
			state.xy = state.initial = state.delta = vec2.zero
			window.removeEventListener('pointermove', onPointerMove)
			window.removeEventListener('pointerup', onPointerUp)
		}
	}

	// Hooks
	watch(
		target,
		() => {
			const el = unrefElement(target)
			if (el) setup(el)
		},
		{immediate: true, flush: 'post'}
	)

	return toRefs(state)
}
