const rawData = `apple	20
banana	32
melon	54`

const colors = [
	'#3333ff',
	'#00bbfa',
	'dodgerblue',
	'lightblue',
	'lightskyblue',
	'mediumblue',
]

const radius = 148
const width = 164

const data = rawData
	.split('\n')
	.map((l) => l.split('	').map((v, i) => (i ? parseFloat(v) : v)))
const sum = data.reduce((s, [, v]) => s + v, 0)
const center = new Point(radius + width / 2, radius + width / 2)

function drawArc(name, start, end, color) {
	const startAngle = start * Math.PI * 2
	const throughAngle = ((start + end) / 2.0) * Math.PI * 2
	const endAngle = end * Math.PI * 2

	const startPt =
		center + new Point(Math.sin(startAngle), -Math.cos(startAngle)) * radius
	const throughPt =
		center + new Point(Math.sin(throughAngle), -Math.cos(throughAngle)) * radius
	const endPt =
		center + new Point(Math.sin(endAngle), -Math.cos(endAngle)) * radius

	const arc = new Path.Arc(startPt, throughPt, endPt)

	arc.strokeColor = color
	arc.strokeWidth = width

	const text = new PointText(throughPt)
	text.fontSize = width * 0.2
	text.justification = 'center'
	text.content = name
}

let accum = 0
let colorIndex = 0

for (const [name, value] of data) {
	console.log(name, value)

	drawArc(name, accum, accum + value / sum, colors[colorIndex])

	accum += value / sum
	colorIndex = ++colorIndex % colors.length
}
