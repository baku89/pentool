import {RemovableRef, useLocalStorage} from '@vueuse/core'
import {inject, InjectionKey, provide} from 'vue'

type AppStorage = <T>(name: string, defaultValue: T) => RemovableRef<T>

const AppStorageKey: InjectionKey<AppStorage> = Symbol('refAppStorage')

export function provideAppStorage(appId: string) {
	const appStorage: AppStorage = <T>(name: string, defaultValue: T) => {
		return useLocalStorage(`${appId}.${name}`, defaultValue)
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
