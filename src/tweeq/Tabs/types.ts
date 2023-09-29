export interface PushTabOptions {
	name: string
	isDisabled: boolean
	id: string
	paneId: string
}

export interface Tab extends PushTabOptions {
	isActive?: boolean
}

export interface Tabs {
	cacheLifetime: number
	options: {
		useUrlFragment?: boolean
		defaultTabHash?: string | null
	}
}

export interface TabsState {
	activeId: string
	lastActiveId: string
	tabs: Array<Tab>
}

export type AddTab = (tab: PushTabOptions) => void

export type UpdateTab = (computedId: string, tab: PushTabOptions) => void

export type DeleteTab = (computedId: string) => void

export interface ExpiringStorage {
	get(key: string): string | null
	set(key: string, value: string, ttl: number): void
}
