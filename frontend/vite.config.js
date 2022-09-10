import * as vite from "@sveltejs/kit/vite";

const frontend = process.cwd();

export default { // https://vitejs.dev/config
	plugins: [
		vite.sveltekit()
	],
	resolve: {
		alias: {
			frontend: frontend // use in import statements within .svelte files
		}
	},
	server: {
		host: "0.0.0.0",
		port: Number.parseInt(process.env.PORT),
		strictPort: true,
		proxy: {
			"/backend": {
				rewrite: (path) => path.replace(/^(\/backend)/, ""),
				target: `http://host.docker.internal:${Number.parseInt(process.env.PORT)+1}`,
				secure: false,
				changeOrigin: true,
				ws: true
			}
		},
		fs: {
			strict: true,
			allow: [
				frontend
			]
		},
		watch: {
			usePolling: true // for hmr on wsl2: https://vitejs.dev/config/server-options.html#server-watch
		}
	}
};
