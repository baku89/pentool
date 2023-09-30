<template>
	<div
		id="mypopover"
		ref="$popover"
		popover
		:style="{left: offset[0] + 'px', top: offset[1] + 'px'}"
	>
		<slot />
	</div>
</template>

<script lang="ts" setup>
import {useElementBounding, useElementSize, useWindowSize} from '@vueuse/core'
import {scalar, Vec2} from 'linearly'
import {computed, onMounted, ref, watch} from 'vue'

type PlacementDirection = 'top' | 'right' | 'bottom' | 'left'
type PlacementAlign = 'start' | 'end'
type Placement = PlacementDirection | `${PlacementDirection}-${PlacementAlign}`

interface Props {
	reference: HTMLElement | null
	open: boolean
	placement?: Placement
}

const props = withDefaults(defineProps<Props>(), {
	open: false,
	placement: 'bottom',
})

const emit = defineEmits<{
	'update:open': [boolean]
}>()

const $ref = computed(() => props.reference)
const $popover = ref<null | HTMLElement>(null)

const refBound = useElementBounding($ref)
const popoverSize = useElementSize($popover)
const windowSize = useWindowSize()

const offset = computed<Vec2>(() => {
	if (!$popover.value) return [0, 0]

	let placement = props.placement

	if (!$ref.value) throw new Error('Cannot align the popover')

	let x = 0
	let y = 0

	const ww = windowSize.width.value
	const wh = windowSize.height.value

	const rLeft = refBound.left.value
	const rRight = refBound.right.value
	const rTop = refBound.top.value
	const rBottom = refBound.bottom.value
	const rWidth = refBound.width.value
	const rHeight = refBound.height.value

	const pWidth = popoverSize.width.value
	const pHeight = popoverSize.height.value

	// Flip detection
	if (placement.startsWith('left')) {
		if (rLeft < pHeight && ww - rRight > pWidth) {
			placement = placement.replace('left', 'right') as Placement
		}
	} else if (placement.startsWith('right')) {
		if (ww - rRight < pHeight && rLeft > pWidth) {
			placement = placement.replace('right', 'left') as Placement
		}
	}

	if (placement.startsWith('top')) {
		if (rTop < pHeight && wh - rBottom > pHeight) {
			placement = placement.replace('top', 'bottom') as Placement
		}
	} else if (placement.startsWith('bottom')) {
		if (wh - rBottom < pHeight && rTop > pHeight) {
			placement = placement.replace('bottom', 'top') as Placement
		}
	}

	// X
	if (placement.startsWith('left')) {
		x = rLeft - pWidth
	} else if (placement.startsWith('right')) {
		x = rRight
	} else if (/^(top|bottom)-start$/.test(placement)) {
		x = rLeft
	} else if (/^(top|bottom)$/.test(placement)) {
		x = rLeft - (pWidth - rWidth) / 2
	} else if (/^(top|bottom)-end$/.test(placement)) {
		x = rLeft - (rWidth - rWidth)
	}
	x = scalar.clamp(x, 0, ww - pWidth)

	// Y
	if (placement.startsWith('top')) {
		y = rTop - pHeight
	} else if (placement.startsWith('bottom')) {
		y = rBottom
	} else if (/^(left|right)-start$/.test(placement)) {
		y = rTop
	} else if (/^(left|right)$/.test(placement)) {
		y = rTop - (pHeight - rHeight) / 2
	} else if (/^(left|right)-end$/.test(placement)) {
		y = rTop - (rHeight - rHeight)
	}
	y = scalar.clamp(y, 0, wh - pHeight)

	return [x, y]
})

watch(
	() => [props.open, $popover.value] as const,
	([open, $popover]) => {
		$popover?.togglePopover(open)
	},
	{immediate: true}
)

onMounted(() => {
	$popover.value?.addEventListener('toggle', e => {
		const opened = (e as ToggleEvent).newState === 'open'
		if (opened !== props.open) {
			emit('update:open', opened)
		}
	})
})
</script>
