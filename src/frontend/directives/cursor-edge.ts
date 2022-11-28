import { get, writable, type Writable } from 'svelte/store'

export namespace CursorEdge {
	export interface Store {
		top: boolean
		bottom: boolean
		right: boolean
		left: boolean
	}
	export interface Options {
		writable: Writable<CursorEdge.Store>
		threshold?: number
	}
}

function cursorEdge(
	node: HTMLElement,
	{
		writable,
		threshold = 5
	}: CursorEdge.Options
) {
	function reset() {
		writable.set({
			bottom: false,
			left: false,
			right: false,
			top: false
		})
	}

	function mouseEnter(e: MouseEvent) {
		reset()
		mouseMove(e)
		node.addEventListener('mousemove', mouseMove)
		node.addEventListener('mouseleave', unregister)
	}

	function mouseMove(e: MouseEvent) {
		const rect = node.getBoundingClientRect()
		const state = {
			top: e.clientY - rect.top < threshold,
			bottom: rect.bottom - e.clientY < threshold,
			left: e.clientX - rect.left < threshold,
			right: rect.right - e.clientX < threshold
		}
		const s = get(writable)
		if (
			state.top !== s.top
			|| state.bottom !== s.bottom
			|| state.left !== s.left
			|| state.right !== s.right
		)
			writable.set(state)
	}

	function unregister() {
		node.removeEventListener('mousemove', mouseMove)
		node.removeEventListener('mouseleave', unregister)
		reset()
	}

	node.addEventListener('mouseenter', mouseEnter)

	return {
		destroy() {
			reset()
			unregister()
			node.removeEventListener('mouseenter', mouseEnter)
		}
	}
}

cursorEdge.options = (o: CursorEdge.Options) => o
cursorEdge.writable = () => writable({
	bottom: false,
	left: false,
	right: false,
	top: false
})

export default cursorEdge