let path
let start, to, t0, t1

let guide
let state = 'begin'

function clamp(v, a, b) {
	return Math.min(Math.max(v, a), b)
}

function getT(a, b, m) {
	const dir = b.subtract(a)
	const maxLen = dir.length
	const diff = m.subtract(b)
	const n = dir.normalize()
	const diffLen = n.dot(diff)
	
	const t = clamp(diffLen / maxLen, 0, 1)
	const pt = a.add(dir.multiply(t))
	
	return pt
}

function createNewPath() {
	p = new Path()
	p.strokeWidth = 10
	p.strokeColor = p.fillColor = "orange"
	p.strokeCap = p.strokeJoin = 'round'
	
	return p
}

tool.onMouseDown = e => {
	if (state === 'begin') {
		
		path = createNewPath()
		path.moveTo(e.point)
		start = e.point
		
	} else if (state === 'corner') {
		path.lineTo(e.point)
		to = e.point
		t0 = start
		
	} else if (state === 'end') {
		start = to
		to = e.point
		t1 = e.point
	}
	
	tool.onMouseDrag(e)
}

tool.onMouseDrag = e => {
	if (state === 'corner') {
		t0 = getT(start, to, e.point)		
	} else if (state === 'end') {
		t1 = getT(start, to, e.point)
	}
	
	if (guide) guide.remove()
	
	if (state === 'end') {
		guide = createNewPath()
		guide.moveTo(start)
		guide.lineTo(to)
		guide.lineTo(t1)
		if (t1.getDistance(start) < 0.0001) {
			guide.lineTo(t0)
		} else {
			guide.quadraticCurveTo(start, t0)
		}
	}
}

tool.onMouseUp = e => {
	if (state === 'begin') {
		state = 'corner'
		
	} else if (state === 'corner') {
		state = 'end'
		start = to
		
	} else if (state === 'end') {
		path = createNewPath()
		path.moveTo(start)
		path.lineTo(to)
		path.lineTo(t1)
		path.quadraticCurveTo(start, t0)
		
		if (guide) guide.remove()
		
		start = to
		t0 = t1
	}
}