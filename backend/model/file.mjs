const backend = process.cwd();

const sql = await import(`${backend}/model/sql.mjs`);
const utils = await import(`${backend}/model/utils.mjs`);

import filesystem from "fs";
import xlsx from "xlsx";
import child_process from "child_process";

async function init() {
	for (const dir of [`${backend}/logs/`, `${backend}/tempfiles/`, `${backend}/backups/`]) {
		if (filesystem.existsSync(dir)) {
			if (process.env.RUN == "dev") {
				const files = await filesystem.promises.readdir(dir);
				await Promise.all(files.map((file, idx, arr) => (dir == `${backend}/logs/` ? filesystem.promises.truncate(`${dir}/${file}`.replace("//", "/"), 0) : filesystem.promises.unlink(`${dir}/${file}`.replace("//", "/")))));
			}
		} else {
			filesystem.mkdirSync(dir);
		}
	}
}

async function parse_import(username, files) {
	const import_data = {
		item_fns: new Set(),
		category_item_ids: {}
	};

	const categories = ["saved", "created", "upvoted", "downvoted", "hidden"];
	for (const category of categories) {
		import_data.category_item_ids[category] = new Set();
	}
	
	for (const file of files) {
		const csv = xlsx.read(file.data, {
			type: "buffer"
		});
		const sheet_list = csv.SheetNames;
		const sheet = csv.Sheets[sheet_list[0]];
		const items = xlsx.utils.sheet_to_json(sheet);

		for (const item of items) {
			if (!item.id.toString().includes(".")) { // exclude anomaly fns: see thread https://www.reddit.com/r/help/comments/rztejh/saved_posts_beyond_the_1000_visible_limit
				switch (file.name) {
					case "saved_posts.csv":
						import_data.item_fns.add(`t3_${item.id}`);
						import_data.category_item_ids.saved.add(item.id);
						break;
					case "saved_comments.csv":
						import_data.item_fns.add(`t1_${item.id}`);
						import_data.category_item_ids.saved.add(item.id);
						break;
					case "posts.csv":
						import_data.item_fns.add(`t3_${item.id}`);
						import_data.category_item_ids.created.add(item.id);
						break;
					case "comments.csv":
						import_data.item_fns.add(`t1_${item.id}`);
						import_data.category_item_ids.created.add(item.id);
						break;
					case "post_votes.csv":
						if (item.direction != "none") {
							import_data.item_fns.add(`t3_${item.id}`);
							import_data.category_item_ids[`${item.direction}voted`].add(item.id);
						}
						break;
					case "hidden_posts.csv":
						import_data.item_fns.add(`t3_${item.id}`);
						import_data.category_item_ids.hidden.add(item.id);
						break;
					default:
						break;
				}
			}
		}
	}

	await sql.parse_import(username, import_data);
}

async function create_export(username) {
	const export_data = {};
	const categories = ["saved", "created", "upvoted", "downvoted", "hidden", "awarded"];
	for (const category of categories) {
		const filter = {
			category: category,
			type: "all",
			sub: "all",
			search_str: ""
		};
		export_data[category] = await sql.get_data(username, filter, "all", 0);
	}

	const filename = Math.random().toString().substring(2, 17);
	await filesystem.promises.writeFile(`${backend}/tempfiles/${filename}.json`, JSON.stringify(export_data, null, 4), "utf-8");

	setTimeout(() => {
		filesystem.promises.unlink(`${backend}/tempfiles/${filename}.json`).catch((err) => null);
	}, 14400000); // 4h
	
	return filename;
}

async function delete_oldest_if_reached_limit(limit, dir, what) {
	const files = await filesystem.promises.readdir(dir);
	if (files.length > limit) {
		let oldest_file = null;
		let oldest_file_ctime = null;
		for (const file of files) {
			const ctime = await filesystem.promises.stat(`${dir}/${file}`.replace("//", "/")).ctime;
			if (!oldest_file || ctime < oldest_file_ctime) {
				oldest_file = file;
				oldest_file_ctime = ctime;
			}
		}
		await filesystem.promises.unlink(`${dir}/${oldest_file}`.replace("//", "/"));
		console.log(`deleted oldest ${what} (${oldest_file}) past limit (${limit})`);
	}
}

function backup_db() {
	const filename = utils.epoch_to_formatted_datetime(utils.now_epoch()).replaceAll(":", "꞉").split(" ").join("_");

	const spawn = child_process.spawn("pg_dump", [
		"-O", "-d", sql.pool.options.connectionString, "-f", `${backend}/backups/${filename}.sql`
	]);

	spawn.stderr.on("data", (data) => {
		const stderr = data.toString();
		console.error(stderr);
	});

	spawn.stdout.on("data", (data) => {
		const stdout = data.toString();
		(stdout != "\n" ? console.log(stdout) : null);
	});

	spawn.on("exit", (exit_code) => {
		if (exit_code == 0) {
			console.log(`backed up db to file (${filename}.sql)`);

			delete_oldest_if_reached_limit(5, `${backend}/backups/`, "db backup").catch((err) => console.error(err));
		} else {
			console.error(`db backup process exited with code ${exit_code}`);
		}
	});
}
function cycle_backup_db() {
	(process.env.RUN == "dev" ? backup_db() : null);

	setInterval(() => {
		backup_db();
	}, 86400000); // 24h
}

export {
	init,
	parse_import,
	create_export,
	cycle_backup_db
};
