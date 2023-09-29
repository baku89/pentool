import {extendRef, pausableWatch} from '@vueuse/shared'
import {isSome, Option} from 'fp-ts/lib/Option'
import {computed, readonly, Ref, ref, SetupContext, toRaw, watch} from 'vue'

interface ModelLocalDisplayOptions<T> {
	props: {modelValue: T; updateOnBlur: boolean}
	parse: (v: string) => Option<T>
	print: (v: T) => string
	emit: SetupContext<['update:modelValue']>['emit']
}

/**
 * インプットUIにおいて、Model（上位から伝搬されている任意の方の値）、Local（編集中の値）、
 * Display（表示用文字列）とを別個に管理するためのユーティリティ
 * (「?」は Optionモナド)
 *                              show
 * ┌──────────┐ --> ┌─────┐ ----------> ┌───────┐
 * │modelValue│     │local│             │display│
 * └──────────┘ <-- └─────┘ <----?───── └───────┘
 *                     Λ   read&validate   Λ
 *                     │                   │
 *                     ├────(validate)─────┤
 *                     │                   │
 *                set, conform          conform
 */

export default function useModelLocalDisplay<T>({
	props,
	parse,
	print,
	emit,
}: ModelLocalDisplayOptions<T>) {
	const initialValue = toRaw(props.modelValue)
	const local = ref(initialValue) as Ref<T>
	const display = ref(print(initialValue))

	// Model -> Local -> Display
	watch(
		() => props.modelValue,
		model => {
			local.value = model
			display.value = print(local.value)
		},
		{flush: 'sync'}
	)

	const displayInvalid = computed(() => {
		return parse(display.value)
	})

	function setLocal(l: T) {
		if (props.updateOnBlur) {
			local.value = l
			displayWatch.pause()
			display.value = print(local.value)
			displayWatch.resume()
		}
	}

	function conformLocal() {
		emit('update:modelValue', local.value)
	}

	// Display
	function conformDisplay() {
		const parsed = parse(display.value)

		if (isSome(parsed)) {
			emit('update:modelValue', parsed.value)
			return
		}

		// Overwrite display by local
		displayWatch.pause()
		display.value = print(local.value)
		displayWatch.resume()
	}

	const displayWatch = pausableWatch(
		display,
		() => {
			if (props.updateOnBlur) return

			const parsed = parse(display.value)

			if (isSome(parsed)) {
				emit('update:modelValue', parsed.value)
			}

			// Even if the display is invalid, do nothing
		},
		{
			flush: 'sync',
		}
	)

	return {
		local: extendRef(readonly(local), {set: setLocal, conform: conformLocal}),
		display: extendRef(display, {
			setSilent: (d: string) => {
				displayWatch.pause()
				display.value = d
				displayWatch.resume()
			},
			conform: conformDisplay,
		}),
		displayInvalid,
	}
}
