import { writable, type Writable } from 'svelte/store'

export namespace Drag {
	export interface Options {
		callback?: (dx: number, dy: number) => void
		writable?: Writable<Store>
		dragable?: boolean | {
			left?: boolean
			right?: boolean
			top?: boolean
			bottom?: boolean
			horizontal?: boolean
			vertical?: boolean
		}
	}
	export interface Store {
		x: number
		y: number
	}
}

function drag(node: HTMLElement, options: Drag.Options) {
	let top = true, left = true, bottom = true, right = true
	
	function onDown(e: MouseEvent) {
		if (typeof options.dragable === 'object') {
			const {
				top: t = false,
				bottom: b = false,
				left: l = false,
				right: r = false,
				horizontal: h = false,
				vertical: v = false
			} = options.dragable

			top = t || v
			bottom = b || v
			left = l || h
			right = r || h

			if ((+top) + (+left) + (+bottom) + (+right) == 0)
				return
		}
		document.addEventListener('pointermove', onMove)
		document.addEventListener('pointerup', destroy)
	}

	function onMove(e: MouseEvent) {
		if (typeof options.dragable === 'boolean')
			if(!options.dragable) return
		
		let x = e.movementX, y = e.movementY
		
		if(!top)    y = Math.max(y, 0)		
		if(!bottom) y = Math.min(y, 0)		
		if(!left)   x = Math.max(x, 0)		
		if(!right)  x = Math.min(x, 0)		
		
		options.callback?.(x, y)
		options.writable?.update(v => {
			v.x = x
			v.y = y
			return v
		})
	}

	function destroy() {
		document.removeEventListener('pointermove', onMove)
		document.removeEventListener('pointerup', destroy)
		top = true
		left = true
		bottom = true
		right = true
	}

	node.addEventListener('pointerdown', onDown)

	return {
		destroy() {
			destroy()
			node.removeEventListener('pointerdown', onDown)
		},
		update(o: Drag.Options) {
			options = o
		}
	}
}

drag.options = (o: Drag.Options) => o
drag.writable = () => writable({ x: 0, y: 0 })

export default drag
