<script context="module">
	import * as globals from "frontend/source/globals.js";
	import Navbar from "frontend/source/components/navbar.svelte";

	import * as svelte from "svelte";

	const globals_r = globals.readonly;
</script>
<script>
	svelte.onMount(() => {
		globals_r.socket.emit("page", "landing");
	});
</script>

<Navbar/>
<div class="text-center mt-3">
	<div class="jumbotron bg-dark mb-0 py-5">
		<h1 class="display-4">{globals_r.app_name}</h1>
		<p class="lead text-left">{globals_r.description}</p>
		<p class="lead text-left">features: new items auto-sync, synced items not affected by Reddit deletion, search for items, filter by subreddit, import csv data from <a href="https://www.reddit.com/settings/data-request" target="_blank">Reddit data request</a>, export data as json</p>
		<hr class="bg-secondary my-4"/>
		<div class="embed-responsive embed-responsive-16by9">
			<iframe title="demo" class="embed-responsive-item" src="https://www.youtube.com/embed/4pxXM98ewIc" allow="fullscreen"></iframe>
		</div>
		<hr class="bg-secondary my-4"/>
		<p class="lead text-left">required <a href="https://www.reddit.com/dev/api/oauth" target="_blank">Reddit api oauth2 scopes</a>::</p>
		<ul class="text-left mt-n3">
			<li><a href="https://www.reddit.com/dev/api/oauth#scope_identity" target="_blank">identity</a>: to get your username</li>
			<li><a href="https://www.reddit.com/dev/api/oauth#scope_history" target="_blank">history</a>: to get your items</li>
			<li><a href="https://www.reddit.com/dev/api/oauth#scope_read" target="_blank">read</a>: to get icons of subreddits/users</li>
			<li><a href="https://www.reddit.com/dev/api/oauth#scope_save" target="_blank">save</a>: to unsave items (manual action)</li>
			<li><a href="https://www.reddit.com/dev/api/oauth#scope_edit" target="_blank">edit</a>: to delete items (manual action)</li>
			<li><a href="https://www.reddit.com/dev/api/oauth#scope_vote" target="_blank">vote</a>: to unvote items (manual action)</li>
			<li><a href="https://www.reddit.com/dev/api/oauth#scope_report" target="_blank">report</a>: to unhide items (manual action)</li>
		</ul>
		<div class="row">
			<div class="col-1 col-sm-3"></div>
			<div class="col-10 col-sm-6">
				<a id="login_anchor" class="d-flex justify-content-center" href="{globals_r.backend}/login" rel="external"><p class="rounded-pill lead text-white mt-2" id="login_btn">log in with <img id="reddit_logo" class="ml-n2 mr-n2 mb-1" src="/reddit logo on dark.svg" alt="reddit logo"/></p></a>
			</div>
			<div class="col-1 col-sm-3"></div>
		</div>
	</div>
</div>
