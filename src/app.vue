<template>
	<div>
		<canvas :class='{artboard: true, pan: this.pan}' resize/>
		<aside class='sidebar'>
			<div class='sidebar__header'>
				<input class='icon' type='text' v-model='tools[activeToolIndex].icon' maxlength="2">

				<input class='label' type='text' v-model='tools[activeToolIndex].label' maxlength="20">
				<button @click='recompileActiveTool'>Update</button>
				<button class='menu-button' @click='isOpenSidebarMenu = !isOpenSidebarMenu'>⠇</button>
				<ul class='menu' v-if='isOpenSidebarMenu' @click='isOpenSidebarMenu = false'>
					<li @click='deleteTool'>Delete</li>
					<li @click='moveUpTool'>Move Up</li>
					<li @click='moveDownTool'>Move Down</li>
					<li @click='downloadTool'>Download</li>
				</ul>
				<div class='fill' v-if='isOpenSidebarMenu' @click='isOpenSidebarMenu = false'></div>
			</div>
			<div id='code' class='sidebar__code'>{{this.tools[this.activeToolIndex].code}}</div>
		</aside>
		<nav class='toolbar'>
			<ul class='toolbar__tools'>
				<li v-for='(tool, index) in tools' :key='index' :class='{active: index === activeToolIndex}'>
					<input type='radio' :id='tool.label' :value='index' v-model='activeToolIndex'>
					<label :for='tool.label'>{{tool.label}}</label>
					<div :class='{icon: true, tinyletter: tool.icon.length > 1}'>{{tool.icon}}</div>
				</li>
				<li class='add' @click='addTool'></li>
			</ul>
		</nav>
		<div class='settings-button' @click='isOpenSettingsMenu = !isOpenSettingsMenu'></div>
		<ul class='menu settings' v-if='isOpenSettingsMenu' @click='isOpenSettingsMenu = false'>
			<li @click='clearArtboard'>Clear All</li>
			<li @click='exportSVG'>Export SVG</li>
		</ul>
		<div class='fill' v-if='isOpenSettingsMenu' @click='isOpenSettingsMenu = false'></div>
	</div>
</template>

<script>
import paper from 'paper'
import Mousetrap from 'mousetrap'
import downloadAsFile from 'download-as-file'
import jsonBeautify from 'json-beautify'
import queryString from 'query-string'
import axios from 'axios'

import Tool from './tool'
import ToolPresets from './tool-presets.js'

window.paper = paper

export default {

	mounted() {

		// restore user settings from localstorage
		if (localStorage.getItem('tools')) {
			this.tools = JSON.parse(localStorage.getItem('tools'))
		}
		if (localStorage.getItem('activeToolIndex')) {
			this.activeToolIndex = parseInt(localStorage.getItem('activeToolIndex'))
		}

		// load
		const {toolurl} = queryString.parse(location.search)

		if (toolurl) {

			axios.get(toolurl)
				.then(({data}) => {
					
					const result = data.match(/\/\*([\s\S]*?)\*\/[\n]*([\s\S]*)/m)

					if (!result) return

					const metadata = JSON.parse(result[1])

					if (this.tools.map(tool => tool.id).indexOf(metadata.id) != -1) {
						return
					}

					const code = result[2]
					const tool = {...metadata, code}

					this.tools.push(tool)
					this.activeToolIndex = this.tools.length - 1

				})
				.catch((err) => {
					alert('Failed to load tool from ' + toolurl)
				})
		}

		// editor
		this.editor = ace.edit('code')
		this.editor.setValue(this.tools[this.activeToolIndex].code, -1)
		this.editor.setTheme('ace/theme/tomorrow_night')
		this.editor.getSession().setOptions({
			mode: 'ace/mode/javascript',
			tabSize: 2,
			useSoftTabs: true
		})
		this.editor.renderer.setShowGutter(false)
		this.editor.setHighlightActiveLine(false)
		this.editor.$blockScrolling = Infinity

		this.editor.commands.addCommand({
			name: 'recompile',
			bindKey: {win: "Ctrl-Enter", "mac": "Cmd-Enter"},
			exec: this.recompileActiveTool
		})

		// paper.js
		this.canvas = this.$el.querySelector('.artboard')
		paper.setup(this.canvas)
		paper.project.activeLayer.applyMatrix = false

		// canvas navigation
		{
			let px, py, isDragging = false

			const mousedown = ({x, y, target}) => {
				isDragging = true
				px = x
				py = y
			}

			const mousemove = ({x, y, target}) => {
				if (isDragging) {
					const layer = paper.project.activeLayer

					const dx = x - px
					const dy = y - py

					layer.translate(dx, dy)
					px = x
					py = y
				}
			}

			const mouseup = () => {
				isDragging = false
			}

			Mousetrap.bind('space', (e) => {
				this.pan = true
				this.toolCaches[this.activeToolId].disable()

				this.canvas.addEventListener('mousedown', mousedown)
				this.canvas.addEventListener('mousemove', mousemove)
				this.canvas.addEventListener('mouseup', mouseup)

			}, 'keydown')

			Mousetrap.bind('space', () => {
				this.pan = false
				this.toolCaches[this.activeToolId].enable()

				this.canvas.removeEventListener('mousedown', mousedown)
				this.canvas.removeEventListener('mousemove', mousemove)
				this.canvas.removeEventListener('mouseup', mouseup)

			}, 'keyup')

			this.canvas.addEventListener('mousewheel', (e) => {

				const layer = paper.project.activeLayer
				
				if (e.altKey) {
					layer.scale(1 + -e.deltaY / 100, new paper.Point(e.x, e.y))
				} else {
					layer.translate(-e.deltaX, -e.deltaY)
				}

			})
			
		}

		// other keybinds
		{

			Mousetrap.bind(['command+del', 'command+backspace'], this.clearArtboard)
		}

		// tools
		this.toolCaches = {}

		// compile all
		this.tools.forEach((tool) => {
			this.toolCaches[tool.id] = Tool.compileFromCode(tool.code)
		})

		// enable current tool
		this.toolCaches[this.activeToolId].enable()

	},

	methods: {

		recompileActiveTool() {

			if (this.toolCaches[this.activeToolId]) {
				this.toolCaches[this.activeToolId].dispose()
			}

			const code = this.editor.getValue()
			const tool = Tool.compileFromCode(code)

			this.tools[this.activeToolIndex].code = code
			this.toolCaches[this.activeToolId] = tool

			tool.enable()
		},

		addTool() {

			this.tools.push(ToolPresets.createNew())

			this.activeToolIndex = this.tools.length - 1

			const code = this.tools[this.activeToolIndex].code
			const tool = Tool.compileFromCode(code)

			this.toolCaches[this.activeToolId] = tool

			tool.enable()

		},

		deleteTool() {
			this.tools.splice(this.activeToolIndex, 1)
			this.activeToolIndex = Math.min(this.activeToolIndex, this.tools.length - 1)
		},

		clearArtboard() {
			paper.project.activeLayer.removeChildren()
			this.toolCaches[this.activeToolId].end()
		},

		exportSVG() {
			const svg = paper.project.exportSVG({
				bounds: paper.project.activeLayer.strokeBounds
			})
			const svgText = svg.outerHTML

			downloadAsFile({
				data: svgText,
				filename: 'artboard.svg'
			})
		},

		moveUpTool() {

			if (this.activeToolIndex > 0) {
				const activeTool = this.tools[this.activeToolIndex]
				this.tools[this.activeToolIndex] = this.tools[this.activeToolIndex - 1]
				this.tools[this.activeToolIndex - 1] = activeTool

				this.activeToolIndex -= 1
			}
		},

		moveDownTool() {

			if (this.activeToolIndex < this.tools.length - 1) {
				const activeTool = this.tools[this.activeToolIndex]
				this.tools[this.activeToolIndex] = this.tools[this.activeToolIndex + 1]
				this.tools[this.activeToolIndex + 1] = activeTool

				this.activeToolIndex += 1
			}
		},

		switchTool() {

			Object.keys(this.toolCaches).forEach((id) => {
				const tool = this.toolCaches[id]

				if (id === this.activeToolId) tool.enable()
				else tool.disable()
			})
		},

		downloadTool() {

			const {id, label, icon, code} = this.tools[this.activeToolIndex]

			const metadata = {
				id,
				label,
				icon
			}

			const data = `/*\n${jsonBeautify(metadata, null, 2, 20)}\n*/\n\n${code}`

			console.log(data)

			downloadAsFile({
				data,
				filename: `${label}.js`
			})



		}

	},

	data() {

		return {
			tools: ToolPresets.presets,
			activeToolIndex: 0,
			pan: false,
			isOpenSidebarMenu: false,
			isOpenSettingsMenu: false
		}
	},
	

	computed: {
		activeToolId() {
			return this.tools[this.activeToolIndex].id
		}
	},

	watch: {
		tools: {
			handler() {
				this.switchTool()
				localStorage.setItem('tools', JSON.stringify(this.tools))
			},
			deep: true
		},
		activeToolIndex(newTool, oldTool) {
			this.editor.setValue(this.tools[newTool].code, -1)
			this.switchTool()
			localStorage.setItem('activeToolIndex', newTool)
		}
	}
}
</script>