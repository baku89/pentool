import * as Bndr from 'bndr-js'
import {type Mat2d, mat2d, vec2} from 'linearly'
import {computed, onMounted, Ref, ref} from 'vue'

/**
 * Provides a zoomable and pannable interface for an element.
 */
export function useZUI(
	element: Ref<HTMLElement | null>,
	onTransform: (xform: Mat2d) => void
) {
	const panActive = ref(false)
	const zoomActive = ref(false)

	onMounted(() => {
		if (!element.value) return

		const pointer = Bndr.pointer(element.value)
		const keyboard = Bndr.keyboard()
		const position = pointer.position()
		const scroll = pointer.scroll({preventDefault: true})

		const lmbPressed = pointer.left.pressed()
		const zPressed = keyboard.pressed('z')
		const altPressed = keyboard.pressed('alt')
		const ctrlPressed = keyboard.pressed('control')
		const spacePressed = keyboard.pressed('space')

		alert(zPressed.value)

		const panByDragReady = Bndr.or(
			Bndr.cascade(spacePressed, lmbPressed),
			pointer.middle.pressed({pointerCapture: true})
		)

		const panByDrag = position
			.while(panByDragReady)
			.delta((prev, curt) => vec2.sub(curt, prev))

		const panByScroll = scroll.map(vec2.negate).while(altPressed.not, false)

		Bndr.combine(panByDrag, panByScroll)
			.map(mat2d.fromTranslation)
			.on(onTransform)

		// Zoom
		const zoomByDragReady = Bndr.cascade(zPressed, lmbPressed)

		const zoomByScroll = scroll.while(altPressed, false).map(([, y]) => y)
		const zoomByDrag = pointer
			.drag()
			.while(zPressed)
			.map(v => v.delta[0])
		const zoomByPinch = pointer.pinch().map(x => -x * 2)

		const zoomOrigin = position.stash(
			Bndr.combine(
				lmbPressed.down(),
				scroll.constant(true as const),
				zoomByPinch.constant(true as const)
			)
		)

		Bndr.combine(zoomByScroll, zoomByDrag, zoomByPinch)
			.map(delta =>
				mat2d.fromScaling(vec2.of(1.003 ** delta), zoomOrigin.value)
			)
			.on(onTransform)

		Bndr.or(spacePressed, panByDragReady).on(active => {
			panActive.value = active
		})

		Bndr.or(altPressed, zPressed, zoomByDragReady, ctrlPressed).on(active => {
			zoomActive.value = active
		})
	})

	// Computes the cursor style
	const cursor = computed(() => {
		if (panActive.value) return 'grab'
		if (zoomActive.value) return 'zoom-in'
		return 'default'
	})

	return {cursor}
}
