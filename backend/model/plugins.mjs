import * as userPlugins from '../plugins/index.mjs';

let pluginsArray = [];

function getPlugins() {
	if (pluginsArray.length === 0) {
		Object.keys(userPlugins).forEach((key) => {
			pluginsArray.push(userPlugins[key].plugin)
		})
	}
	return pluginsArray;
}

function validatePlugins() {
	for (const plugin of getPlugins()) {
		if (!plugin.can('getId') ||
			!plugin.can('initialize') ||
			!plugin.can('receiveItem') ||
			!plugin.can('receiveUserItem') ||
			!plugin.can('getAvailableConfig')) {
				throw new Error(`A plugin is not formatted properly`);
			}
	}
}

function initializePlugins() {
	for (const plugin of getPlugins()) {
		plugin.initialize();
	}
}

export {
	getPlugins,
	validatePlugins,
	initializePlugins
}