import {inject, InjectionKey, provide, Ref, ref, UnwrapRef, watch} from 'vue'

type AppStorage = <T>(name: string, defaultValue: T) => Ref<UnwrapRef<T>>

const AppStorageKey: InjectionKey<AppStorage> = Symbol('refAppStorage')

export function provideAppStorage(appId: string) {
	const appStorage: AppStorage = <T>(name: string, defaultValue: T) => {
		const key = `${appId}.${name}`

		const data = ref(defaultValue)

		const stored = localStorage.getItem(key)
		if (stored !== null) {
			data.value = JSON.parse(stored)
		}

		watch(
			data,
			value => {
				localStorage.setItem(key, JSON.stringify(value))
			},
			{immediate: true}
		)

		return data
	}

	const resetAppStorage = () => {
		for (const key in localStorage) {
			if (key.startsWith(appId)) {
				localStorage.removeItem(key)
			}
		}
	}

	provide(AppStorageKey, appStorage)

	return {
		appStorage,
		resetAppStorage,
	}
}

export function useAppStorage() {
	const appStorage = inject(AppStorageKey)

	if (!appStorage) {
		throw new Error('appStorage is not provided')
	}

	return appStorage
}
