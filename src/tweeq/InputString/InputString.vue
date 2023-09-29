<script lang="ts" setup>
interface Props {
	modelValue: string
	invalid?: boolean
	disabled?: boolean
}

withDefaults(defineProps<Props>(), {})

const emit = defineEmits<{
	'update:modelValue': [string]
}>()

function onFocus(e: Event) {
	;(e.target as HTMLInputElement).select()
}

function onInput(e: Event) {
	const newValue = (e.target as HTMLInputElement).value
	emit('update:modelValue', newValue)
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
			@focus="onFocus"
			@input.stop="onInput"
		/>
	</div>
</template>

<style lang="stylus">
@import '../common.styl'

.InputString
	input-base()
</style>
