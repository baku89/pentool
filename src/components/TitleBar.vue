<script setup lang="ts">
interface Props {
	name: string
	icon: string
}
defineProps<Props>()

defineSlots<{
	left(): any
	right(): any
}>()
</script>

<template>
	<div class="TitleBar">
		<img class="icon" :src="icon" />
		<span class="app-name">{{ name }}</span>
		<slot name="left" />
		<div class="spacer" />
		<slot name="right" />
	</div>
</template>

<style lang="stylus" scoped>
.TitleBar
	display flex
	left env(titlebar-area-x, 0)
	top env(titlebar-area-y, 0)
	width env(titlebar-area-width, 100%)
	height var(--titlebar-area-height)
	z-index 100
	user-select none
	position fixed
	background 'linear-gradient(to bottom, rgba(%s, .7) 0, transparent)' % var(--ui-bg-rgb)
	backdrop-filter blur(2px)
	gap .6rem
	padding .4rem .4rem .4rem .6rem
	-webkit-app-region: drag;
	app-region: drag;
	line-height calc(var(--titlebar-area-height) - 0.8rem)

	@media (display-mode: window-controls-overlay)
		background 'linear-gradient(to bottom, rgba(%s, .5) 20%, transparent)' % var(--ui-bg-rgb), linear-gradient(to right, var(--ui-bg) 0, transparent 15%, transparent 85%, var(--ui-bg) 100%)


.icon
	aspect-ratio 1
	height calc(var(--titlebar-area-height) - .8rem)

.app-name
	font-weight bold

.spacer
	flex-grow 1
</style>
