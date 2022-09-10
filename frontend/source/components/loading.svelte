<script context="module">
	import * as globals from "frontend/source/globals.js";
	import Navbar from "frontend/source/components/navbar.svelte";

	import * as svelte from "svelte";

	const globals_r = globals.readonly;
</script>
<script>
	export let username;
	
	let progress_wrapper = null;

	const dispatch = svelte.createEventDispatcher();

	svelte.onMount(() => {
		globals_r.socket.emit("page", "loading");

		globals_r.socket.on("update progress", (progress, complete) => {
			const progress_percentage = progress/complete * 100;
			progress_wrapper.innerHTML = Math.floor(progress_percentage);
			if (progress_percentage == 100) {
				setTimeout(() => {
					dispatch("dispatch", "switch page to access");
				}, 2000);
			}
		});
	});
	svelte.onDestroy(() => {
		globals_r.socket.off("update progress");
	});
</script>

<Navbar username={username}/>
<div class="text-center mt-3 mb-4">
	<h1 class="display-4">{globals_r.app_name}</h1>
	<div id="loading_container" class="mt-1">
		<div class="spinner-border" role="status"><span class="sr-only">loading...</span></div>
		<p class="mt-n5"><span bind:this={progress_wrapper} class="lead">?</span>%</p>
	</div>
</div>
