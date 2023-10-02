<template>
	<button class="InputButton">{{ label }}</button>
</template>

<script lang="ts" setup>
interface Props {
	label: string
}

withDefaults(defineProps<Props>(), {label: ''})
</script>

<style lang="stylus" scoped>
@import './common.styl'

.InputButton
	padding 0 1em
	height var(--tq-input-height)
	border-radius var(--tq-input-border-radius)
	background var(--tq-color-primary-container)
	color var(--md-sys-color-on-primary-container)
	font-size inherit
	hover-transition(background, color)

	&:focus-visible
		background var(--tq-color-tinted-input-active)

	&:hover
		color var(--tq-color-on-primary)
		background var(--tq-color-primary)
</style>
