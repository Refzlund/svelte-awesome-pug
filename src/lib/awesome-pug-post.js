/** 
 * @type {(str: string, position: number, text: string, deleteCount: number | undefined) => string} 
*/
function insert(str, position, text, deleteCount = 0) {
	return str.slice(0, position) + text + str.slice(position + deleteCount, str.length)
}

export default {
	/** @type {(input: { content: string, filename: string }) => { code: string }} */ 
	markup: ({ content = '' }) => {
	
		const regex = /(\<\/?[A-Z]+[^> :\t\n\r]*)((\:[A-Z]+[^> :\t\n\r]*)+)/g

		/** @type {RegExpExecArray} */
		let a

		while ((a = regex.exec(content))) {
			content = insert(
				content,
				a.index + a[1].length,
				a[2].replaceAll(':', '.'),
				a[2].length
			)
		}

		return { code: content }
	}
}