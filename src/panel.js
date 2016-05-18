var pomodoroButton = document.getElementById('pomodoro-button');
var fiveMinuteButton = document.getElementById('five-minute-button');
var tenMinuteButton = document.getElementById('ten-minute-button');
var fifteenMinuteButton = document.getElementById('fifteen-minute-button');
var resetTimeoutButton = document.getElementById('reset-timeout-button');

var currentTimeText = document.getElementById('current-time-text');
var statsLink = document.getElementById('stats-link');
var pomodoroTechniqueLink = document.getElementById('pomodoro-technique-link');

var intervalID;
var intervalMillisecondsLeft = 0;

function resetPanelInterval() {
	setPanelTimeText(0);
	intervalMillisecondsLeft = 0;
	clearInterval(intervalID);
}

function setPanelInterval(milliseconds) {
	resetPanelInterval();

	intervalMillisecondsLeft = milliseconds;
	setPanelTimeText(milliseconds);

	intervalID = setInterval(function() {
		intervalMillisecondsLeft -= 1000;
		setPanelTimeText(intervalMillisecondsLeft);

		if (intervalMillisecondsLeft <= 0) {
			clearInterval(intervalID);
		}
	}, 1000);
}

function setPanelTimeText(milliseconds) {
	currentTimeText.textContent = millisecondsToTimeText(milliseconds);
}

function millisecondsToTimeText(milliseconds) {
	var seconds = parseInt((milliseconds / 1000) % 60);
	var minutes = parseInt((milliseconds / (1000 * 60)) % 60);

	minutes = (minutes < 10) ? '0' + minutes : minutes;
	seconds = (seconds < 10) ? '0' + seconds : seconds;

	return minutes + ':' + seconds;
}



pomodoroButton.addEventListener('click', function(event) {
	setPanelInterval(1500000);
	setBrowserTimer(1500000);
});

fiveMinuteButton.addEventListener('click', function(event) {
	setPanelInterval(300000);
	setBrowserTimer(300000);
});

tenMinuteButton.addEventListener('click', function(event) {
	setPanelInterval(600000);
	setBrowserTimer(600000);
});

fifteenMinuteButton.addEventListener('click', function(event) {
	setPanelInterval(900000);
	setBrowserTimer(900000);
});

resetTimeoutButton.addEventListener('click', function(event) {
	resetPanelInterval();
	resetBrowserTimer();
});

pomodoroTechniqueLink.addEventListener('click', function(event) {
	openTab('http://pomodorotechnique.com');
});

statsLink.addEventListener('click', function(event) {
	openTab('stats.html');
});
