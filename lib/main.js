// Firefox SDK

var { ToggleButton } = require('sdk/ui/button/toggle');
var { setTimeout, clearTimeout } = require('sdk/timers');
var panels = require('sdk/panel');
var notifications = require('sdk/notifications');
var self = require('sdk/self');
var tabs = require('sdk/tabs');
var ss = require("sdk/simple-storage");



// Setup toggle button

var button = ToggleButton({
	id: 'pomodoro-toggle-button',
	label: 'Pomodoro',
	icon: {
		'16': './tomato-icon-16.png',
		'32': './tomato-icon-32.png',
		'64': './tomato-icon-64.png'
	},
	onChange: buttonHandleChange
});

function buttonHandleChange(state) {
	if (state.checked) {
		panel.show({
			position: button
		});
	}
}



// Setup panel

var panel = panels.Panel({
	contentURL: self.data.url('panel.html'),
	height: 90,
	onHide: panelHandleHide
});

function panelHandleHide() {
	button.state('window', { checked: false });
}



// Setup stats

if (!ss.storage.stats) {
	ss.storage.stats = {
		pomodoroDates: [] 
	};
}
	
function addPomodoroDate() {
	ss.storage.stats.pomodoroDates.push(new Date());
}

function overQuotaListener() {
	while (ss.quotaUsage > 1) {
		ss.storage.stats.pomodoroDates.shift();
	}
}

ss.on("OverQuota", overQuotaListener);



// Timeout

var timeoutIsActive = false;
var timeout;
var initialTimeoutTime = 0;

function resetTimeout() {
	clearTimeout(timeout);
	timeoutIsActive = false;
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

	addPomodoroDate();
	resetTimeout();
}



// Listen for panel events

panel.port.on('set-timeout', function(time) {
	resetTimeout();

	timeout = setTimeout(timeoutEnd, time);
	timeoutIsActive = true;
	initialTimeoutTime = time;
});

panel.port.on('reset-timeout', resetTimeout);

panel.port.on('pomodorotechnique.com', function() {
	tabs.open('http://pomodorotechnique.com');
	panel.hide();
});

panel.port.on('stats.html', function() {
	tabs.open('stats.html', ss.storage.pomodoroDates);
});