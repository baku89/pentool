import {useLocalStorage} from '@vueuse/core'

export function useAppStorage(appId: string) {
	const refAppStorage = <T>(name: string, defaultValue: T) => {
		return useLocalStorage(`${appId}-${name}`, defaultValue)
	}

	const resetAppStorage = () => {
		for (const key in localStorage) {
			if (key.startsWith(appId)) {
				localStorage.removeItem(key)
			}
		}
	}

	return {
		refAppStorage,
		resetAppStorage,
	}
}
