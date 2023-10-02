export type Color = string
export type ColorChannel = 'r' | 'g' | 'b' | 'a' | 'h' | 's' | 'v'
export type ColorPicker =
	| ColorChannel // For slider
	| `${ColorChannel}${ColorChannel}` // For 2D pad
export type ColorSpace = 'rgb' | 'hsv' | 'hex'

export function colorChannelToIndex(channel: ColorChannel): number {
	switch (channel) {
		case 'r':
			return 0
		case 'g':
			return 1
		case 'b':
			return 2
		case 'a':
			return 3
		case 'h':
			return 4
		case 's':
			return 5
		case 'v':
			return 6
	}
}

export type RGB = [r: number, g: number, b: number]
export type RGBA = [r: number, g: number, b: number, a: number]
export type HSV = [h: number, s: number, v: number]

export type Channels = {
	r: number
	g: number
	b: number
	a: number
	h: number
	s: number
	v: number
}

export type ColorUIComponent =
	| [type: 'slider', axis: ColorChannel]
	| [type: 'pad', axes: [ColorChannel, ColorChannel]]
	| [type: 'values']
	| [type: 'presets']

export type ColorUI = ColorUIComponent[]

export const DefualtColorUI: ColorUI = [
	['pad', ['s', 'v']],
	['slider', 'h'],
	['slider', 'a'],
	['values'],
]

export interface InputColorProps {
	modelValue: string
	ui?: ColorUIComponent[]
	presets?: string[]
}

// https://gist.github.com/mjackson/5311256

/**
 * Converts an RGB color value to HSV. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes r, g, and b are contained in the set [0, 1] and
 * returns h, s, and v in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSV representation
 */
export function rgb2hsv([r, g, b]: RGB): HSV {
	const max = Math.max(r, g, b)
	const min = Math.min(r, g, b)

	const v = max

	const d = max - min
	const s = max === 0 ? NaN : d / max

	let h: number
	if (max === min) {
		h = NaN // achromatic
	} else {
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0)
				break
			case g:
				h = (b - r) / d + 2
				break
			default:
				// case b:
				h = (r - g) / d + 4
				break
		}

		h /= 6
	}

	return [h, s, v]
}

/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  v       The value
 * @return  Array           The RGB representation
 */
export function hsv2rgb([h, s, v]: HSV): RGB {
	let r, g, b

	const i = Math.floor(h * 6)
	const f = h * 6 - i
	const p = v * (1 - s)
	const q = v * (1 - f * s)
	const t = v * (1 - (1 - f) * s)

	switch (i % 6) {
		case 0:
			;(r = v), (g = t), (b = p)
			break
		case 1:
			;(r = q), (g = v), (b = p)
			break
		case 2:
			;(r = p), (g = v), (b = t)
			break
		case 3:
			;(r = p), (g = q), (b = v)
			break
		case 4:
			;(r = t), (g = p), (b = v)
			break
		default:
			// case 5:
			;(r = v), (g = p), (b = q)
			break
	}

	return [r, g, b]
}
