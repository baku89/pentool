import {inject, InjectionKey} from 'vue'

export function injectStrict<T>(key: InjectionKey<T>, fallback?: T) {
	const resolved = inject(key, fallback)

	if (typeof resolved === 'undefined') {
		throw new Error(`Could not resolve ${key.description}`)
	}

	return resolved
}
