import * as Bndr from 'bndr-js'
import {inject, InjectionKey, onBeforeUnmount, provide, reactive} from 'vue'

export interface Action {
	id: string
	label: string
	shortLabel?: string
	icon?: string
	input?: string
	perform(): any
}

const Emitters = new Map<string, Bndr.Emitter>()

const ActionsKey: InjectionKey<Record<string, Action>> = Symbol('tqActions')

const keyboard = Bndr.keyboard()

export function provideActions() {
	const allActions = reactive<Record<string, Action>>({})

	provide(ActionsKey, allActions)

	function registerActions(actions: Action[]) {
		for (const action of actions) {
			if (action.id in actions) {
				throw new Error(`Action ${action.id} is already registered`)
			}

			allActions[action.id] = action

			if (action.input) {
				const emitter = keyboard.keydown(action.input)
				emitter?.on(() => action.perform())

				Emitters.set(action.id, emitter)
			}
		}

		onBeforeUnmount(() => {
			for (const action of actions) {
				delete allActions[action.id]
				Emitters.get(action.id)?.dispose()
			}
		})
	}

	function performAction(id: string) {
		const action = allActions[id]
		if (!action) {
			throw new Error(`Action ${id} is not registered`)
		}

		action.perform()
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
