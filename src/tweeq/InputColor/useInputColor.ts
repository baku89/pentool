import {InjectionKey, provide, Ref, ref} from 'vue'

import {ColorSpace} from './types'

export const InputColorPresetsKey: InjectionKey<string[]> = Symbol(
	'InputColorPresetsKey'
)

export const InputColorSpaceKey: InjectionKey<Ref<ColorSpace>> =
	Symbol('InputColorSpaceKey')

export function useInputColor() {
	provide(InputColorPresetsKey, ['skyblue', 'tomato'])

	const colorSpace = ref<ColorSpace>('hsv')

	provide(InputColorSpaceKey, colorSpace)
}
