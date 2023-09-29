<script lang="ts">
// Forked from: https://github.com/JanGuillermo/vue3-markdown-it

import './katex.css'

import MarkdownItKatex from '@traptitech/markdown-it-katex'
import MarkdownIt from 'markdown-it'
import MarkdownItAnchor from 'markdown-it-anchor'
import MarkdownItDeflist from 'markdown-it-deflist'
import MarkdownItFootnote from 'markdown-it-footnote'
import MarkdownItTOC, {TocOptions} from 'markdown-it-toc-done-right'
import {defineComponent, h, onMounted, PropType, ref, watch} from 'vue'

// import MarkdownItMonacoHighlight from './markdown-it-monaco-highlight'

export default defineComponent({
	name: 'MarkdownIt',
	props: {
		source: {
			type: String,
			default: '',
		},
		/**
		 * Options for MarkdownItAnchor plugin
		 */
		anchor: {
			type: Object as PropType<MarkdownItAnchor.AnchorOptions>,
			default: () => ({}),
		},
		/**
		 * Convert '\n' in paragraphs into <br>
		 */
		breaks: {
			type: Boolean,
			default: false,
		},
		/**
		 * Enable HTML tags in source
		 */
		html: {
			type: Boolean,
			default: false,
		},
		/**
		 * CSS language prefix for fenced blocks. Can be useful for external highlighters.
		 */
		langPrefix: {
			type: String,
			default: 'language-',
		},
		/**
		 * Autoconvert URL-like text to links
		 */
		linkify: {
			type: Boolean,
			default: false,
		},
		/**
		 * Options for MarkdownItTOC plugin
		 */
		toc: {
			type: Object as PropType<TocOptions>,
			default: () => ({}),
		},
	},
	setup(props: any) {
		const md = ref()
		const renderMarkdown = () => {
			const markdown = new MarkdownIt()
				.use(MarkdownItAnchor, props.anchor)
				.use(MarkdownItDeflist)
				.use(MarkdownItFootnote)
				.use(MarkdownItKatex)
				// .use(MarkdownItMonacoHighlight)
				.use(MarkdownItTOC, props.toc)
				.set({
					breaks: props.breaks,
					html: props.html,
					langPrefix: props.langPrefix,
					linkify: props.linkify,
				})

			md.value = markdown.render(props.source)
		}

		onMounted(() => renderMarkdown())
		watch(props, renderMarkdown)

		return () => h('entry', {class: ['MarkdownIt'], innerHTML: md.value})
	},
})
</script>
