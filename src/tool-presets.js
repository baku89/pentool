import uid from 'uid'

const presets = [
	{
		"id": "pencil",
		"label": "Pencil",
		"icon": "✎",
		"code": "const BLACK = '#282a2e'\nconst GUIDE = '#3e999f'\n\nlet path\n\nfunction press() {\n\tpath = new Path()\n\tpath.strokeWidth = 2\n\tpath.strokeColor = BLACK\n\t\n\tpath.moveTo(mouse)\n}\n\nfunction drag() {\n\tpath.lineTo(mouse)\n}"
	},
	{
		"id": "line",
		"label": "Line",
		"icon": "ᛋ",
		"code": "const BLACK = '#282a2e'\n\nlet path\n\nfunction begin() {\n\n\tpath = new Path()\n\tpath.strokeColor = BLACK\n\tpath.strokeWidth = 2\n\n\tpath.moveTo(mouse)\n}\n\nfunction release() {\n\n\tpath.lineTo(mouse)\n}\n\nfunction move() {\n\n\tpath.lastSegment.point = mouse\n}\n\nfunction drag() {\n\n\tpath.lastSegment.point = mouse\n}\n\nfunction end() {\n\n\tpath.removeSegment(path.segments.length - 1)\n}"
	},
	{
		"id": "centered-circle",
		"label": "Centered Circle",
		"icon": "●",
		"code": "const BLACK = '#282a2e'\nconst GUIDE = '#3e999f'\n\nlet circle, center\n\nfunction press() {\n\t\t\n\tcenter = mouse\n}\n\nfunction drag() {\n\t\t\n\tconst d = mouse.subtract(center)\n\tconst r = d.length\n\t\n\tif (circle) circle.remove()\n\tcircle = new Path.Circle(center, r)\n\tcircle.fillColor = BLACK\n}\n\nfunction release() {\n\tcircle = null\n}"
	},
	{
		"id": "bezier",
		"label": "Bezier",
		"icon": "✑",
		"code": "const BLACK = '#282a2e'\nconst GUIDE = '#3e999f'\n\nlet path\nlet guides, anchor, handleIn, handleOut, tangent\nlet anchorPt\n\nfunction begin() {\n\n\tpath = new Path()\n\tpath.strokeColor = BLACK\n\tpath.strokeWidth = 2\n\n\tpath.moveTo(mouse)\n\t\n\tif (!guides) {\n\t\t\n\t\tguides = new Group()\n\t\t\n\t\tanchor = new Circle(mouse, 3)\n\t\tanchor.fillColor = GUIDE\n\t\t\n\t\thandleIn = anchor.clone()\n\t\thandleIn.fillColor = null\n\t\thandleIn.strokeColor = GUIDE\n\t\thandleIn.strokeWidth = 1\n\t\t\n\t\thandleOut = handleIn.clone()\n\t\t\n\t\ttangent = new Path()\n\t\ttangent.strokeColor = GUIDE\n\t\ttangent.strokeWidth = 1\n\t\ttangent.moveTo(mouse)\n\t\ttangent.lineTo(mouse)\n\t\ttangent.lineTo(mouse)\n\t\t\n\t\t\n\t\tguides.addChildren([\n\t\t\tanchor,\n\t\t\thandleIn,\n\t\t\thandleOut,\n\t\t\ttangent\n\t\t])\n\t}\n}\n\nfunction press() {\n\t\n\tanchor.position = mouse\n\ttangent.segments[1].point = mouse\n\t\n\tanchorPt = mouse\n}\n\nfunction release() {\n\t\n\tguides.visible = false\n\tpath.cubicCurveTo(mouse, mouse, mouse)\n}\n\nfunction move() {\n\n\tpath.lastSegment.point = mouse\n}\n\nfunction drag({altKey}) {\n\t\t\n\tconst d = mouse.subtract(anchorPt)\n\t\n\tpath.lastSegment.handleOut = anchorPt\n\thandleOut.position = mouse\n\ttangent.lastSegment.point = mouse\n\t\n\tif (!altKey) {\n\t\t\t\n\t\t const handleInPt = anchorPt.subtract(d)\n\n\t\tpath.lastSegment.handleIn.set(-d.x, -d.y)\n\t\thandleIn.position = handleInPt\n\t\ttangent.firstSegment.point = handleInPt\n\t}\n\t\n\tguides.visible = true\n}\n\nfunction end() {\n\n\tpath.removeSegment(path.segments.length - 1)\n\t\n\tif (guides) {\n\t\tguides.remove()\n\t\tguides = null\n\t}\n}"
	},
	{
		"id": "spray",
		"label": "Spray",
		"icon": "∵",
		"code": "const BLACK = [40, 42, 46] // #282a2e\nconst WHITE = [249, 250, 249] // #F9FAF9\n\nfunction drag() {\n\t\t\n\tconst radius = 5 + random() * 20\n\tconst offset = new Point(\n\t\t(random() - 0.5) * 40,\n\t\t(random() - 0.5) * 40\n\t)\n\t\n\tconst pt = mouse.add(offset)\n\tconst t = random()\n\t\n\tlet circle = new Circle(pt, radius)\n\t\n\tconst r = floor(BLACK[0] * (1-t) + WHITE[0] * t)\n\tconst g = floor(BLACK[1] * (1-t) + WHITE[1] * t)\n\tconst b = floor(BLACK[2] * (1-t) + WHITE[2] * t)\n\t\n\tcircle.fillColor = 'rgb(' + r\t+ ', ' + g + ', ' + b + ')'\n}"
	},
	{
		"id": "0tnnmfvsr3",
		"label": "Graph",
		"icon": "✣",
		"code": "const BLACK = '#282a2e'\nconst GUIDE = '#3e999f'\nconst WHITE = '#f9faf9'\n\nlet points, lines\n\nfunction begin() {\n\tpoints = []\n}\n\nfunction press() {\n\n\tcircle = new Circle(mouse, 3)\n\tcircle.fillColor = BLACK\n}\n\nfunction release() {\n\t\t\n\tcircle = null\n\t\n\tpoints.push(mouse)\n\t\n\tlines = points.map((pt) => {\n\t\t\t\n\t\tconst line = new Line(pt, mouse)\n\t\tline.strokeWidth = 1\n\t\tline.strokeColor = BLACK\n\t\t\n\t\treturn line\n\t})\n}\n\nfunction move() {\n\t\t\n\tif (circle) {\n\t\tcircle.position = mouse\n\t}\n\t\n\tif (lines) {\n\t\tlines.forEach((line) => {\n\t\t\tline.lastSegment.point = mouse\n\t\t})\n\t}\n}\n\nfunction drag(e) {\n\t\t\n\tmove(e)\n}\n\nfunction end() {\n\t\t\n\tif (lines) {\n\t\tlines.forEach(line => line.remove())\n\t}\n\t\n\tpoints = lines = circle = null\n}"
	},
	{
		"id": "vbmsttd8x2",
		"label": "Triangle Strip",
		"icon": "〼",
		"code": "const BLACK = [40, 42, 46] // #282a2e\nconst WHITE = [249, 250, 249] // #F9FAF9\nconst GUIDE = '#3e999f'\n\nlet pt0, pt1, triangle\nlet guideEdge\n\nfunction begin() {\n\t\n\tguideEdge = new Line(mouse, mouse)\n\tguideEdge.strokeWidth = 3\n\tguideEdge.strokeColor = GUIDE\n}\n\nfunction release() {\n\t\t\n\tpt0 = pt1\n\tpt1 = mouse\n\t\n\tif (pt0 && pt1) {\n\t\ttriangle = new Path()\n\t\ttriangle.fillColor = genRandomColor()\n\t\ttriangle.moveTo(pt0)\n\t\ttriangle.lineTo(pt1)\n\t\ttriangle.lineTo(mouse)\n\t\t\n\t\tguideEdge.firstSegment.point = pt0\n\t\tguideEdge.lastSegment.point = pt1\n\t\tguideEdge.bringToFront()\n\t}\n\t\t\n}\n\nfunction move() {\n\t\t\n\tif (guideEdge && !pt0 && pt1) {\n\t\tguideEdge.lastSegment.point = mouse\n\t}\n\t\n\tif (triangle) {\n\t\ttriangle.lastSegment.point = mouse\n\t}\n\t\t\n}\n\nfunction drag(e) {\n\t\n\tmove(e)\n}\n\nfunction end() {\n\t\t\n\tif (triangle) triangle.remove()\n\tif (guideEdge) guideEdge.remove()\n\t\n\tpt0 = pt1 = triangle = guideEdge = null\n}\n\n\nfunction genRandomColor() {\n\t\n\tconst t = random()\n\t\n\tconst r = floor(BLACK[0] * (1-t) + WHITE[0] * t)\n\tconst g = floor(BLACK[1] * (1-t) + WHITE[1] * t)\n\tconst b = floor(BLACK[2] * (1-t) + WHITE[2] * t)\n\t\n\treturn 'rgb(' + r\t+ ', ' + g + ', ' + b + ')'\n}"
	},
	{
		"id": "71ax8d88re",
		"label": "Arc Strip",
		"icon": "⌒",
		"code": "// Inspired by Raven Kwok's study:\n// https://twitter.com/RavenKwok/status/1007881883059814407\n\nconst BLACK = '#282a2e'\nconst GUIDE = '#3e999f'\n\nlet pt0, pt1, arc\nlet circle0, circle1, mouseCircle\n\nfunction press() {\n\t\t\n\tmouseCircle = new Circle(mouse, 5)\n\tmouseCircle.fillColor = GUIDE\n}\n\nfunction release() {\n\t\n\tpt0 = pt1\n\tpt1 = mouse\n\t\n\tif (pt0 && pt1) {\n\t\tarc = genArc()\n\t}\n\n\tif (circle0) {\n\t\t circle0.fillColor = BLACK\n\t}\n\t\n\tcircle0 = circle1\n\tcircle1 = mouseCircle\n}\n\nfunction move() {\n\t\n\tif (arc) {\n\t\tarc.remove()\n\t\tarc = genArc()\n\t}\n\t\n}\n\nfunction drag(e) {\n\tmove(e)\n\t\n\tmouseCircle.position = mouse\n}\n\nfunction end() {\n\t\n\tif (arc) arc.remove()\n\t\n\tif (circle0) circle0.fillColor = BLACK\n\tif (circle1) circle1.fillColor = BLACK\n\t\n\tpt0 = pt1 = arc = null\n}\n\nfunction genArc() {\n\t\n\tlet item\n\t\n\tif (pt1.equals(pt0) || pt1.equals(mouse)) {\n\t\titem = new Line(pt0, mouse) \n\t} else {\n\t\titem = new Arc(pt0, pt1, mouse)\n\t}\n\t\n\titem.strokeColor = BLACK\n\titem.strokeWidth = 2\n\titem.sendToBack()\n\t\n\treturn item\n}"
	}
]

function createNew () {
	return {
		id: uid(10),
		label: 'New Tool',
		icon: 'N',
		code: `const BLACK = '#282a2e'
const GUIDE = '#3e999f'
const WHITE = '#f9faf9'

function begin() {

}

function press() {

}

function release() {

}

function move() {

}

function drag() {

}

function end() {

}`
	}
}

export default {presets, createNew}