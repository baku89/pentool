<template lang='pug'>
div
	canvas.artboard(:class='{pan: pan}', resize)
	aside.sidebar(:class='{show: showSidebar}')
		.sidebar__split(@click='showSidebar = !showSidebar')
		.tool-editor
			.tool-editor__header
				input.icon(type='text' v-model='tools[activeToolIndex].icon', maxlength='2')
				input.label(type='text' v-model='tools[activeToolIndex].label', maxlength='20')
				button.btn-update(
					:class='{dirty: isDirty}'
					@click='recompileActiveTool') Update
				button.btn-menu(@click='openToolEditorMenu = !openToolEditorMenu') ⠇
				ul.menu(v-if='openToolEditorMenu' @click='openToolEditorMenu = false')
					li(@click='deleteTool') Delete
					li(@click='moveUpTool')
						| Move Up
					li(@click='moveDownTool') Move Down
					li(@click='downloadTool') Download File
				.fill(v-if='openToolEditorMenu' @click='openToolEditorMenu = false')
			.tool-editor__editors
				Editor(
					:hide='toolEditMode != "code"'
					v-model='editingCode'
					lang='javascript'
					@save='recompileActiveTool')
				Editor(
					:hide='toolEditMode != "params"'
					v-model='editingParameters'
					lang='json'
					@save='recompileActiveTool')
			.tool-editor__tab
				button(:class='{active: toolEditMode == "code"}' @click='toolEditMode = "code"') Code
				button(:class='{active: toolEditMode == "params"}' @click='toolEditMode = "params"') Params
		
		ParameterControl(
			v-if='activeTool.parameters && activeTool.parameters.length > 0'
			v-model='parameters'
			:structure='tools[activeToolIndex].parameters'
			@update='updateParameter')
		
		.sidebar__credit.
			Created by <a href='https://baku89.com' target='_blank'>Baku Hashimoto</a> <a href='https://github.com/baku89/pentool' target='_blank'>GitHob</a>

	nav.toolbar
		ul.toolbar__tools
			li(v-for='(tool, index) in tools' :key='index' :class='{active: index === activeToolIndex}')
				input(type='radio' :id='tool.label' :value='index' v-model='activeToolIndex')
				label(:for='tool.label') {{tool.label}}
				div(:class='{icon: true, tinyletter: tool.icon.length > 1}') {{tool.icon}}
			li.add(@click='addTool')
	
	.settings-button(@click='openSettingsMenu = !openSettingsMenu')
	ul.menu.settings(v-if='openSettingsMenu' @click='openSettingsMenu = false')
		li(@click='clearArtboard') Clear All
		li(@click='exportSVG') Export SVG
		li(@click='resetTools') Reset Tools
		li(@click='openToolURLPrompt') Load Tool from URL
		// <li @click='loadTool'>Load Tool</li>
	.fill(v-if='openSettingsMenu' @click='openSettingsMenu = false')
</template>


<script>
import paper from 'paper'
import Mousetrap from 'mousetrap'
import downloadAsFile from 'download-as-file'
import queryString from 'query-string'
import axios from 'axios'
import jsonBeautify from 'json-beautify'

import Tool from './tool'
import ToolPresets from './tool-presets.js'

import Editor from './Editor.vue'
import ParameterControl from './ParameterControl.vue'

window.paper = paper

export default {

	mounted() {

		// load
		const {tool_url} = queryString.parse(location.search)

		if (tool_url) {
			this.loadToolFromURL(tool_url)
		}

		// paper.js
		this.canvas = this.$el.querySelector('.artboard')
		paper.setup(this.canvas)
		paper.project.currentStyle.strokeCap = 'round'
		paper.project.currentStyle.strokeJoin = 'round'

		const project = paper.project
		const activeLayer = paper.project.activeLayer
		const guideLayer = new paper.Layer()
		guideLayer.bringToFront()
		guideLayer.name = 'guide'

		const scaleGuide = (item, zoom) => {

			if (item.data.isMarker) {
				item.scaling = 1 / zoom
			}

			if (item.children) {
				item.children.forEach(child => scaleGuide(child, zoom))
			}
		}

		paper.project.view.applyMatrix = false
		
		paper.project.view.on('zoom', (zoom) => {
			guideLayer.children.forEach((child) => {
				scaleGuide(child, zoom)
			})
		})

		activeLayer.activate()

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
				this.toolInstances[this.activeToolId].pause()

				this.canvas.addEventListener('mousedown', mousedown)
				this.canvas.addEventListener('mousemove', mousemove)
				this.canvas.addEventListener('mouseup', mouseup)

			}, 'keydown')

			Mousetrap.bind('space', () => {
				this.pan = false
				this.toolInstances[this.activeToolId].resume()

				this.canvas.removeEventListener('mousedown', mousedown)
				this.canvas.removeEventListener('mousemove', mousemove)
				this.canvas.removeEventListener('mouseup', mouseup)

			}, 'keyup')

			this.canvas.addEventListener('mousewheel', (e) => {

				const view = paper.project.view
				
				if (e.altKey || e.ctrlKey) {
					const zoomDelta = 1 + -e.deltaY / 100
					const pivot = new paper.Point(e.x, e.y)//view.projectToView(new paper.Point(e.x, e.y))
					view.scale(zoomDelta, pivot)
					view.emit('zoom', view.scaling.x)
				} else {
					view.translate(-e.deltaX, -e.deltaY)
				}
			})
		}

		// other keybinds
		{
			Mousetrap.bind(['command+del', 'command+backspace'], this.clearArtboard)
		}

		// tools
		this.toolInstances = {}

		// compile all
		this.tools.forEach((tool) => {
			this.toolInstances[tool.id] = Tool.compile(tool, this.parameters)
		})

		// enable current tool
		this.switchTool()
	},

	methods: {

		recompileActiveTool() {

			if (this.toolInstances[this.activeToolId]) {
				this.toolInstances[this.activeToolId].deactivate()
			}

			this.activeTool.code = this.editingCode
			this.$set(this.activeTool, 'parameters', JSON.parse(this.editingParameters))

			const toolInstance = Tool.compile(this.activeTool, this.parameters)

			this.toolInstances[this.activeToolId] = toolInstance

			toolInstance.activate()
		},

		addTool() {

			this.tools.push(ToolPresets.createNew())

			this.activeToolIndex = this.tools.length - 1

			const toolInstance = Tool.compile(this.activeTool, this.parameters)

			this.toolInstances[this.activeToolId] = toolInstance

			toolInstance.activate()
		},

		deleteTool() {
			this.tools.splice(this.activeToolIndex, 1)
			this.activeToolIndex = Math.min(this.activeToolIndex, this.tools.length - 1)
		},

		clearArtboard() {
			paper.project.activeLayer.removeChildren()
			this.toolInstances[this.activeToolId].end()
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
				const activeTool = this.activeTool
				this.activeTool = this.tools[this.activeToolIndex - 1]
				this.tools[this.activeToolIndex - 1] = activeTool

				this.activeToolIndex -= 1
			}
		},

		moveDownTool() {

			if (this.activeToolIndex < this.tools.length - 1) {
				const activeTool = this.activeTool
				this.activeTool = this.tools[this.activeToolIndex + 1]
				this.tools[this.activeToolIndex + 1] = activeTool

				this.activeToolIndex += 1
			}
		},

	switchTool() {

			this.editingCode = this.activeTool.code

			this.$set(this, 'editingParameters',
				this.JSONStringify(this.activeTool.parameters))
			
			Object.keys(this.toolInstances).forEach((id) => {
				const toolInstance = this.toolInstances[id]

				if (id === this.activeToolId) toolInstance.activate()
				else toolInstance.deactivate()
			})

			// update parameters with preserving value of corresponding ones		

			Object.keys(this.parameters).forEach((name) => {
					this.$set(this.parametersCache, name, this.parameters[name])
					this.$delete(this.parameters, name)
			})

			if (this.activeTool.parameters) {
				this.activeTool.parameters.forEach((param) => {
					
					let value

					if (this.parametersCache[param.name] !== undefined) {
						value = this.parametersCache[param.name]
					} else {
						value = param.default
					}

					this.$set(this.parameters, param.name, value)
				})
			}
		},

		downloadTool() {

			const toolInstance = this.toolInstances[this.activeToolId]

			const data = toolInstance.exportText()

			downloadAsFile({
				data,
				filename: `${this.activeTool.label}.js`
			})
		},

		loadToolFromURL(url) {
			axios.get(url)
				.then(({data}) => {

					const tool = Tool.parseToolText(data)

					if (this.tools.map(t => t.id).indexOf(tool.id) != -1) {
						console.error('Invalid Tool File: ', url)
						return
					}

					this.tools.push(tool)
					this.activeToolIndex = this.tools.length - 1

					const toolInstance = Tool.compile(tool, this.parameters)
					this.toolInstances[tool.id] = toolInstance
					toolInstance.activate()
				})
				.catch((err) => {
					console.error('Failed to Load Tool from ', url, err)
				})
		},

		resetTools() {
			localStorage.clear()
			location.reload()
		},

		openToolURLPrompt() {
			const url = prompt('Please Enter the URL', '')

			if (url) {
				this.loadToolFromURL(url)
			}
		},

		updateParameter(name, value) {
			this.parameters[name] = value
		},

		JSONStringify(obj) {
			return jsonBeautify(obj, null, 2, 20)
		}

	},

	data() {

		const tools = JSON.parse(localStorage.getItem('tools')) || ToolPresets.presets

		return {
			tools,
			parameters: {},
			parametersCache: JSON.parse(localStorage.getItem('parametersCache')) || {},
			editingCode: tools[0].code,
			editingParameters: this.JSONStringify(tools[0].parameters),
			activeToolIndex: parseInt(localStorage.getItem('activeToolIndex')) || 0,
			pan: false,
			showSidebar: true,
			toolEditMode: 'code',
			openToolEditorMenu: false,
			openSettingsMenu: false
		}
	},

	computed: {
		activeTool() {
			return this.tools[this.activeToolIndex]
		},
		activeToolId() {
			return this.activeTool.id
		},
		isDirty() {
			return this.editingCode != this.activeTool.code
				|| this.JSONStringify(this.activeTool.parameters) != this.editingParameters
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
		parameters: {
			handler() {
				const parameters = {...this.parametersCache, ...this.parameters}
				localStorage.setItem('parametersCache', JSON.stringify(parameters))
			},
			deep: true
		},
		parametersCache: {
			handler() {
				const parameters = {...this.parametersCache, ...this.parameters}
				localStorage.setItem('parametersCache', JSON.stringify(parameters))
			},
			deep: true
		},
		activeToolIndex(newTool, oldTool) {
			this.switchTool()
			localStorage.setItem('activeToolIndex', newTool)
		}
	},

	components: {
		Editor,
		ParameterControl
	}
}
</script>