import EventEmitter from 'eventemitter3'
import paper from 'paper'
import Mousetrap from 'mousetrap'
import localeval from 'localeval'

class Tool extends EventEmitter {

	constructor(project, events = {}, globalVariables) {

		super()

		this.globalVariables = globalVariables

		this.project = project
		this.el = project.view.element

		this.isDrawing = false
		this.isDragging = false

		this.on(events)
		
		this._onMousedown = this._onMousedown.bind(this)
		this._onMousemove = this._onMousemove.bind(this)
		this._onMouseup = this._onMouseup.bind(this)
	}

	disable() {
		this.el.removeEventListener('mousedown', this._onMousedown)
		window.removeEventListener('mousemove', this._onMousemove)
		window.removeEventListener('mouseup', this._onMouseup)
	}

	enable() {
		this.el.addEventListener('mousedown', this._onMousedown)
		window.addEventListener('mousemove', this._onMousemove)
		window.addEventListener('mouseup', this._onMouseup)
	}

	dispose() {
		if (this.isDrawing) {
			this.end()
		}
		this.disable()
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

		// end
		Mousetrap.unbind(['enter', 'esc'])
		this.emit('end')
	}

	_onMousedown(_e) {

		const e = this._transformMouseEvent(_e)

		this.isDragging = true

		if (!this.isDrawing) {

			// begin
			Mousetrap.bind(['enter', 'esc'], this.end.bind(this))
			this.isDrawing = true
			this.emit('begin', e)

		}

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

		const e = this._transformMouseEvent(_e)

		this.isDragging = false

		if (this.isDrawing) {
			this.emit('release', e)
		}
	}

	_transformMouseEvent(e) {

		const pos = new paper.Point(e.x, e.y)
		const mouse = this.project.activeLayer.globalToLocal(pos)

		this.globalVariables.mouse = mouse
		this.globalVariables.mouseX = mouse.x
		this.globalVariables.mouseY = mouse.y
		
		const {x, y} = mouse
		const {altKey, shiftKey} = e
 
		return {altKey, shiftKey, x, y}
	}

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

	console: console
}

Object.getOwnPropertyNames(Math).forEach(name => sandbox[name] = Math[name])

Tool.compileFromCode = (code) => {

	const codeToCompile = `
try {
	with (globalVariables) {
		${code}
	}
} catch (err) {}

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

	const globalVariables = {
		mouse: new paper.Point(0, 0),
		mouseX: 0,
		mouseY: 0
	}

	const scope = {...sandbox, globalVariables}

	const events = localeval(codeToCompile, scope)

	setInterval(() => {
		scope.globalVariables.mouseX += 1
	}, 10)


	return new Tool(paper.project, events, globalVariables)
}

export default Tool