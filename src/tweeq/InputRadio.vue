<script lang="ts" setup generic="T">
import _ from 'lodash'
import {computed, ref} from 'vue'

import {Labelizer, useLabelizer} from './types'

interface CompleteOption {
	value: T
	label: string
}

interface Props {
	modelValue: T
	options: T[]
	labels?: string[]
	labelizer?: Labelizer<T>
}

const props = withDefaults(defineProps<Props>(), {})

const labelizer = useLabelizer(props)

const emit = defineEmits<{
	'update:modelValue': [T]
}>()

const id = ref(_.uniqueId('InputRadio_'))

const completeOptions = computed<CompleteOption[]>(() => {
	return props.options.map(op => {
		return {value: op, label: labelizer.value(op)}
	})
})

function onChange(index: number) {
	const newValue = completeOptions.value[index].value
	emit('update:modelValue', newValue)
}
</script>

<template>
	<ul class="InputRadio">
		<li
			v-for="({value, label}, index) in completeOptions"
			:key="label"
			class="list"
		>
			<input
				:id="value + ''"
				type="radio"
				:name="id"
				:checked="modelValue === value"
				@change="onChange(index)"
			/>
			<label :for="value + ''" :class="{active: modelValue === value}">
				<slot
					name="option"
					:label="label"
					:value="value"
					:isActive="modelValue === value"
				>
					{{ label }}
				</slot>
			</label>
		</li>
	</ul>
</template>

<style lang="stylus" scoped>
@import './common.styl'

.InputRadio
	position relative
	display flex
	overflow hidden
	background var(--tq-color-input)
	// width 12.6em
	height var(--tq-input-height)
	border-radius var(--tq-input-border-radius)
	gap 1px
	hover-transition(background, box-shadow)

	&:hover
		background var(--tq-color-input-hover)

	&:focus-within, &:active
		box-shadow 0 0 0 1px var(--tq-color-primary)

.list
	flex-grow 1

input
	position absolute
	opacity 0

label
	display block
	line-height var(--tq-input-height)
	border-radius var(--tq-input-border-radius)
	overflow hidden
	text-align center
	hover-transition(background, color)

	&:hover
		background var(--tq-color-tinted-input-active)

	&.active
		background var(--tq-color-primary)
		color var(--tq-color-on-primary)
		transition none
</style>
