//
// Firefox SDK
//

var notifications = require('sdk/notifications');
var panels = require('sdk/panel');
var self = require('sdk/self');
var ss = require('sdk/simple-storage');
var tabs = require('sdk/tabs');
var { ToggleButton } = require('sdk/ui/button/toggle');
var { setInterval, clearInterval } = require('sdk/timers');
var simplePrefs = require('sdk/simple-prefs');


// Interval
var intervalID;
var timer = 0;
var timerStartTime = 0;



//
// Functions
//

function millisecondsToTimeText(milliseconds) {
	var seconds = parseInt((milliseconds / 1000) % 60);
	var minutes = parseInt((milliseconds / (1000 * 60)) % 60);

	minutes = (minutes < 10) ? '0' + minutes : minutes;
	seconds = (seconds < 10) ? '0' + seconds : seconds;

	return minutes + ':' + seconds;
}

function millisecondsToMinutes(milliseconds) {
	return parseInt(milliseconds / (1000 * 60));
}

function addTimerToTimeline(milliseconds) {
	ss.storage.timeline.push({
		timeout: milliseconds,
		date: new Date()
	});
}

function getRemainingTime() {
	var date = new Date();
	return timer - (date.getTime() - timerStartTime);
}

function resetTimer() {
	clearInterval(intervalID);
	timer = 0;
	timerStartTime = 0;
	toggleButton.badge = undefined;
	toggleButton.icon = {
		'16': './Pictures/tomato-icon-inactive-16.png',
		'32': './Pictures/tomato-icon-inactive-32.png',
		'64': './Pictures/tomato-icon-inactive-64.png'
	};
}

function setTimer(milliseconds) {
	resetTimer();
	timer = milliseconds;
	timerStartTime = (new Date()).getTime();

	if (simplePrefs.prefs['badge'] === true) {
		toggleButton.badge = millisecondsToMinutes(getRemainingTime());
	}
	toggleButton.icon = {
		'16': './Pictures/tomato-icon-16.png',
		'32': './Pictures/tomato-icon-32.png',
		'64': './Pictures/tomato-icon-64.png'
	};

	intervalID = setInterval(function() {
		if (getRemainingTime() <= 0) {
			addTimerToTimeline(timer);

			notifications.notify({
				title: 'Pomodoro Clock',
				text: 'End of ' + millisecondsToTimeText(timer) + ' timer',
			});

			resetTimer();
		} else {
			if (simplePrefs.prefs['badge'] === true) {
				toggleButton.badge = millisecondsToMinutes(getRemainingTime());
			}
		}
	}, 1000);
}



//
// Setup
//

// Setup panel
var panel = panels.Panel({
	contentURL: self.data.url('panel.html'),
	width: 130,
	height: 300,
	onHide: function() {
		toggleButton.state('window', { checked: false });
	},
	onShow: function() {
		var remainingTime = getRemainingTime();
		if (remainingTime > 0) {
			panel.port.emit('show', remainingTime);
		}
	}
});

// Setup toggle button
var toggleButton = ToggleButton({
	id: 'pomodoro-toggle-button',
	label: 'Pomodoro Clock',
	icon: {
		'16': './Pictures/tomato-icon-inactive-16.png',
		'32': './Pictures/tomato-icon-inactive-32.png',
		'64': './Pictures/tomato-icon-inactive-64.png'
	},
	onChange: function(state) {
		if (state.checked) {
			panel.show({
				position: toggleButton
			});
		}
	}
});

// Setup storage
if (!ss.storage.timeline) {
	ss.storage.timeline = [];
}

ss.on('OverQuota', function() {
	while (ss.quotaUsage > 1) {
		ss.storage.timeline.shift();
	}
});



// Listen for events
panel.port.on('set-timer', setTimer);
panel.port.on('reset-timer', resetTimer);

panel.port.on('http://pomodorotechnique.com', function() {
	tabs.open('http://pomodorotechnique.com');
	panel.hide();
});

panel.port.on('stats.html', function() {
	tabs.open({
		url: 'stats.html',
		onReady: function(tab) {
			var worker = tab.attach({
				contentScriptFile: [
					'../data/Libraries/Chart.js-1.0.2/Chart.min.js',
					'../data/Libraries/jquery-2.1.4.min.js',
					'../data/Libraries/bootstrap-daterangepicker-master/moment.min.js',
					'../data/Libraries/bootstrap-daterangepicker-master/daterangepicker.js',
					'../data/timeline.js',
					'../data/timeline.browser.js',
					'../data/stats.js'
				],
				contentScriptOptions: {
					timeline: ss.storage.timeline
				}
			});

			worker.port.on('reset-stats', function() {
				ss.storage.timeline = [];
			});
		}
	});

	panel.hide();
});

simplePrefs.on('badge', function() {
	if (simplePrefs.prefs['badge'] === true) {
		toggleButton.badge = millisecondsToMinutes(getRemainingTime());
	} else {
		toggleButton.badge = undefined;
	}
});
