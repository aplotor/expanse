import snoowrap from "snoowrap";

function create_requester(reddit_api_refresh_token) {
	const requester = new snoowrap({
		clientId: process.env.REDDIT_APP_ID,
		clientSecret: process.env.REDDIT_APP_SECRET,
		userAgent: `web:expanse${(process.env.RUN == "dev" ? "_test" : "")}:v=${process.env.VERSION} (hosted by u/${process.env.REDDIT_USERNAME})`, // https://github.com/reddit-archive/reddit/wiki/API "User-Agent"
		refreshToken: reddit_api_refresh_token
	});
	return requester;
}

export {
	create_requester
};
