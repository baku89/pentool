import EventEmitter from 'eventemitter3'
import paper from 'paper'
import Mousetrap from 'mousetrap'
import localeval from 'localeval'
import linesIntersection from 'lines-intersection'
import jsonBeautify from 'json-beautify'
import Color from 'color'

class Tool extends EventEmitter {

	constructor(tool, project, parameters) {

		super()

		this.code = tool.code
		this.metadata = {...tool}
		delete this.metadata.code

		this.project = project
		this.parameters = parameters
		this.el = project.view.element

		this.globalVariables = {...globalVariables}

		const codeToCompile = createEvalChunk(this.code)
		const scope = {...sandbox, globalVariables: this.globalVariables, parameters}

		const events = localeval(codeToCompile, scope)

		

		this.isDrawing = false
		this.isDragging = false
		this.isPressing = false

		this.on(events)
		
		this._onMousedown = this._onMousedown.bind(this)
		this._onMousemove = this._onMousemove.bind(this)
		this._onMouseup = this._onMouseup.bind(this)
	}

	pause() {
		this.el.removeEventListener('mousedown', this._onMousedown)
		window.removeEventListener('mousemove', this._onMousemove)
		window.removeEventListener('mousewheel', this._onMousemove)
		window.removeEventListener('mouseup', this._onMouseup)
	}

	resume() {
		this.el.addEventListener('mousedown', this._onMousedown)
		window.addEventListener('mousemove', this._onMousemove)
		window.addEventListener('mousewheel', this._onMousemove)
		window.addEventListener('mouseup', this._onMouseup)
	}

	deactivate() {
		if (this.isDrawing) {
			this.end()
		}
		this.pause()
	}

	activate() {
		this.resume()
	}
	

	on(...args) {
		if (typeof args[0] === 'string') {
			super.on.apply(this, args)
		} else {
			Object.keys(args[0]).forEach((key) => {
				super.on(key, args[0][key])
			})
		}
	}

	end() {
		this.isDrawing = false
		this.isDragging = false
		this.isPressiong = false

		this.project.layers.guide.removeChildren()
		this.project.layers.guide.bringToFront()

		// end
		Mousetrap.unbind(['enter', 'esc'])
		this.emit('end')
	}

	exportText() {
		const metadata = jsonBeautify(this.metadata, null, 2, 20)
		const text =  `/*\n${metadata}\n*/\n\n${this.code}`
		return text
	}

	_onMousedown(_e) {

		const e = this._transformMouseEvent(_e)

		this.isDragging = true
		this.isPressing = true

		if (!this.isDrawing) {

			// begin
			Mousetrap.bind(['enter', 'esc'], this.end.bind(this))
			this.isDrawing = true
			this.globalVariables.pressCount = 0
			
			this.emit('begin', e)
		}

		this.globalVariables.pressCount += 1
		this.emit('press', e)
	}

	_onMousemove(_e) {

		const e = this._transformMouseEvent(_e)

		if (this.isDrawing) {
			if (this.isDragging) {
				this.emit('drag', e)
			} else {
				this.emit('move', e)
			}
		}
	}

	_onMouseup(_e) {

		if (!this.isPressing) {
			return
		}
		
		this.isDragging = false
		this.isPressing = false

		const e = this._transformMouseEvent(_e)

		if (this.isDrawing) {
			this.emit('release', e)
		}
	}

	_transformMouseEvent(e) {

		const pos = new paper.Point(e.x, e.y)
		const mouse = this.project.view.viewToProject(pos)

		this.globalVariables.mouse = mouse
		this.globalVariables.mouseX = mouse.x
		this.globalVariables.mouseY = mouse.y
		
		const {x, y} = mouse
		const {altKey, shiftKey} = e
 
		return {altKey, shiftKey, x, y}
	}

}

const globalVariables = {
	mouse: new paper.Point(0, 0),
	mouseX: 0,
	mouseY: 0,
	pressCount: 0,
	GUIDE: '#3e999f'
} 

const sandbox = {
	// paper
	Point: paper.Point,
	Group: paper.Group,
	Path: paper.Path,
	Matrix: paper.Matrix,

	Line: paper.Path.Line,
	Circle: paper.Path.Circle,
	Rectangle: paper.Path.Rectangle,
	Ellipse: paper.Path.Ellipse,
	Arc: paper.Path.Arc,
	RegularPolygon: paper.Path.RegularPolygon,
	Star: paper.Path.Star,

	Color,

	Guide: {

		add(item, mode = 'stroke') {

			item.addTo(paper.project.layers.guide)

			if (mode == 'stroke') {
				item.strokeColor = '#3e999f'
				item.strokeWidth = 0.5
				item.fillColor = null
				item.strokeScaling = false
			} else {
				item.fillColor = '#3e999f'
				item.strokeWidth = null
			}

			return item
		},

		addPoint(center, mode = 'fill') {

			let item = new paper.Path.Circle(center, 3)
			item.applyMatrix = false
			item.scaling =  1 / paper.project.view.scaling.x
			item.addTo(paper.project.layers.guide)

			if (mode == 'stroke') {
				item.strokeColor = '#3e999f'
				item.strokeWidth = 0.5
				item.strokeScaling = false
				item.fillColor = 'white'
			} else {
				item.fillColor = '#3e999f'
				item.strokeWidth = null
			}
			item.data.isMarker = true

			return item
		},

		addLine(from, to, width = 0.5) {

			let item = new paper.Path.Line(from, to)
			item.addTo(paper.project.layers.guide)
			item.strokeColor = '#3e999f'
			item.strokeWidth = 0.5
			item.strokeScaling = false
			item.data.originalStrokeWidth = width

			return item
		}

	},

	getIntersection(p0, p1, p2, p3) {
		const result = linesIntersection(p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y)
		return result ? new paper.Point(result[0], result[1]) : null
	},

	console: console,

	// math
	degrees: rad => rad * 180 / Math.PI,
	radians: deg => deg* Math.PI / 180,

	PI_2: Math.PI * 2
}

Object.getOwnPropertyNames(Math).forEach(name => sandbox[name] = Math[name])

function createEvalChunk(code) {
	
	return `try {
	with (globalVariables) {
		with (parameters) {
			${code}
		}
	}
} catch (err) {
	console.error(err)
}

let events = {}

try {
	if (begin) events.begin = begin
} catch (err) {}

try {
	if (end) events.end = end
} catch (err) {}

try {
	if (press) events.press = press
} catch (err) {}

try {
	if (release) events.release = release
} catch (err) {}

try {
	if (move) events.move = move
} catch (err) {}

try {
	if (drag) events.drag = drag
} catch (err) {}

events`
}

Tool.compile = (tool, parameters) => {	

	return new Tool(tool, paper.project, parameters)
}

Tool.parseToolText = (text) => {

	const result = text.match(/\/\*([\s\S]*?)\*\/[\n]*([\s\S]*)/m)
	const code = result[2]

	let metadata
	try {
		metadata = JSON.parse(result[1])
	} catch (err) {
		console.error('Invalid metadata', result[1])
	}

	metadata.parameters = metadata.parameters || []

	return {...metadata, code}
}

export default Tool