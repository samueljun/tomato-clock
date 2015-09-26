function openTab(link) {
	addon.port.emit(link);
}

function setBrowserTimer(ms) {
	addon.port.emit('set-timer', ms);
}

function resetBrowserTimer() {
	addon.port.emit('reset-timer');
}

addon.port.on('show', function(milliseconds) {
	setPanelInterval(milliseconds);
});
