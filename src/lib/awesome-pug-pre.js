/** 
 * @type {(str: string, position: number, text: string, deleteCount: number | undefined) => string} 
*/
function insert(str, position, text, deleteCount = 0) {
	return str.slice(0, position) + text + str.slice(position + deleteCount, str.length)
}

const isEmptyRegex = /[ \t\n\r]/

/** @type {(str: string, pos: number, opening: string, closing: string ) => { begins: number, ends: number } | undefined} */
function findClosingIndex(str, pos, opening = '{', closing = '}') {
	while (str[pos] !== opening) {
		if(!str[pos]) 
			throw new Error('There was no opening bracket from this position')
		pos++
	}

	let level = 1
	for (let index = pos + 1; index < str.length; index++) {
		if (str[index] === closing && str[index - 1] !== '\\')
			level--
		else if (str[index] === opening && str[index - 1] !== '\\')
			level++
		
		if (level === 0)
		return { begins: pos, ends: index + 1 }
	}
	return undefined
}

/** 
 * @type {(str: string, pos: number) => { begins: number, ends: number, usesExclamationmark: boolean } | undefined}
*/
function getAttributeValue(str, pos) {
	let start = 0
	const len = str.length
	let usesExclamationmark = false
	while (str[pos] !== '=' && pos < len) {
		if (isEmptyRegex.test(str[pos]))
			return undefined
		pos++
	}
	if (str[pos - 1] === '!')
		usesExclamationmark = true
	start = pos += 1
	let startSymbol = str[start], endSymbol = undefined
	switch (startSymbol) {
		case "'":
			endSymbol = "'"
			break
		case '"':
			endSymbol = '"'
			break
		case '`':
			endSymbol = '`'
			break
		case '{':
			endSymbol = '}'
			break
		case '[':
			endSymbol = ']'
			break
		default:
			startSymbol = undefined
			break
	}
	
	if (!startSymbol) {
		while (!isEmptyRegex.test(str[pos]) && pos < len)
			pos++
		if(start == pos) return undefined
		return { begins: start, ends: pos, usesExclamationmark }
	}

	let indexes = findClosingIndex(str, start, startSymbol, endSymbol)
	if(indexes === undefined)
		return undefined
	return {...indexes, usesExclamationmark}
}

function createStringinator9000(
	/** @type {string} */
	str
) {
	/** @type {{ from: number, to: number, replacement: string }[]} */
	let arr = []

	return {
		/** @type {(from: number, to: number, replacement: string) => void} */
		add(from, to, replacement) {
			arr.push({ from, to, replacement })
		},
		/** @type {() => string} */
		get() {
			let s = str
			const a = arr.sort((a, b) => b.from - a.from)
			for (let { from, to, replacement } of a)
				s = s.slice(0, from) + replacement + s.slice(to)
			return s
		},
		apply() {
			str = this.get()
			arr = []
			return str
		}
	}
}

export default {
	/** @type {(input: { content: string, filename: string }) => { code: string }} */ 
	markup: ({ content = '' }) => {
	
		let pugRegex = /<template lang=("pug"|'pug')>|<\/template>/g
		pugRegex.exec(content)
		const start = pugRegex?.lastIndex
		if (start == 0) return { code: content }
		pugRegex.exec(content)
		const end = pugRegex.lastIndex - 12
		if (end <= 0) return { code: content }

		let pug = content.slice(start, end)
		pug = pug.replace(/(\n\t*)\(/g, '$1svelte:fragment(')

		/** @type {Record<string, any>} */
		const exported = {}
		
		const puginator = createStringinator9000(pug)

		/** @type {RegExpExecArray} */
		let o

		const objectElementRegex = /(((\n\t*)(([A-Z]+[^. \n\t\r(]*)((\.[A-Z]+[^. \n\t\r(]*)+)))([^( \t\n\r]+))(\()?/g
		while ((o = objectElementRegex.exec(pug))) {
			const pos = {
				whitespace: o.index + o[3].length,
				component: o.index + o[2].length
			}
			
			puginator.add(
				pos.whitespace, pos.component,
				o[5] + o[6].replaceAll('.', ':')
			)
		}

		pug = puginator.apply()

		const elementRegex = /(\n\t*)(?!\+)([A-Za-z.:#\-_]+)\(|(#\[)([A-Za-z.:#\-_]+)\(/g
		/** @type {RegExpExecArray} */
		let m
		while ((m = elementRegex.exec(pug))) {
			const { begins, ends } = findClosingIndex(pug, m.index, '(', ')') || { begins: -1, ends: -1 }
			const space = m[1] || m[3]
			const tag = m[2] || m[4]
			let attributes = pug.slice(begins + 1, ends - 1)
			const attributinator = createStringinator9000(attributes)
		
			let attributesOutput = ''

			/** @type {RegExpExecArray} */
			let a

			// * Removing commented attributes and the indentation relative to
			const commentedRegex = /\n(\t*)\/\/-\S*/g
			while ((a = commentedRegex.exec(attributes))) {
				const tabs = a[1].length
				let pos = commentedRegex.lastIndex

				const { begins, ends } = getAttributeValue(attributes, commentedRegex.lastIndex + 1) || { begins: -1, ends: -1 }
				
				if (ends > pos)
					pos = ends
				
				let lastPos = pos
				const nextLine = () => {
					while (/[^\n]/g.test(attributes[pos]))
						pos++
					lastPos = pos - 1
					pos++
				}
				const isIndentation = () => {
					let tabCount = 0
					while (/[\t]/g.test(attributes[pos])) {
						tabCount++
						pos++
					}
					return tabCount > tabs
				}

				nextLine()
				while (isIndentation())
					nextLine()	
				
				lastPos = lastPos < ends ? ends : lastPos
				
				attributinator.add(a.index, lastPos, '')
				commentedRegex.lastIndex = lastPos
			}

			attributes = attributinator.apply()

			const attributeRegex = /(?<=\s)(\S+)|(\S+)$|(^\S+)/g 
			const list = []
			while ((a = attributeRegex.exec(attributes))) {
				const start = a.index || 0
				let { usesExclamationmark, begins, ends } = getAttributeValue(attributes, start) || { begins: -1, ends: -1, usesExclamationmark: false }
				
				// * Making it compatible with old-style pug notation (aka without awesome-pug)
				if (usesExclamationmark) {
					attributeRegex.lastIndex = ends
					attributesOutput += ` ${attributes.slice(start, ends)} `
					continue
				}

				const name = attributes.slice(start, begins === -1 ? attributeRegex.lastIndex : begins - 1)
				const toExport = name.startsWith('export:')

				const attribute = {
					name: toExport ? name.slice(7) : name,
					toExport,
					eq:    ends === -1 ? undefined : attributes.slice(begins - 1, begins),
					value: ends === -1 ? undefined : attributes.slice(begins, ends)
				}
				list.push(attribute)
				if (ends !== -1)
					attributeRegex.lastIndex = ends
			}

			// console.log({ list })
			
			/** @type {(s: string) => string} */
			const wrap = (s) => '`' + s.replaceAll('`', '\\`') + '`'
			/** @type {(s: string) => string} */
			const wrapp = (s) => wrap(`{${s}}`)

			let attributeClass
			let classDirective = false
			let classValue = ''
			let attributeStyle
			let styleDirective = false
			let styleValue = ''

			for (const item of list) {
				let { name, eq, toExport, value } = item

				const isClass = name === 'class', isStyle = name === 'style'

				const colon = name.startsWith(':')
				if (name.startsWith('--') || (styleDirective && colon)) {
					styleValue += `;${colon ? name.slice(1) : name}: ${value.slice(1, -1)};`
					continue
				}

				if (classDirective && colon) {
					const n = name.slice(1)
					if(value)
						classValue += ` {${value.slice(1, -1)} ? ' ${n}' : ''}`
					else
						classValue += ` {${n} ? ' ${n}' : ''}`
					continue
				}

				classDirective = false
				styleDirective = false

				name =
					name.startsWith('...') ? `'{${name}}'` :
					name.startsWith('{') && name.endsWith('}') ? `'${name}'` : name
				
				if ((isStyle || isClass) && !value)
					value = "''"

				if (toExport) {
					const
						decl = `__export_${name}__`,
						semi = name === 'style' ? ';' : ''
					let defaultValue = undefined

					if (value) {
						const str = /'|"|`/.test(value[0]) ? value[0] : false
						defaultValue =
							value.startsWith('{') ? value.slice(1, value.length - 1)
							: str ? '""'
							: value
						
						if (str)
							value = `${value.slice(0,-1)} ${semi}{${decl}}${semi}${str}`
						else
							value = `{${decl}}`
					}
					
					exported[name] = defaultValue
				}
				
				if(typeof value !== 'undefined')
					value = 
						value.startsWith('[') ? wrapp(value)
						: value.startsWith('{') ? wrap(value)
						: value === 'true' ? '`{true}`'
						: value === 'false' ? '`{false}`'
						: /^\d+(\.\d+)?$/.test(value) ? wrapp(value)
						: value
				
				eq = eq === '!=' ? '=' :
					eq === '=' ? '!='
					: eq
				
				if (name === 'class') {
					attributeClass = { name, eq, value }
					classDirective = true
				}
				else if (name === 'style') {
					attributeStyle = { name, eq, value }
					styleDirective = true
				}
				else {
					if(eq)
						attributesOutput += ` ${name}${eq}${value}`
					else
						attributesOutput += ` ${name}`
				}
				
				// console.log({ name, value, eq })
			}

			if (attributeClass || classValue.length > 0) {
				let value = attributeClass ? attributeClass.value : "''"
				value = value.slice(0, -1) + ' ' + classValue.replaceAll(value[0], `\\${value[0]}`) + value[0]
				attributesOutput += ` class!=${value}`
			}
			if (attributeStyle || styleValue.length > 0) {
				let value = attributeStyle ? attributeStyle.value : "''"
				value = value.slice(0, -1) + ' ' + styleValue.replaceAll(value[0], `\\${value[0]}`) + value[0]
				attributesOutput += ` style!=${value}`
			}

			// console.log(attributesOutput)

			puginator.add(
				m.index, ends,
				`${space}${tag}(${attributesOutput})`
			)

			elementRegex.lastIndex = ends
		}

		// * {#} and {@} statements
		const svelteStatementRegex = /(\n(\t*))(\{(#|@)([^} \t\n\r]+)\s+([^}]+)\})/g
		while ((m = svelteStatementRegex.exec(pug))) {
			puginator.add(
				m.index + m[1].length, svelteStatementRegex.lastIndex,
				`+${m[5]}(\`${m[6].replaceAll('`', "\\`")}\`)`
			)
		}

		// * {#} closing statements (ex. {/if}) 
		const svelteStatementClosingRegex = /(\n\t*)\{\/(if|await|key|each)\}/g
		while ((m = svelteStatementClosingRegex.exec(pug))) {
			puginator.add(m.index + m[1].length, svelteStatementRegex.lastIndex, '')
		}

		// console.log(puginator.get())
		let code = content.slice(0, start) + puginator.get() + content.slice(end)

		let exportKeys = Object.keys(exported)
		function setExports() {
			let values = ';'
			let exportation = ''

			for (let key in exported) {
				const defaultValue = exported[key]
				values += `let __export_${key}__ ${typeof defaultValue === 'undefined' ? '' : `= ${defaultValue}`};\n`
				exportation += `__export_${key}__ as ${key}, `
			}

			const componentExport = /export\s*\{/g
			let m = componentExport.exec(code)
			let index = componentExport.lastIndex
			if (index > 0) {
				code = insert(code, index, exportation)
				code = insert(code, m.index, values)
				return code
			}

			const scriptEnd = /<\/script>/g
			m = scriptEnd.exec(code)
			index = m.index
			if (index > 0) {
				code = insert(code, index, `
					${values}
					export { ${exportation} };
				`)
				return code
			}

			code = insert(code, 0, `
				<script>
					${values}
					export { ${exportation} };
				</script>
			`)
			return code
		}

		if (exportKeys.length > 0)
			code = setExports()
		
		// console.log(code)
		
		return { code }
	}
}