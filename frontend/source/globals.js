import * as app_env from "$app/env";
import * as env_static_public from "$env/static/public";
import * as socket_io_client from "socket.io-client";

const readonly = {
	app_name: "expanse",
	description: "fully selfhosted multi-user web app for externally storing Reddit items (saved, created, upvoted, downvoted, hidden) to bypass Reddit's 1000-item listing limits",
	repo: "https://github.com/jc9108/expanse",
	backend: (env_static_public.RUN == "dev" ? "/backend" : ""),
	socket: socket_io_client.io((env_static_public.RUN == "dev" ? `http://${(app_env.browser ? window.location.hostname : "localhost")}:${Number.parseInt(env_static_public.PORT)+1}` : ""))
};

export {
	readonly
};
