<script setup lang="ts">
import * as Bndr from 'bndr-js'
import {search} from 'fast-fuzzy'
import {computed, ref, watch} from 'vue'

import {type Action, useActions} from '../useActions'

const {actions} = useActions()

const $popover = ref<HTMLElement | null>(null)
const searchWord = ref('')

const filteredActions = computed(() => {
	return search(searchWord.value, Object.values(actions), {
		keySelector: action => action.label,
	})
})

const selectedAction = ref<null | Action>(null)

watch(filteredActions, () => {
	if (filteredActions.value.length > 0) {
		const notFoundInFiltered = !filteredActions.value.includes(
			selectedAction.value as any
		)

		if (notFoundInFiltered) {
			selectedAction.value = filteredActions.value[0]
		}
	} else {
		selectedAction.value = null
	}
})

Bndr.keyboard()
	.key('command+p', {preventDefault: true, capture: true, passive: true})
	.on(() => {
		const open = $popover.value?.togglePopover()
		if (open) {
			searchWord.value = ''
			$popover.value?.querySelector('input')?.focus()
		}
	})

function onKeydown(e: KeyboardEvent) {
	if (e.key === 'p' && e.metaKey) {
		e.preventDefault()
		$popover.value?.hidePopover()
	}

	if (selectedAction.value && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
		const index = filteredActions.value.indexOf(selectedAction.value as any)
		const length = filteredActions.value.length

		const move = e.key === 'ArrowDown' ? 1 : -1

		const newIndex = (index + move + length) % length

		selectedAction.value = filteredActions.value[newIndex]
	}

	if (e.key === 'Enter' && selectedAction.value) {
		perform(selectedAction.value)
	}
}

function perform(action: Action) {
	searchWord.value = ''
	$popover.value?.hidePopover()
	action.perform()
}
</script>

<template>
	<div ref="$popover" class="CommandPalette" popover>
		<div class="search-container">
			<span class="material-symbols-outlined">search</span>
			<input
				v-model="searchWord"
				class="search"
				type="text"
				placeholder="Search menus and commands"
				@keydown="onKeydown"
			/>
		</div>
		<ul class="actions">
			<li
				v-for="action in filteredActions"
				:key="action.id"
				class="action"
				:class="{selected: action === selectedAction}"
				@pointerenter="selectedAction = action"
				@click="perform(action)"
			>
				<span class="action-icon material-symbols-outlined">{{
					action.icon
				}}</span>
				{{ action.label }}
			</li>
		</ul>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.CommandPalette
	width 400px
	background red
	top 20vh
	margin 0 auto
	border-radius 8px
	color var(--tq-color-inverse-on-surface)
	background var(--tq-color-inverse-surface)
	padding 0 9px
	box-shadow 0 0 30px -15px var(--tq-color-shadow)

.search-container
	display flex
	align-items center
	gap 6px
	padding-left 3px

.material-symbols-outlined
	display block

.search
	display block
	flex-grow 1
	font-size 1.2rem
	height 48px
	line-height 36px

	&::placeholder
		font-size 1.2rem
		color var(--tq-color-inverse-on-surface)
		opacity .3

.action
	display flex
	align-items center
	gap 18px
	line-height 32px
	border-radius 3px
	padding 0 6px

	&:last-child
		margin-bottom 9px

	&.selected
		background var(--tq-color-inverse-primary)
		color var(--tq-color-inverse-surface)

.action-icon
	width 20px
	font-size 20px
</style>
../useAction
