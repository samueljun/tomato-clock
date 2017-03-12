function getSecondsInMilliseconds(seconds) {
	return seconds * 1000;
}
function getMinutesInMilliseconds(minutes) {
	return minutes * 60000;
}

function millisecondsToMinutesAndSeconds(milliseconds) {
	return {
		minutes: parseInt((milliseconds / (1000 * 60)) % 60),
		seconds: parseInt((milliseconds / 1000) % 60)
	};
}

function millisecondsToTimeText(milliseconds) {
	const minutes = parseInt((milliseconds / (1000 * 60)) % 60);
	const seconds = parseInt((milliseconds / 1000) % 60);
	const minutesString = (minutes < 10) ? `0${minutes}` : minutes.toString();
	const secondsString = (seconds < 10) ? `0${seconds}` : seconds.toString();

	return `${minutesString}:${secondsString}`;
}

function wrapId() {
	return "#"+[].join.call(arguments, "-");
}

function colorToCSS(color) {
	return 'rgb('+color.r+','+color.g+','+color.b+')';
}

//http://stackoverflow.com/a/5624139/3865594
function componentToHex(comp) {
    var hex = comp.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function colorToCSS(color) {
    return "#" + componentToHex(color.r) + componentToHex(color.g) + componentToHex(color.b);
}