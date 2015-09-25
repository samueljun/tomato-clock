//
// Firefox SDK
//

var notifications = require('sdk/notifications');
var panels = require('sdk/panel');
var self = require('sdk/self');
var ss = require('sdk/simple-storage');
var tabs = require('sdk/tabs');
var { ToggleButton } = require('sdk/ui/button/toggle');
var { setTimeout, clearTimeout } = require('sdk/timers');



//
// Functions
//

function resetTimeout() {
	clearTimeout(timeoutID);
	initialTimeoutTime = 0;
}

function msToTime(duration) {
	var seconds = parseInt((duration/1000)%60);
	var minutes = parseInt((duration/(1000*60))%60);

	minutes = (minutes < 10) ? '0' + minutes : minutes;
	seconds = (seconds < 10) ? '0' + seconds : seconds;

	return minutes + ':' + seconds;
}

function timeoutEnd() {
	notifications.notify({
		title: 'Pomodoro Clock',
		text: 'End of ' + msToTime(initialTimeoutTime) + ' timer',
	});

	addTimeoutToTimeline(initialTimeoutTime);
	resetTimeout();
}

function addTimeoutToTimeline(initialTimeoutTime) {
	ss.storage.timeline.push({
		timeout: initialTimeoutTime,
		date: new Date()
	});
}

function getRemainingTime() {
	var date = new Date();
	return initialTimeoutTime - (date.getTime() - timeoutStartTime);
}



//
// Setup
//

// Timeout
var timeoutID;
var initialTimeoutTime = 0;
var timeoutStartTime = 0;

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
		'16': './Pictures/tomato-icon-16.png',
		'32': './Pictures/tomato-icon-32.png',
		'64': './Pictures/tomato-icon-64.png'
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



// Listen for panel events
panel.port.on('set-timeout', function(time) {
	resetTimeout();

	timeoutID = setTimeout(timeoutEnd, time);
	initialTimeoutTime = time;
	timeoutStartTime = (new Date()).getTime();
});

panel.port.on('reset-timeout', resetTimeout);

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
