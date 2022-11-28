import adapter from '@sveltejs/adapter-auto'
import preprocess from 'svelte-preprocess'
import awesomePugPre from './src/lib/awesome-pug-pre.js'
import awesomePugPost from './src/lib/awesome-pug-post.js'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [
		awesomePugPre,
		preprocess(),
		awesomePugPost
	],

	kit: {
		adapter: adapter(),
		alias: {
			'$frontend': 'src/frontend'
		}
	},
	package: {
		exports: (path) => {
			// console.log(path)
			return path === 'index.js'
		} 
	}
};

export default config;
