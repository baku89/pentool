let circle, center

tool.onMouseDown = e => {
  circle = null
	center = e.point
}

tool.onMouseDrag = e => {		
	const d = e.point - center
	const r = d.length
	
	if (circle) circle.remove()
	circle = new Path.Circle(center, r)
	circle.fillColor = "red"
}
