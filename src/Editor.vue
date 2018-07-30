<template lang='pug'>
.tool-editor__code-wrapper(:class='{hide: hide}')
	.tool-editor__code(:id='editorId')
</template>

<script>
import uid from 'uid'

export default {

	props: ['hide', 'value', 'lang'],

	data() {
		return {
			editorId: 'editor-' + uid(10)
		}
	},

	watch: {
		value(value) {
			if (this.editor.getValue() != value) {
				this.editor.setValue(value, -1)
			}
		}
	},
	
	mounted() {

		const lang = this.lang || 'text'

		// editor
		this.editor = ace.edit(this.editorId)
		this.editor.setValue(this.value, -1)
		this.editor.setTheme('ace/theme/tomorrow_night')
		this.editor.getSession().setOptions({
			mode: `ace/mode/${lang}`,
			tabSize: 2,
			useSoftTabs: false
		})

		this.editor.getSession().on('change', () => {
			this.$emit('input', this.editor.getValue())
		})

		this.editor.renderer.setShowGutter(false)
		this.editor.setHighlightActiveLine(false)
		this.editor.$blockScrolling = Infinity

		this.editor.commands.addCommand({
			mame: 'save',
			bindKey: {win: 'Ctrl-S', mac: 'Cmd-S'},
			exec: () => this.$emit('save', this.editor.getValue())
		})
	}
}
</script>
