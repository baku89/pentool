<script setup lang="ts">
interface Props {
	label: string
}

defineProps<Props>()
</script>
<template>
	<li class="Parameter">
		<label class="label">{{ label }}</label>
		<div class="input">
			<slot />
		</div>
	</li>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.Parameter
	display grid
	grid-column 1 / 3
	grid-template-columns subgrid

.label
	line-height var(--tq-input-height)
	color var(--md-sys-color-secondary)
</style>
