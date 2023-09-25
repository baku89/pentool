import {computed, Ref} from 'vue'

export function useCommentMeta(source: Ref<string>) {
	// const MetaAndContentPattern =
	// 	/^(?<before>\s*)(?<open>\/\*\s*)(?<meta>[\S\s]*?)(?<close>\s*\*\/[\n\r]?)(?<content>[\S\s]*)/g

	const split = computed(() => {
		const metaAndContentPattern =
			/^\s*\/\*\s*([\S\s]*?)\s*\*\/[\n\r]?([\S\s]*)$/g
		const m = metaAndContentPattern.exec(source.value)

		if (!m) {
			return {
				meta: '',
				content: source.value,
			}
		}

		const [, meta, content] = m

		return {meta, content}
	})

	const meta = computed({
		get() {
			return split.value.meta
		},
		set(meta) {
			const newSource = `/*\n${meta}\n*/\n${split.value.content}`
			if (source.value !== newSource) {
				source.value = newSource
			}
		},
	})

	const content = computed({
		get() {
			return split.value.content
		},
		set(content) {
			const newSource = `/*\n${split.value.meta}\n*/\n${content}`
			if (source.value !== newSource) {
				source.value = newSource
			}
		},
	})

	return {meta, content}
}
