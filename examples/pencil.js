let path

tool.minDistance = 10

tool.onMouseDown = (e) => {
	path = new Path()
	path.add(e.point)
	path.strokeColor = 'skyblue'
	path.strokeWidth = 20
	path.strokeCap = 'round'
}

tool.onMouseDrag = (e) => {
	path.add(e.point)
}
