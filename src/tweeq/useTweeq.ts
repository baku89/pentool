import {provideAppStorage} from './useAppStorage'
import {provideTheme} from './useTheme'

interface TweeqOptions {
	scheme?: 'dark' | 'light' | 'auto'
	accentColor?: string
}

export function useTweeq(appId: string, options: TweeqOptions = {}) {
	const {appStorage} = provideAppStorage(appId)

	const accentColor = appStorage(
		'accentColor',
		options.accentColor || '#0000ff'
	)

	const theme = provideTheme(accentColor)

	return {appStorage, theme}
}
