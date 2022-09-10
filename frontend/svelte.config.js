import adapter_static from "@sveltejs/adapter-static"; // https://github.com/sveltejs/kit/tree/master/packages/adapter-static

export default { // https://kit.svelte.dev/docs/configuration
	extensions: [
		".svelte"
	],
	kit: {
		adapter: adapter_static({ // an adapter is required to build for prod. see https://kit.svelte.dev/docs/adapters
			fallback: true
		}),
		files: {
			template: "./source/app.html",
			routes: "./source/routes/",
			hooks: "./source/hooks.js",
			assets: "./static/"
		},
		trailingSlash: "never",
		env: {
			publicPrefix: ""
		}
	}
};
