<script lang="ts" setup generic="T">
import {useElementSize} from '@vueuse/core'
import {search} from 'fast-fuzzy'
import {computed, Ref, ref, watch} from 'vue'

import InputString from './InputString'
import Popover from './Popover.vue'
import SvgIcon from './SvgIcon.vue'
import {InputTheme, Labelizer, useLabelizer} from './types'
import {unsignedMod} from './util'

interface Props {
	modelValue: T
	options: T[]
	labels?: string[]
	labelizer?: Labelizer<T>
	theme?: InputTheme
}

const props = withDefaults(defineProps<Props>(), {})

const labelizer = useLabelizer(props)

const emit = defineEmits<{
	'update:modelValue': [T]
}>()

defineOptions({
	inheritAttrs: false,
})

const open = ref(false)
const $root = ref<null | HTMLElement>(null)

const {width: inputWidth} = useElementSize($root)

const startValue = ref(props.modelValue) as Ref<T>
const display = ref(labelizer.value(props.modelValue))
const displayEdited = ref(false)

watch(
	() => [open.value, props.modelValue] as const,
	([open, modelValue]) => {
		if (open) return
		display.value = labelizer.value(modelValue)
		displayEdited.value = false
	},
	{flush: 'post'}
)

watch(open, (open, oldOpen) => {
	if (open && !oldOpen) {
		startValue.value = props.modelValue
	}
})

const filteredOptions = computed(() => {
	if (!display.value || !displayEdited.value) return props.options

	return search(display.value, props.options as any[], {
		keySelector: labelizer.value,
	}) as T[]
})

watch(filteredOptions, options => {
	if (!options.includes(props.modelValue)) {
		emit('update:modelValue', options[0])
	}
})

function onFocus() {
	open.value = true
}

function onBlur() {
	open.value = false
}

function onSelect(option: T, e: PointerEvent) {
	if (e.type === 'pointerdown' && e.isPrimary) {
		open.value = false
	}
	emit('update:modelValue', option)
}

function onUnselect() {
	emit('update:modelValue', startValue.value)
}

function onPressArrow(isUp: boolean) {
	const length = filteredOptions.value.length
	const index = filteredOptions.value.indexOf(props.modelValue)
	const newIndex = unsignedMod(index + (isUp ? -1 : 1), length)
	const option = filteredOptions.value[newIndex]
	emit('update:modelValue', option)
}
</script>

<template>
	<div ref="$root" class="InputDropdown" :class="{open}" v-bind="$attrs">
		<InputString
			v-model="display"
			:theme="theme"
			class="input"
			@click="onFocus"
			@blur="onBlur"
			@input="displayEdited = true"
			@input.enter="open = false"
			@keydown.enter.prevent="open = !open"
			@keydown.up.prevent="onPressArrow(true)"
			@keydown.down.prevent="onPressArrow(false)"
		/>
		<SvgIcon mode="block" class="chevron">
			<path d="M11 13 L16 18 21 13" />
		</SvgIcon>
		<Popover
			:reference="$root"
			:open="open"
			placement="bottom"
			@update:open="onBlur"
		>
			<ul
				class="select"
				:style="{width: inputWidth + 'px'}"
				@pointerleave="open && onUnselect()"
			>
				<li
					v-for="(item, index) in filteredOptions"
					:key="index"
					class="option"
					:class="{
						active: item === modelValue,
						startValue: item === startValue,
					}"
					@pointerdown="onSelect(item, $event)"
					@pointerenter="onSelect(item, $event)"
				>
					<slot name="option" :item="item">
						{{ labelizer(item) }}
					</slot>
				</li>
			</ul>
		</Popover>
	</div>
</template>

<style lang="stylus" scoped>
@import './common.styl'

$right-arrow-width = 1em

.InputDropdown
	position relative
	display inline-block
	width 100%
	height var(--tq-input-height)
	border-radius var(--tq-input-border-radius)

	&.open .input
		background var(--tq-color-primary-container)

.select
	margin 1px
	padding 0
	background var(--tq-color-input)
	border-radius var(--tq-input-border-radius)
	overflow hidden

.option
	padding 0 12px
	height var(--tq-input-height)
	line-height var(--tq-input-height)

	&.startValue
		background var(--tq-color-primary-container)

	&.active
		background var(--tq-color-primary)
		color var(--tq-color-on-primary)

.chevron
	position absolute
	top 0
	z-index 10
	right -0.4em
	height 100%
	transform-origin 50% 50%
	pointer-events none
	fill none
	stroke var(--md-sys-color-outline-variant)
	hover-transition(transform)
</style>
