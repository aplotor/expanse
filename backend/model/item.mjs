import * as snoo from 'snoowrap';

class Item {
	constructor(snooItem) {
		this.snooItem = snooItem;

		switch (snooItem.constructor.name) {
			case "Submission":
				this.type = "post";
				break;
			case "Comment":
				this.type = "comment";
				break;
			default:
				break;
		}

		processItem(this);
	}
}

function processItem(item) {
	if (item.type === "post") {
		processPost(item);
	}
}

function processPost(item) {
	item.postType = 'text';

	let snooItem = item.snooItem;
	let url = snooItem.url;
	let urlObject = new URL(url);
	let hostname = urlObject.hostname;
	if (url.endsWith('jpg') || url.endsWith('png') || url.endsWith('jpeg')) {
		item.postType = 'image';
	}
	else if (url.endsWith('gif')) {
		item.postType = 'gif';
	}
	else if (snooItem.is_video ||
		hostname.includes('gfycat.com') ||
		hostname.includes('redgifs.com') ||
		hostname.includes('streamable.com') ||
		url.endsWith('gifv') ||
		url.endsWith('mp4')) {
		item.postType = 'video';
	}
	else if (snooItem.gallery_data) {
		item.postType = 'gallery';
	}
	else if (!url.includes(item.permalink)) {
		item.postType = 'link';
	}
}

export default Item;