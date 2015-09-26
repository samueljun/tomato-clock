function openTab(link) {
	addon.port.emit(link);
}

function setBrowserTimer(ms) {
	addon.port.emit('set-timeout', ms);
}

function resetBrowserTimer() {
	addon.port.emit('reset-timeout');
}

addon.port.on('show', function(milliseconds) {
	setPanelInterval(milliseconds);
});
