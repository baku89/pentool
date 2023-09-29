<script setup lang="ts">
import {
	computed,
	defineProps,
	onBeforeMount,
	onBeforeUnmount,
	watch,
	withDefaults,
} from 'vue'

import {AddTabKey, DeleteTabKey, TabsProviderKey, UpdateTabKey} from './symbols'
import {injectStrict} from './utils'

type Props = {
	id?: string
	name: string
	isDisabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	id: undefined,
	isDisabled: false,
})

const tabsProvider = injectStrict(TabsProviderKey)
const addTab = injectStrict(AddTabKey)
const updateTab = injectStrict(UpdateTabKey)
const deleteTab = injectStrict(DeleteTabKey)

const id = computed(() =>
	props.id ? props.id : props.name.toLowerCase().replace(/ /g, '-')
)
const paneId = computed(() => id.value + '-pane')
const isActive = computed(() => id.value === tabsProvider.activeId)

watch(
	() => Object.assign({}, props),
	() => {
		updateTab(id.value, {
			name: props.name,
			isDisabled: props.isDisabled,
			id: id.value,
			paneId: paneId.value,
		})
	}
)

onBeforeMount(() => {
	addTab({
		name: props.name,
		isDisabled: props.isDisabled,
		id: id.value,
		paneId: paneId.value,
	})
})

onBeforeUnmount(() => {
	deleteTab(id.value)
})
</script>

<template>
	<section
		v-show="isActive"
		:id="paneId"
		ref="tab"
		class="Tab"
		:data-tab-id="id"
		:aria-hidden="!isActive"
		role="tabpanel"
		tabindex="-1"
	>
		<slot />
	</section>
</template>

<style lang="stylus" scoped>

.Tab
	height 100%
</style>
