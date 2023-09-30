<script lang="ts" setup>
interface Props {
	modelValue: string
	invalid?: boolean
	disabled?: boolean
}

withDefaults(defineProps<Props>(), {})

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
	emit('update:modelValue', newValue)
	emit('input', e)
}
</script>

<template>
	<div class="InputString">
		<input
			class="input"
			type="text"
			:value="modelValue"
			:disabled="disabled"
			:invalid="invalid"
			popovertarget="mypopover"
			@focus="onFocus"
			@blur="emit('blur', $event)"
			@input.stop="onInput"
		/>
	</div>
</template>

<style lang="stylus">
@import '../common.styl'

.InputString
	input-base()
</style>
