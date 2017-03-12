class Settings {
	constructor() {
		this.storage = new Storage();
		this.updateInputs();
		this.setEventListeners();
		this.updateTimeBlockDisplay();
	}
	
	updateInputs() {
		this.updateTimeInput(TOMATO_TIME_KEY);
		this.updateTimeInput(SHORT_BREAK_KEY);
		this.updateTimeInput(LONG_BREAK_KEY);
		this.updateRepeatInput();
	}
	
	updateTimeInput(type) {
		this.storage.getTime(type).then((time) => {
			$(wrapId(type)).val(time);
		});
	}
	
	updateRepeatInput() {
		this.storage.getRepeatDefaultQueue().then((value) => {
			$(wrapId("repeat")).prop('checked', value);
		});
	}
	
	setEventListeners() {
		var _this = this;
		
		var registerKeyUpEvent = (type) => {
			$(wrapId(type)).keyup((event) => {
				_this.updateTime(type);
			});
		}
		
		registerKeyUpEvent(TOMATO_TIME_KEY);
		registerKeyUpEvent(SHORT_BREAK_KEY);
		registerKeyUpEvent(LONG_BREAK_KEY);
		
		
		var registerClickEvent = (type) => {
			$(wrapId('append', type, 'button')).click(() => {
				_this.appendBlock(type);
			});
		}
		
		registerClickEvent(TOMATO_TIME_KEY);
		registerClickEvent(SHORT_BREAK_KEY);
		registerClickEvent(LONG_BREAK_KEY);
		
		$(wrapId('repeat')).change((event) => {
			this.storage.setRepeatDefaultQueue(event.target.checked);
		});
				
		$('.time-block').click((event) => {
			this.removeTimeBlock(parseInt($(event.target).attr('id').replace('queue-pos-', '')));
		});
	}
	
	updateTime(type) {
		var time = $('#'+type).val();
		if(time) {
			this.storage.setTime(type, time);
		}
	}
	
	appendBlock(type) {
		this.storage.getDefaultQueue().then((defaultQueue) => {
			if(defaultQueue.length<12) {
				defaultQueue.push(type);
				this.storage.setDefaultQueue(defaultQueue).then(() => {
					this.updateTimeBlockDisplay();
				});
			}
		});
	}
	
	removeTimeBlock(index) {
		this.storage.getDefaultQueue().then((defaultQueue) => {
			if(index>=0 && index<defaultQueue.length) {
				defaultQueue.splice(index, 1);
				this.storage.setDefaultQueue(defaultQueue).then(() => {
					this.updateTimeBlockDisplay();
				});
			}
		});
	}
	

	
	updateTimeBlockDisplay() {
		this.storage.getDefaultQueue().then((defaultQueue) => {
			for(var pos=0; pos<12; pos++) {
				var block = $(document.getElementById('queue-pos-' + pos));
				var blockType = defaultQueue[pos];
				block.removeClass('btn-danger btn-info btn-primary');
				if(blockType == TOMATO_TIME_KEY) {
					block.addClass('btn-danger');
				} else if(blockType == SHORT_BREAK_KEY) {
					block.addClass('btn-info');
				} else if(blockType == LONG_BREAK_KEY) {
					block.addClass('btn-primary');
				}
			}
		}); 
	}
}
	

	const setttings = new Settings();

