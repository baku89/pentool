<script lang="ts" setup>
import {useFocus} from '@vueuse/core'
import {identity} from 'lodash'
import {ref, watch} from 'vue'

import {InputFont, InputTheme, Validator} from '../types'

interface Props {
	modelValue: string
	invalid?: boolean
	disabled?: boolean
	theme?: InputTheme
	font?: InputFont
	validator?: Validator<string>
}

const props = withDefaults(defineProps<Props>(), {
	validator: identity,
})

const value = ref(props.modelValue)
const $input = ref<null | HTMLInputElement>(null)
const focusing = useFocus($input).focused

watch(
	() => [focusing.value, props.modelValue] as const,
	([focusing, modelValue]) => {
		if (!focusing) {
			value.value = modelValue
		}
	},
	{immediate: true}
)

const emit = defineEmits<{
	'update:modelValue': [string]
	focus: [e: Event]
	blur: [e: Event]
	input: [e: Event]
}>()

function onFocus(e: Event) {
	;(e.target as HTMLInputElement).select()
	emit('focus', e)
}

function onInput(e: Event) {
	const newValue = (e.target as HTMLInputElement).value
	value.value = newValue

	const validatedValue = props.validator(newValue)

	if (validatedValue !== undefined) {
		emit('update:modelValue', validatedValue)
	}

	emit('input', e)
}

function onBlur(e: Event) {
	emit('blur', e)
}
</script>

<template>
	<div class="InputString" :class="[theme, font]">
		<input
			ref="$input"
			class="input"
			type="text"
			:value="value"
			:disabled="disabled"
			:invalid="invalid"
			@focus="onFocus"
			@blur="onBlur"
			@input.stop="onInput"
		/>
	</div>
</template>

<style lang="stylus">
@import '../common.styl'

.InputString
	input-base()

	&.numeric
		font-family var(--tq-font-numeric)

	&.monospace
		font-family var(--tq-font-code)
</style>
