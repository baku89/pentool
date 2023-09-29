import {inject, InjectionKey, onBeforeUnmount, provide, reactive} from 'vue'

export interface Action {
	id: string
	label: string
	shortLabel?: string
	icon?: string
	perform(...args: any): any
}

const ActionsKey: InjectionKey<Record<string, Action>> = Symbol('tqActions')

export function provideActions() {
	const allActions = reactive<Record<string, Action>>({})

	provide(ActionsKey, allActions)

	function registerActions(actions: Action[]) {
		for (const action of actions) {
			if (action.id in actions) {
				throw new Error(`Action ${action.id} is already registered`)
			}

			allActions[action.id] = action
		}

		onBeforeUnmount(() => {
			for (const action of actions) {
				delete allActions[action.id]
			}
		})
	}

	function performAction(id: string, ...args: any) {
		const action = allActions[id]
		if (!action) {
			throw new Error(`Action ${id} is not registered`)
		}

		action.perform(...args)
	}

	return {registerActions, performAction}
}

export function useActions() {
	const actions = inject(ActionsKey)

	if (!actions) {
		throw new Error('actions is not provided')
	}

	return {actions}
}
