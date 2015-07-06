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
	clearTimeout(timeout);
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
		title: 'Pomodoro Timer',
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



//
// Setup
//

// Setup toggle button
var toggleButton = ToggleButton({
	id: 'pomodoro-toggle-button',
	label: 'Pomodoro',
	icon: {
		'16': './tomato-icon-16.png',
		'32': './tomato-icon-32.png',
		'64': './tomato-icon-64.png'
	},
	onChange: function(state) {
		if (state.checked) {
			panel.show({
				position: toggleButton
			});
		}
	}
});

// Setup panel
var panel = panels.Panel({
	contentURL: self.data.url('panel.html'),
	height: 90,
	onHide: function() {
		toggleButton.state('window', { checked: false });
	}
});

// Setup Storage
if (!ss.storage.timeline) {
	ss.storage.timeline = [
		// { timeout: 1500000, date: '2015-07-01' },
		// { timeout: 1500000, date: '2015-07-02' },
		// { timeout: 1500000, date: '2015-07-03' },
		// { timeout: 1500000, date: '2015-07-04' },
		// { timeout: 1500000, date: '2015-07-05' },
		// { timeout: 1500000, date: '2015-07-06' },
		// { timeout: 1500000, date: '2015-07-06' },
		// { timeout: 1500000, date: '2015-07-06' },
		// { timeout: 1500000, date: '2015-07-07' },
		// { timeout: 1500000, date: '2015-07-08' },
		// { timeout: 1500000, date: '2015-07-09' },
		// { timeout: 1500000, date: '2015-07-09' },
		// { timeout: 1500000, date: '2015-07-09' },
		// { timeout: 1500000, date: '2015-07-09' },
		// { timeout: 1500000, date: '2015-07-10' },
		// { timeout: 1500000, date: '2015-07-11' },
		// { timeout: 1500000, date: '2015-07-13' },
		// { timeout: 1500000, date: '2015-07-14' },
		// { timeout: 1500000, date: '2015-07-15' },
		// { timeout: 1500000, date: '2015-07-17' },
		// { timeout: 1500000, date: '2015-07-18' },
		// { timeout: 1500000, date: '2015-07-21' },
		// { timeout: 1500000, date: '2015-07-22' },
		// { timeout: 1500000, date: '2015-07-22' },
		// { timeout: 1500000, date: '2015-07-22' },
		// { timeout: 1500000, date: '2015-07-23' },
		// { timeout: 1500000, date: '2015-07-24' },
		// { timeout: 1500000, date: '2015-07-25' },
		// { timeout: 1500000, date: '2015-07-27' },
		// { timeout: 1500000, date: '2015-07-27' },
		// { timeout: 1500000, date: '2015-07-27' },
		// { timeout: 1500000, date: '2015-07-28' },
	];
}

ss.on('OverQuota', function() {
	while (ss.quotaUsage > 1) {
		ss.storage.timeline.shift();
	}
});



// Timeout
var timeout;
var initialTimeoutTime = 0;



// Listen for panel events
panel.port.on('set-timeout', function(time) {
	resetTimeout();

	timeout = setTimeout(timeoutEnd, time);
	initialTimeoutTime = time;
});

panel.port.on('reset-timeout', resetTimeout);

panel.port.on('pomodorotechnique.com', function() {
	tabs.open('http://pomodorotechnique.com');
	panel.hide();
});

panel.port.on('stats.html', function() {
	tabs.open({
		url: 'stats.html',
		onReady: function(tab) {
			tab.attach({
				contentScriptFile: [
					'../data/Libraries/Chart.js-1.0.2/Chart.min.js',
					'../data/Libraries/jquery-2.1.4.min.js',
					'../data/Libraries/bootstrap-daterangepicker-master/moment.min.js',
					'../data/Libraries/bootstrap-daterangepicker-master/daterangepicker.js',
					'../data/stats.js'
				],
				contentScriptOptions: {
					timeline: ss.storage.timeline
				}
			})
		}
	});

	panel.hide();
});
