<template>
	<ul class="ParameterGrid">
		<slot />
	</ul>
</template>

<style lang="stylus" scoped>

.ParameterGrid
	display grid
	grid-template-columns minmax(60px, max-content) 1fr
	grid-gap 9px
	padding-left 3px
</style>
