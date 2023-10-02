<script setup lang="ts">
import {computedInject} from '@vueuse/core'

import {InputColorPresetsKey} from './useInputColor'

interface Props {
	presets?: string[]
}

const props = withDefaults(defineProps<Props>(), {
	presets: () => [],
})

const emit = defineEmits<{
	'update:modelValue': [string]
}>()

const presetsMerged = computedInject(InputColorPresetsKey, injectedPresets => {
	return [...(injectedPresets ?? []), ...props.presets]
})
</script>

<template>
	<div class="InputColorPresets">
		<button
			v-for="preset in presetsMerged"
			:key="preset"
			:style="{background: preset}"
			@click="emit('update:modelValue', preset)"
		/>
	</div>
</template>

<style lang="stylus" scoped>
@import './common.styl'

.InputColorPresets
	display flex
	gap 6px

button
	width var(--tq-input-height)
	height var(--tq-input-height)
	border-radius var(--tq-input-border-radius)
</style>
./useInputColor
