<script lang="ts" setup>
import {isEqual, mapValues} from 'lodash'
import Regl, {DrawConfig} from 'regl'
import REGL from 'regl'
import {computed, onMounted, onUnmounted, ref, watch} from 'vue'

const REGL_QUAD_DEFAULT: DrawConfig = {
	vert: `
	precision mediump float;
	attribute vec2 position;
	varying vec2 uv;
	void main() {
		uv = position / 2.0 + 0.5;
		gl_Position = vec4(position, 0, 1);
	}`,
	attributes: {
		position: [-1, -1, 1, -1, -1, 1, 1, 1],
	},
	depth: {
		enable: false,
	},
	count: 4,
	primitive: 'triangle strip',
}

interface Props {
	fragmentString: string
	uniforms: Record<
		string,
		number | number[] | readonly [number, number, number, number]
	>
}

const props = withDefaults(defineProps<Props>(), {
	fragmentString: `
		precision mediump float;
		varying vec2 uv;
		void main() { gl_FragColor = vec4(uv, 0, 1); }`,
	uniforms: () => ({}),
})

const $canvas = ref<null | HTMLCanvasElement>(null)

const regl = ref<null | REGL.Regl>(null)

onMounted(() => {
	if (!$canvas.value) return

	regl.value = Regl({
		attributes: {
			depth: false,
			premultipliedAlpha: false,
		},
		canvas: $canvas.value,
	})
})

onUnmounted(() => regl.value?.destroy())

const reglUniforms = ref<Record<string, any>>({})

watch(
	() => [props.uniforms, regl.value] as const,
	([uniforms, regl]) => {
		const keys = Object.keys(uniforms)
		const oldKeys = Object.keys(reglUniforms.value)

		if (isEqual(keys, oldKeys)) return
		if (!regl) return

		const prop = regl.prop as any

		reglUniforms.value = mapValues(props.uniforms, (_, key) => prop(key))
	},
	{immediate: true}
)

const drawCommand = computed(() => {
	if (!regl.value) return null

	return regl.value({
		...REGL_QUAD_DEFAULT,
		frag: props.fragmentString,
		uniforms: reglUniforms.value,
	})
})

watch(
	() => [drawCommand.value, props.uniforms] as const,
	([draw, uniforms]) => {
		// TODO: Fix this
		try {
			draw && draw(uniforms)
		} catch {
			return
		}
	},
	{immediate: true}
)
</script>

<template>
	<canvas ref="$canvas" />
</template>
