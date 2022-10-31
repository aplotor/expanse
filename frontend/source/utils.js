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

function time_since(epoch) {
	const epoch_diff = now_epoch() - epoch;
	if (epoch_diff/31536000 >= 1) {
		return Math.floor(epoch_diff/31536000)+"y";
	} else if (epoch_diff/2592000 >= 1) {
		return Math.floor(epoch_diff/2592000)+"m";
	} else if (epoch_diff/86400 >= 1) {
		return Math.floor(epoch_diff/86400)+"d";
	} else if (epoch_diff/3600 >= 1) {
		return Math.floor(epoch_diff/3600)+"h";
	} else if (epoch_diff/60 >= 1) {
		return Math.floor(epoch_diff/60)+"m";
	} else {
		return epoch_diff+"s";
	}
}

function shake_element(element) {
	element.classList.add("shake");
	setTimeout(() => {
		element.classList.remove("shake");
	}, 300);
}

function show_alert(alert_wrapper, message, type) {
	alert_wrapper.innerHTML = `
		<div id="alert" class="alert alert-${type} fade show text-center mb-0 p-1" role="alert">
			<span>${message}</span>
		</div>
	`;
}

export {
	epoch_to_formatted_datetime,
	time_since,
	shake_element,
	show_alert
};
