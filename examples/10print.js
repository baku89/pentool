// https://10print.org

const size = +25
const col = +38
const row = +20
const seed = -1.1

for (let y = 0; y < row; y++) {
	for (let x = 0; x < col; x++) {
		const left = x * size
		const top = y * size

		const index = ((x + y) * (x + y + 1)) / 2 + y
		Math.seedrandom(index + seed)

		const inverted = Math.random() > 0.5

		const line = inverted
			? new Path.Line([left, top], [left + size, top + size])
			: new Path.Line([left + size, top], [left, top + size])

		line.strokeColor = 'pink'
		line.strokeCap = 'round'
		line.strokeWidth = +5
	}
}
