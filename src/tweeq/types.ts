import {capital} from 'case'
import {computed} from 'vue'

export type Validator<T> = (value: T) => T | undefined

export type Labelizer<T> = (v: T) => string

export type InputTheme = 'minimal' | 'underline'

export type InputFont = 'numeric' | 'monospace'

export type InputHorizontalPosition = 'left' | 'middle' | 'right'
export type InputVerticalPosition = 'top' | 'middle' | 'bottom'

export function useLabelizer<T>(props: {
	options: T[]
	labels?: string[]
	labelizer?: Labelizer<T>
}) {
	return computed(() => {
		if (props.labelizer) return props.labelizer
		if (!props.labels) return (v: T) => capital(String(v))

		const labels = props.labels

		if (labels.length !== props.options.length) {
			throw new Error(
				'the length of labels must be the same as the length of options'
			)
		}

		return (v: T) => {
			const index = props.options.indexOf(v)
			return labels[index]
		}
	})
}
