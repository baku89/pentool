import {
	applyTheme,
	argbFromHex,
	hexFromArgb,
	themeFromSourceColor,
} from '@material/material-color-utilities'
import {useColorMode} from '@vueuse/core'
import {kebab} from 'case'
import {
	computed,
	inject,
	InjectionKey,
	provide,
	readonly,
	Ref,
	ref,
	watch,
} from 'vue'

export type ColorMode = 'light' | 'dark' | 'auto'

export interface Theme {
	// Colors
	colorMode: 'light' | 'dark'
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

const ThemeKey: InjectionKey<Readonly<Ref<Theme>>> = Symbol('tqTheme')

export function provideTheme(
	accentColor: Ref<string>,
	colorMode: Ref<ColorMode>
): Ref<Theme> {
	const browserColorMode = useColorMode()

	const computedColorMode = computed<'light' | 'dark'>(() => {
		if (colorMode.value === 'auto') {
			return browserColorMode.value === 'dark' ? 'dark' : 'light'
		} else {
			return colorMode.value
		}
	})

	const theme = ref<Theme>(null as any)

	watch(
		[accentColor, computedColorMode],
		([accentColor, colorMode]) => {
			// Get the theme from a hex color
			const materialTheme = themeFromSourceColor(argbFromHex(accentColor))

			const dark = colorMode === 'dark'

			const colors = dark
				? materialTheme.schemes.dark
				: materialTheme.schemes.light

			theme.value = {
				colorMode,
				colorPrimary: toColor(colors.primary),
				colorPrimaryContainer: toColor(colors.primaryContainer),
				colorOnPrimaryContainer: toColor(colors.onPrimaryContainer),
				colorOnPrimary: toColor(colors.onPrimary),
				colorText: toColor(colors.onBackground),
				colorBg: toColor(colors.background),
				colorPane: toColor(colors.background, 0.95),
				colorPaneBorder: toColor(colors.onBackground, 0.12),

				fontCode: "'Fira Code', monospace",
				fontHeading: 'Inter, sans-serif',
				fontUi: 'Inter, system-ui, sans-serif',
				fontNumeric: 'Inter, system-ui, sans-serif',

				paneBorderRadius: '20px',
				inputHeight: '16px',
			}

			// Promote all as CSS variabbles
			for (const [key, value] of Object.entries(theme.value)) {
				const varName = '--tq-' + kebab(key)
				document.body.style.setProperty(varName, value)
			}

			// Apply the theme to the body by updating custom properties for material tokens
			applyTheme(materialTheme, {target: document.body, dark})
		},
		{immediate: true}
	)

	const readonlyTheme = readonly(theme)

	provide(ThemeKey, readonlyTheme)

	return readonlyTheme
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
