<script context="module">
	import * as globals from "frontend/source/globals.js";
	import Landing from "frontend/source/components/landing.svelte";
	import Loading from "frontend/source/components/loading.svelte";
	import Access from "frontend/source/components/access.svelte";

	import * as svelte from "svelte";
	import axios from "axios";

	let username = null;

	const globals_r = globals.readonly;

	export async function load(obj) {
		try {
			const response = await axios.get(`${globals_r.backend}/authentication_check?socket_id=${globals_r.socket.id}`);
			const response_data = response.data;

			username = response_data.username; // undefined if use_page is "landing"

			return {
				status: 200,
				props: {
					use_page: response_data.use_page
				}
			};
		} catch (err) {
			console.error(err);

			if (Number.parseInt(err.message.split(" ").slice(-1)[0]) == 401) { // backend deserializeUser error
				return {
					status: 401
				};
			} else { // get request failed
				return {
					status: 503
				};	
			}
		}
	};
</script>
<script>
	export let use_page;

	let active_page = null;

	function handle_component_dispatch(evt) {
		switch (evt.detail) {
			case "switch page to loading":
				active_page = Loading;
				break;
			case "switch page to access":
				active_page = Access;
				break;
			default:
				break;
		}
	}

	switch (use_page) {
		case "landing":
			active_page = Landing;
			break;
		case "loading":
			active_page = Loading;
			break;
		case "access":
			active_page = Access;
			break;
		default:
			break;
	}

	svelte.onMount(() => {
		if (window.location.href.endsWith("/#_")) { // from reddit oauth callback
			window.history.pushState(null, "", window.location.href.slice(0, -3));
		}

		globals_r.socket.emit("route", "index");
	});
</script>

<svelte:head>
	<title>{globals_r.app_name}</title>
	<meta name="description" content={globals_r.description}/>
</svelte:head>
<svelte:component this={active_page} on:dispatch={handle_component_dispatch} username={username}/>
