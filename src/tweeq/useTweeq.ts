import {provideActions} from './useActions'
import {provideAppStorage} from './useAppStorage'
import {ColorMode, provideTheme} from './useTheme'

interface TweeqOptions {
	colorMode?: ColorMode
	accentColor?: string
}

export function useTweeq(appId: string, options: TweeqOptions = {}) {
	const {appStorage} = provideAppStorage(appId)

	const accentColor = appStorage(
		'accentColor',
		options.accentColor || '#0000ff'
	)

	const colorMode = appStorage('colorMode', options.colorMode || 'auto')

	const theme = provideTheme(accentColor, colorMode)

	const actions = provideActions()

	window.addEventListener('keydown', e => {
		if (e.metaKey || e.ctrlKey) {
			e.preventDefault()
		}
	})

	return {appStorage, theme, ...actions}
}
