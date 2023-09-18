import Bndr from 'bndr-js'
import {type Mat2d, mat2d, vec2} from 'linearly'
import {computed, ref} from 'vue'

/**
 * Provides a zoomable and pannable interface for an element.
 */
export function useZUI(onTransform: (xform: Mat2d) => void) {
	const pointer = Bndr.pointer()
	const position = pointer.position()
	const scroll = pointer.scroll({preventDefault: true})

	const lmbPressed = pointer.left.pressed()
	const zPressed = Bndr.keyboard.key('z')
	const altPressed = Bndr.keyboard.key('alt')
	const ctrlPressed = Bndr.keyboard.key('control')
	const spacePressed = Bndr.keyboard.key('space')

	const panByDragReady = Bndr.or(
		Bndr.cascade(spacePressed, lmbPressed),
		pointer.middle.pressed({pointerCapture: true})
	)

	const panByDrag = position
		.while(panByDragReady)
		.delta((prev, curt) => vec2.sub(curt, prev))

	const panByScroll = scroll.map(vec2.negate).while(
		altPressed.map(v => !v),
		false
	)

	Bndr.combine(panByDrag, panByScroll)
		.map(mat2d.fromTranslation)
		.on(onTransform)

	// Zoom
	const zoomByDragReady = Bndr.cascade(zPressed, lmbPressed)

	const zoomByScroll = scroll.while(altPressed, false).map(([, y]) => y)
	const zoomByDrag = position
		.while(zoomByDragReady)
		.delta((prev, curt) => vec2.sub(curt, prev))
		.map(([x]) => x)
	const zoomByPinch = pointer.pinch().map(x => x * 2)

	const zoomOrigin = position.stash(
		Bndr.combine(
			lmbPressed.down(),
			scroll.constant(true as const),
			zoomByPinch.constant(true as const)
		)
	)

	Bndr.combine(zoomByScroll, zoomByDrag, zoomByPinch)
		.map(delta => mat2d.fromScaling(vec2.of(1.003 ** delta), zoomOrigin.value))
		.on(onTransform)

	// Computes the cursor style
	const panActive = ref(false)
	Bndr.or(spacePressed, panByDragReady).on(active => {
		panActive.value = active
	})

	const zoomActive = ref(false)
	Bndr.or(altPressed, zPressed, zoomByDragReady, ctrlPressed).on(active => {
		zoomActive.value = active
	})

	const cursor = computed(() => {
		if (panActive.value) return 'grab'
		if (zoomActive.value) return 'zoom-in'
		return 'default'
	})

	return {cursor}
}
