<script context="module">
	import * as globals from "frontend/source/globals.js";

	const globals_r = globals.readonly;

	export async function load(obj) {
		let interval_id = null;
		try {
			await new Promise((resolve, reject) => {
				const timeout_id = setTimeout(() => {
					reject("socket connection attempt timed out");
				}, 5000);

				interval_id = setInterval(() => {
					if (globals_r.socket.connected) {
						clearTimeout(timeout_id);
						clearInterval(interval_id);
						resolve();
					}
				}, 100);
			});
			
			return {
				status: 200
			};
		} catch (err) {
			console.error(err);
			clearInterval(interval_id);

			return {
				status: 408
			};
		}
	};
</script>

<div class="container-fluid text-light">
	<div class="row d-flex justify-content-center">
		<content class="col-12 col-sm-11 col-md-10 col-lg-9 col-xl-8">
			<slot></slot>
			<div class="text-center my-4 pt-2">
				<a href={globals_r.repo} target="_blank"><i id="bottom_gh" class="fab fa-github"></i></a>
			</div>
		</content>
	</div>
</div>
