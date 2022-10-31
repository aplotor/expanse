const backend = process.cwd();

const file = await import(`${backend}/model/file.mjs`);
const sql = await import(`${backend}/model/sql.mjs`);
const user = await import(`${backend}/model/user.mjs`);
const utils = await import(`${backend}/model/utils.mjs`);

import * as socket_io_server from "socket.io";
import express from "express";
import http from "http";
import cookie_session from "cookie-session";
import passport from "passport";
import passport_reddit from "passport-reddit";
import crypto from "crypto";
import filesystem from "fs";
import fileupload from "express-fileupload";

const app = express();
const server = http.createServer(app);
const io = new socket_io_server.Server(server, {
	cors: (process.env.RUN == "dev" ? {origin: "*"} : null),
	maxHttpBufferSize: 1000000 // 1mb in bytes
});

const frontend = backend.replace("backend", "frontend");

const allowed_users = new Set(process.env.ALLOWED_USERS.split(", "));
const denied_users = new Set(process.env.DENIED_USERS.split(", "));

await file.init();
await sql.init_db();
file.cycle_backup_db();
await user.fill_usernames_to_socket_ids();
user.cycle_update_all(io);

app.use(fileupload({
	limits: {
		fileSize: 52428800 // 50mb in binary bytes
	}
}));

app.use("/", express.static(`${frontend}/build/`));

passport.use(new passport_reddit.Strategy({
	clientID: process.env.REDDIT_APP_ID,
	clientSecret: process.env.REDDIT_APP_SECRET,
	callbackURL: process.env.REDDIT_APP_REDIRECT,
	scope: ["identity", "history", "read", "save", "edit", "vote", "report"] // https://github.com/reddit-archive/reddit/wiki/OAuth2 "scope values", https://www.reddit.com/dev/api/oauth
}, async (user_access_token, user_refresh_token, user_profile, done) => { // http://www.passportjs.org/docs/configure "verify callback"
	const u = new user.User(user_profile.name, user_refresh_token);

	try {
		await u.save();
		return done(null, u); // passes the user to serializeUser
	} catch (err) {
		console.error(err);
	}
}));
passport.serializeUser((u, done) => done(null, u.username)); // store user's username into session cookie
passport.deserializeUser(async (username, done) => { // get user from db, specified by username in session cookie
	try {
		const u = await user.get(username);
		done(null, u);
		console.log(`deserialized user (${username})`);
	} catch (err) {
		console.log(`deserialize error (${username})`);
		console.error(err);
		done(err, null);
	}
});
process.nextTick(() => { // handle any deserializeUser errors here
	app.use((err, req, res, next) => {
		if (err) {
			console.error(err);

			const username = req.session.passport.user;
			delete user.usernames_to_socket_ids[username];
			
			req.session = null; // destroy login session
			console.log(`destroyed session (${username})`);
			req.logout();

			res.status(401).sendFile(`${frontend}/build/index.html`);
		} else {
			next();
		}
	});
});
app.use(express.urlencoded({
	extended: false
}));
app.use(cookie_session({ // https://github.com/expressjs/cookie-session
	name: "expanse_session",
	path: "/",
	secret: process.env.SESSION_SECRET,
	signed: true,
	httpOnly: true,
	overwrite: true,
	sameSite: "lax",
	maxAge: 1000*60*60*24*30
}));
app.use((req, res, next) => { // rolling session: https://github.com/expressjs/cookie-session#extending-the-session-expiration
	req.session.nowInMinutes = Math.floor(Date.now() / 60000);
	next();
});
app.use(passport.initialize());
app.use(passport.session());

app.get("/login", (req, res, next) => {
	passport.authenticate("reddit", { // https://github.com/Slotos/passport-reddit/blob/9717523d3d3f58447fee765c0ad864592efb67e8/examples/login/app.js#L86
		state: req.session.state = crypto.randomBytes(32).toString("hex"),
		duration: "permanent"
	})(req, res, next);
});

app.get("/callback", (req, res, next) => {
	if (req.query.state == req.session.state) {
		passport.authenticate("reddit", async (err, u, info) => {
			if (err || !u) {
				res.redirect(302, "/logout");
			} else if ((allowed_users.has("*") && denied_users.has(u.username)) || (!allowed_users.has("*") && !allowed_users.has(u.username)) || (denied_users.has("*") && !allowed_users.has(u.username))) {
				try {
					await u.purge();
					res.redirect(302, "/logout");
					console.log(`denied user (${u.username})`);
				} catch (err) {
					console.error(err);
				}
			} else {
				req.login(u, () => {
					res.redirect(302, "/");
				});
			}
		})(req, res, next);
	} else {
		res.redirect(302, "/logout");
	}
});

app.get("/authentication_check", (req, res) => {
	if (req.isAuthenticated()) {
		user.usernames_to_socket_ids[req.user.username] = req.query.socket_id;
		user.socket_ids_to_usernames[req.query.socket_id] = req.user.username;

		res.send({
			username: req.user.username,
			use_page: (req.user.last_updated_epoch ? "access" : "loading")
		});
	} else {
		res.send({
			use_page: "landing"
		});
	}
});

app.post("/upload", (req, res) => {
	if (req.isAuthenticated()) {
		const files = [];
		for (const name in req.files) {
			if (["saved_posts", "saved_comments", "posts", "comments", "post_votes", "hidden_posts"].includes(name)) {
				const file = req.files[name];
				files.push(file);
			}
		}
		file.parse_import(req.user.username, files).catch((err) => console.error(err));
		res.end();
	} else {
		res.status(401).sendFile(`${frontend}/build/index.html`);
	}
});

app.get("/download", (req, res) => {
	if (req.isAuthenticated()) {
		res.download(`${backend}/tempfiles/${req.query.filename}.json`, `${req.query.filename}.json`, () => {
			filesystem.promises.unlink(`${backend}/tempfiles/${req.query.filename}.json`).catch((err) => console.error(err));
		});
	} else {
		res.status(401).sendFile(`${frontend}/build/index.html`);
	}
});

app.get("/logout", (req, res) => {
	if (req.isAuthenticated()) {
		req.logout();
		res.redirect(302, "/");
	} else {
		res.status(401).sendFile(`${frontend}/build/index.html`);
	}
});

app.get("/purge", async (req, res) => {
	if (req.isAuthenticated() && req.query.socket_id == user.usernames_to_socket_ids[req.user.username]) {
		try {
			await req.user.purge();
			req.logout();
			res.send("success");
		} catch (err) {
			console.error(err);
			res.send("error");
		}
	} else {
		res.status(401).sendFile(`${frontend}/build/index.html`);
	}
});

app.all("*", (req, res) => {
	res.status(404).sendFile(`${frontend}/build/index.html`);
});

io.on("connect", (socket) => {
	console.log(`socket (${socket.id}) connected`);

	socket.username = null;

	socket.on("route", (route) => {
		switch (route) {
			case "index":
				break;
			default:
				break;
		}
	});

	socket.on("page", async (page) => {
		switch (page) {
			case "landing":
				break;
			case "loading":
				socket.username = user.socket_ids_to_usernames[socket.id];
				try {
					const u = await user.get(socket.username);
					await u.update(io, socket.id);
				} catch (err) {
					console.error(err);
				}
				break;
			case "access":
				socket.username = user.socket_ids_to_usernames[socket.id];
				try {
					const u = await user.get(socket.username);

					io.to(socket.id).emit("store last updated epoch", u.last_updated_epoch);

					sql.update_user(u.username, {
						last_active_epoch: u.last_active_epoch = utils.now_epoch()
					}).catch((err) => console.error(err));
				} catch (err) {
					console.error(err);
				}
				break;
			default:
				break;
		}
	});

	socket.on("get data", async (filter, item_count, offset) => {
		try {
			const data = await sql.get_data(socket.username, filter, item_count, offset);
			io.to(socket.id).emit("got data", data);
		} catch (err) {
			console.error(err);
		}
	});

	socket.on("get placeholder", async (filter) => {
		try {
			const placeholder = await sql.get_placeholder(socket.username, filter);
			io.to(socket.id).emit("got placeholder", placeholder);
		} catch (err) {
			console.error(err);
		}
	});

	socket.on("get subs", async (filter) => {
		try {
			const subs = await sql.get_subs(socket.username, filter);
			io.to(socket.id).emit("got subs", subs);
		} catch (err) {
			console.error(err);
		}
	});

	socket.on("renew comment", async (comment_id) => {
		try {
			const u = await user.get(socket.username);
			const comment_content = await u.renew_comment(comment_id);
			io.to(socket.id).emit("renewed comment", comment_content);
		} catch (err) {
			console.error(err);
		}
	});

	socket.on("delete item from expanse acc", (item_id, item_category) => {
		sql.delete_item_from_expanse_acc(socket.username, item_id, item_category).catch((err) => console.error(err));
	});

	socket.on("delete item from reddit acc", async (item_id, item_category, item_type) => {
		try {
			const u = await user.get(socket.username);
			u.delete_item_from_reddit_acc(item_id, item_category, item_type).catch((err) => console.error(err));
		} catch (err) {
			console.error(err);
		}
	});

	socket.on("export", async () => {
		try {
			const filename = await file.create_export(socket.username);
			io.to(socket.id).emit("download", filename);
		} catch (err) {
			console.error(err);
		}
	});

	socket.on("disconnect", () => {
		if (socket.username) { // logged in
			(socket.username in user.usernames_to_socket_ids ? user.usernames_to_socket_ids[socket.username] = null : null); // set to null; not delete, bc username is needed in user.update_all
			delete user.socket_ids_to_usernames[socket.id];	
		}
	});
});

server.listen(Number.parseInt(process.env.PORT), "0.0.0.0", () => {
	console.log(`server (expanse) started on (localhost:${process.env.PORT})`);
});

process.on("beforeExit", async (exit_code) => {
	try {
		await sql.pool.end();
	} catch (err) {
		console.error(err);
	}
});
