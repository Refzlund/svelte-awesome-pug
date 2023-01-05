<script context='module' lang='ts'>
	
</script>

<script lang="ts">
	import Input from '$frontend/components'

	import cursorEdge from '$frontend/directives/cursor-edge'
	import drag from '$frontend/directives/drag'
	import { writable } from 'svelte/store'
	import Component from './component.svelte'
	
	const atEdge = cursorEdge.writable()
	let w = 50
	let h = 50
	
	
</script>




<template lang="pug">

	Component(
		value='33' 
		style='color: red'
	).someclass

	old-test(
		"{w}" on:click!="{() => console.log('click')}" '{h}'
		style:margin='10px'
	)


	testing(something={w} abc='1')
		h3(ayo={h})

	simple(style :margin='25px')

	wrapper
		Input.Text.test
		Input.Number
		test-container(
			export:class=''
				:half-width={w == 50}
				:half-height={h == 50}
			--w='{w}vw'
			--h='{h}vh'
			export:style
				:padding='10px'
			use:cursorEdge={cursorEdge.options({ writable: atEdge })}
			use:drag={drag.options({ 
				callback: (x, y) => {
					w += x / 5
					w = Math.min(Math.max(w, 10), 90)
					h += y / 5
					h = Math.min(Math.max(h, 10), 90)
				}, 
				dragable: {
					horizontal: $atEdge.left || $atEdge.right,
					vertical: $atEdge.top || $atEdge.bottom
				}
			})}
			...$$restProps

			//- More testing props
			test=true
			export:i={() => console.log('ya')}
			yes='yes'
			some-array=[1, 2, 3]
			some-obj={{ yes: 'sir' }}
			{w}
		)

</template>




<style lang="scss">
	
	wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100vw;
		height: 100vh;
	}

	test-container {
		display: flex;
		align-items: center;
		justify-content: center;
		outline: 1px solid red;
		width: var(--w, 50vw);
		height:var(--h, 50vh);
	}
	
</style>