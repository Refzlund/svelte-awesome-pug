<script context='module' lang='ts'>
	
</script>

<script lang='ts'>
	
	export let value = '69'
	
	function fn(node: HTMLElement, [a,b]) {

	}

</script>




<template lang='pug'>
	
	h2(
		use:node=[1,2]
		export:class
		export:style
	) Other, value: {value}
	slot

</template>