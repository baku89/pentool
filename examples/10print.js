// https://10print.org

const size = 68

const col = 10
const row = 10

Math.seedrandom(13)

for (let y = 0; y < row; y++) {
	for (let x = 0; x < col; x++) {
		const left = x * size
		const top = y * size

		const inverted = Math.random() > 0.5

		const line = inverted
			? new Path.Line([left, top], [left + size, top + size])
			: new Path.Line([left + size, top], [left, top + size])

		line.strokeColor = 'pink'
		line.strokeCap = 'round'
		line.strokeWidth = 10
	}
}
