<script setup lang="ts">
import {computed} from 'vue'

const props = defineProps<{
	src: string
}>()

const style = computed(() => {
	return {
		maskImage: `url(${props.src})`,
	}
})
</script>

<template>
	<div class="ColorIcon" :style="style" />
</template>

<style lang="stylus" scoped>
.ColorIcon
	aspect-ratio 1
	background currentColor
</style>
