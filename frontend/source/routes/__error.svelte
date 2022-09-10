<script context="module">
	import * as globals from "frontend/source/globals.js";

	import * as svelte from "svelte";
	import axios from "axios";

	const globals_r = globals.readonly;

	function ensure_redirect(current_path) {
		(current_path == "/" ? window.history.pushState(null, "", "/error") : null); // if current path is already index, change the path so that "return to app" will actually redirect to index
	}

	export async function load(obj) {
		console.log(obj.status);
		console.log(obj.error.message);

		if (obj.status != 404) {
			ensure_redirect(obj.url.pathname);

			return {
				props: {
					http_status: obj.status
				}
			};
		} else {
			try {
				await axios.get(globals_r.backend + obj.url.pathname); // should throw an error
			} catch (err) {
				console.error(err);

				ensure_redirect(obj.url.pathname);

				return {
					props: {
						http_status: Number.parseInt(err.message.split(" ").slice(-1)[0])
					}
				};
			}
		}
	};
</script>
<script>
	export let http_status;

	svelte.onMount(() => {
		globals_r.socket.emit("route", http_status);
	});
</script>

<svelte:head>
	<title>{http_status}</title>
	<meta name="description" content={http_status}/>
</svelte:head>
<div class="text-center mt-5 pt-5">
	<a href="https://www.google.com/search?q=http+status+{http_status}" target="_blank" class="display-1">{http_status}</a>
	<br/>
	<a href="/" class="display-3">return to app</a>
</div>
