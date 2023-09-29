import {
	applyTheme,
	argbFromHex,
	hexFromArgb,
	themeFromSourceColor,
} from '@material/material-color-utilities'
import {kebab} from 'case'
import {inject, InjectionKey, provide, Ref} from 'vue'

export interface Theme {
	// Colors
	colorPrimary: string
	colorOnPrimary: string
	colorPrimaryContainer: string
	colorOnPrimaryContainer: string
	colorBg: string
	colorText: string
	colorPane: string
	colorPaneBorder: string

	// Font
	fontCode: string
	fontHeading: string
	fontUi: string
	fontNumeric: string

	// UI Metrics
	paneBorderRadius: string
	inputHeight: string
}

const ThemeKey: InjectionKey<Theme> = Symbol('tqTheme')

export function provideTheme(accentColor: Ref<string>) {
	// Get the theme from a hex color
	const materialTheme = themeFromSourceColor(argbFromHex(accentColor.value))

	const dark = false

	const scheme = dark ? materialTheme.schemes.dark : materialTheme.schemes.light

	const theme: Theme = {
		colorPrimary: toColor(scheme.primary),
		colorPrimaryContainer: toColor(scheme.primaryContainer),
		colorOnPrimaryContainer: toColor(scheme.onPrimaryContainer),
		colorOnPrimary: toColor(scheme.onPrimary),
		colorText: toColor(scheme.onBackground),
		colorBg: toColor(scheme.background),
		colorPane: toColor(scheme.background, 0.95),
		colorPaneBorder: toColor(scheme.onBackground, 0.12),

		fontCode: "'Fira Code', monospace",
		fontHeading: 'Inter, sans-serif',
		fontUi: 'Inter, system-ui, sans-serif',
		fontNumeric: 'Inter, system-ui, sans-serif',

		paneBorderRadius: '20px',
		inputHeight: '16px',
	}

	// Promote all
	for (const [key, value] of Object.entries(theme)) {
		const varName = '--tq-' + kebab(key)
		document.body.style.setProperty(varName, value)
	}

	provide(ThemeKey, theme)

	// Apply the theme to the body by updating custom properties for material tokens
	applyTheme(materialTheme, {target: document.body, dark})

	return theme
}

// function

function toColor(color: number, opacity?: number) {
	let alpha = ''

	if (opacity !== undefined) {
		alpha = Math.round(opacity * 255)
			.toString(16)
			.padStart(2, '0')
	}

	return `${hexFromArgb(color)}${alpha}`
}

export function useTheme() {
	const theme = inject(ThemeKey)

	if (!theme) {
		throw new Error('theme is not provided')
	}

	return theme
}
