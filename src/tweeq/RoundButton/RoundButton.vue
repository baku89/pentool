<script setup lang="ts">
interface Props {
	label: string
	longestLabel?: string
	icon?: string
}

defineProps<Props>()
</script>

<template>
	<button class="RoundButton">
		<span v-if="icon" class="material-symbols-outlined">{{ icon }}</span>
		<span :class="{'has-longest-label': longestLabel}">
			<span class="label"> {{ label }} </span>
			<span v-if="longestLabel" class="longest-label">
				{{ longestLabel }}
			</span>
		</span>
	</button>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.RoundButton
	height 32px
	border-radius 9999px
	vertical-align middle
	display inline-flex
	justify-content center
	align-items center
	gap .4em
	width auto
	padding 0 12px 0 6px
	background var(--tq-color-primary-container)
	color var(--md-sys-color-on-primary-container)
	hover-transition(background, color)

	&:hover
		background var(--tq-color-primary)
		color var(--tq-color-on-primary)

.has-longest-label
	display inline-block

	& > .label
		position absolute

	& > .longest-label
		visibility hidden
</style>
