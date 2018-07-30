<template lang='pug'>
ul.parameter-control
	li.param(v-for='param in structure')

		label.param__label {{param.label || param.name}}

		input.param__input(
			v-if='param.type == "float"'
			type='number'
			:value.number='value[param.name]'
			@change='onChange(param.name, parseFloat($event.target.value))')
		
		input.param__input(
			v-if='param.type == "color"'
			type='text'
			:value='value[param.name]'
			:class='{light: isLight(value[param.name])}'
			:style='{backgroundColor: value[param.name]}'
			@change='onChange(param.name, $event.target.value)')
		
</template>

<script>
import Color from 'color'

console.log(Color)

export default {

	props: ['value', 'structure'],

	methods: {
		onChange(...args) {
			this.$emit('update', ...args)
		},
		isLight(color) {
			return Color(color).isLight()
		}
	}
}
</script>
