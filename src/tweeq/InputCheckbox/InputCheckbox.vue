<script lang="ts" setup>
import _ from 'lodash'
import {ref} from 'vue'

import SvgIcon from '../SvgIcon.vue'

interface Props {
	modelValue: boolean
	label?: string
}

defineProps<Props>()

const emit = defineEmits<{
	'update:modelValue': [boolean]
}>()

const id = ref(_.uniqueId('InputCheckbox_'))

function onInput(e: InputEvent) {
	const value = (e.target as HTMLInputElement).checked
	emit('update:modelValue', value)
}
</script>

<template>
	<div class="InputCheckbox">
		<div class="InputCheckbox__checkbox">
			<input
				:id="id"
				:checked="!!modelValue"
				class="InputCheckbox__input"
				type="checkbox"
				@input="onInput"
			/>
			<div class="InputCheckbox__frame">
				<SvgIcon mode="block" class="InputCheckbox__checkmark">
					<path d="M5,19l8,6L27,9" />
				</SvgIcon>
			</div>
		</div>
		<label v-if="label" class="InputCheckbox__label" :for="id">
			{{ label }}
		</label>
	</div>
</template>

<style lang="stylus">
@import '../common.styl'

.InputCheckbox
	display flex
	align-items center

	&__checkbox
		position relative
		width var(--tq-input-height)
		height var(--tq-input-height)

	&__input
		display block
		width var(--tq-input-height)
		height var(--tq-input-height)
		opacity 0

	&__frame
		position absolute
		top 0
		left 0
		width 100%
		height 100%
		border-radius var(--tq-input-border-radius)
		background var(--tq-color-input)
		color transparent
		color var(--tq-color-primary)
		line-height 1em
		pointer-events none
		hover-transition(box-shadow)

	&__checkmark
		position relative
		top 0%
		left 0%
		width 100%
		height 100%
		color var(--tq-color-primary)
		text-align center
		line-height var(--tq-input-height)
		pointer-events none
		stroke-dasharray 32
		stroke-dashoffset 32
		stroke-width 3px
		stroke-linecap round
		stroke-linejoin round
		hover-transition(stroke-dashoffset)

	&__input:checked + &__frame > &__checkmark
		stroke-dashoffset 0


	// Hover and Focus
	&:hover &__frame,
	&:focus-within &__frame
		box-shadow 0 0 0 1px var(--tq-color-primary)
		color var(--tq-color-primary)

	// Label
	&__label
		margin-left 0.3em
		color base16('05')

	// Exp
	&.exp > &__frame
		border-color var(--red)
		color var(--red)
</style>
