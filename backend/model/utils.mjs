
Object.defineProperty(Object.prototype, 'can', {
    enumerable: false,
    value: function(method) {
        return (typeof this[method] === 'function');
    }
});

function now_epoch() {
	const now_epoch = Math.floor(Date.now() / 1000);
	return now_epoch;
}

function epoch_to_formatted_datetime(epoch) {
	let formatted_datetime = new Date(epoch * 1000).toLocaleString("en-GB", {timeZone: "UTC", timeZoneName: "short", hour12: true}).toUpperCase().split("/").join("-").replace(",", "").replace(" AM", ":AM").replace(" PM", ":PM");
	const split = formatted_datetime.split(" ");
	(split[1][1] == ":" ? split[1] = "0"+split[1] : null);
	formatted_datetime = split.join(" ");
	return formatted_datetime;
}

function strip_trailing_slash(string) {
	const stripped_string = (string.endsWith("/") ? string.slice(0, -1) : string);
	return stripped_string;
}

export {
	now_epoch,
	epoch_to_formatted_datetime,
	strip_trailing_slash
};
