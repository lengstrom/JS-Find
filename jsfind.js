function JSFind(target, searchDiv, cl) {
	this.target = target;
	this.input = undefined;
	this.searchDiv = searchDiv;
	this.ranges = [];
	this.hidden = 1;
	this.keys = [];
	this.listener = new window.keypress.Listener();
	this.currentSpan = [-1, undefined]; // [#,range]
	
	this.hide = function() {
		$('.close').css('color','#c0392b');
		$(searchDiv).animate({top:'-33px'}, 75, "linear");
		this.input.blur();
		this.hidden = 1;
		$('.sideLight').remove();
		for (i = 0; i < this.ranges.length; i++) {
			this.cssApplier.undoToRange(this.ranges[i]);
		}

		if (this.currentSpan[1]) {
			this.cssApplierCurrent.undoToRange(this.currentSpan[1]);
		}
	};

	this.show = function() {
		$('.close').css('color','#000000');
		$(searchDiv).slideDown();
		$(searchDiv).animate({top:0}, 75, "linear");
		this.hidden = 0;
	};

	this.toggle = function() {
		if (this.hidden) {
			this.show();
		} else {
			this.hide();
		}
	};

	this.handleKeyCombo = function(e) {
		if (this.hidden) {
			this.show();
		}

		$(this.input).focus();
		e.preventDefault();
		return false;
	};

	this.init = function() {
		if (cl) {
			this.cssApplier = rangy.createCssClassApplier(cl, {normalize: true});
		} else {
			this.cssApplier = rangy.createCssClassApplier("highlight", {normalize: true});
		}

		this.cssApplierCurrent = rangy.createCssClassApplier('highlight-current', {normalize: true});

		var input = document.createElement('input');
		// <input id = 'input' type='text' onkeydown='JSFinder.updateFind()'/>
		input.type = 'text';
		var t = this;

		this.listener.register_combo({
			keys:'ctrl f',
			on_keydown:function(e) {
				if (this.input != document.activeElement) {
					t.handleKeyCombo(e);
					e.preventDefault();
					return false;
				}
			}
		});

		this.listener.register_combo({
			keys:'cmd f',
			on_keydown:function(e) {
				if (this.input != document.activeElement) {
					t.handleKeyCombo(e);
					e.preventDefault();
					return false;
				}
			}
		});

		input.onkeyup = function(e) {
			if (e.keyCode == 27) {
				t.hide();
			} else if (e.keyCode == 13) {
				e.preventDefault();
				return false;
			} else {
				t.updateFind(e);
			}
		};

		input.onkeydown = function(e) {
			if (e.keyCode == 13) {
				if (!t.hidden || t.currentSpan[0] > -1) {
					t.processCurrentSpan(t.currentSpan[0] + 1);
				}

				e.preventDefault();
				return false;
			}
		};

		searchDiv.appendChild(input);
		this.input = input;
		searchDiv.className = 'finder';


		var arrows = document.createElement('div');
		arrows.className = 'arrows';

		var downArrow = document.createElement('div');
		downArrow.className = 'downArrow arrows';
		downArrow.innerHTML = '<i class="fa fa-angle-up fa-lg">';
		downArrow.onmouseup = function() {
			if (t.currentSpan[0] > -1) {
				t.processCurrentSpan(t.currentSpan[0] - 1);
			}
		};

		var upArrow = document.createElement('div');
		upArrow.className = 'upArrow arrows';
		upArrow.innerHTML = '<i class="fa fa-angle-down fa-lg">';
		upArrow.onmouseup = function() {
			if (t.currentSpan[0] > -1) {
				t.processCurrentSpan(t.currentSpan[0] + 1);
			}
		};

		var closeBtn = document.createElement('div');
		closeBtn.className = 'arrows close';
		closeBtn.innerHTML = '<i class="fa fa-times fa-lg">';
		closeBtn.onmouseup = function() {
			t.hide();
		};

		searchDiv.appendChild(closeBtn);
		searchDiv.appendChild(upArrow);
		searchDiv.appendChild(downArrow);

		var matches = document.createElement('div');
		matches.className = "finder-matches";
		matches.onmousedown = function(e){
			$(input).focus();
			e.preventDefault();
			return false;
		};

		this.matches = matches;
		searchDiv.appendChild(matches);
		matches.innerHTML = '';
	};

	this.init();

	this.updateFind = function(e) {
		if (e.keyCode == 13) {
			this.processCurrentSpan();
			return;
		}

		var i;
		for (i = 0; i < this.ranges.length; i++) {
			this.cssApplier.undoToRange(this.ranges[i]);
		}

		if (this.currentSpan[1]) {
			this.cssApplierCurrent.undoToRange(this.currentSpan[1]);
		}

		this.ranges = [];

		var text = this.input.value.toLowerCase();
		text = text.replace(/\s+/g, "\\s+");
		if (text == '\\s+') {
			this.processCurrentSpan();
			return;
		}

		var re = new RegExp(text, "g");

		if (text === '') {
			this.processCurrentSpan();
			return;
		}

		var j;
		var plaintextToSearch = target.textContent.toLowerCase();
		var plaintextRanges = [];
		var strings = plaintextToSearch.match(re);
		if (strings === null || strings === undefined || strings.length === 0) {
			this.processCurrentSpan();
			return;
		}

		for (i = 0; i < strings.length; i++) {
			for (j = i + 1; j < strings.length; j++) {
				if (strings[i] == strings[j]) {
					strings.splice(j, 1);
					j--;
				}
			}
		}

		for (j = 0; j < strings.length; j++) {
			text = strings[j];
			i = 0;
			while (i < plaintextToSearch.length - text.length) {
				var searchIndex = plaintextToSearch.substring(i).indexOf(text);
				if (searchIndex > -1) {
					plaintextRanges.push([i + searchIndex, i + searchIndex + text.length]);
					i += searchIndex + text.length;
				} else {
					break;
				}
			}
		}

		var ct = 0;
		for (i = 0; i < plaintextRanges.length; i++) {
			var r = findRangeOfPlaintextInNode(plaintextRanges[i],this.target);
			this.ranges.push(r);
			this.cssApplier.applyToRange(r);
			ct++;
		}

		this.processCurrentSpan();
	};

	this.setMatchesText = function() {
		this.matches.innerHTML = (this.currentSpan[0] + 1) + " of " + this.ranges.length;
		if (this.input.value == '') {
			this.matches.innerHTML = '';
		}

		$('.sideLight').remove();
		if (this.currentSpan[0] != -1) {
			for (var i = 0; i < this.ranges.length; i++) {
				var top = $(this.ranges[i].startContainer.parentNode).offset().top;
				top /= $(this.target).height();
				top *= window.innerHeight;
				var el = document.createElement('div');
				el.className = 'sideLight';
				$(el).css('top', top + 'px');
				$(this.target).append(el);
			}

			this.cssApplierCurrent.applyToRange(this.currentSpan[1]);
			var dist = $(this.currentSpan[1].startContainer.parentNode).offset().top + 20;
			if (dist > window.innerHeight + $('body').scrollTop() || dist < $('body').scrollTop()) {
				$('html,body').scrollTop(dist);
			}
		}
	};

	this.processCurrentSpan = function(n) {
		if (this.ranges.length === 0) { // if there are no matches
			this.currentSpan[0] = -1;
		} else if (n !== undefined) { // setting to specific span
			n = n % this.ranges.length;
			while (n < 0) {
				n += ranges.length;
			}

			if (this.currentSpan[1]) {
				this.cssApplierCurrent.undoToRange(this.currentSpan[1]);
			}
			this.currentSpan = [n, this.ranges[n]];
		} else if (this.currentSpan[1] === undefined) { // if there were no matches previously
			this.currentSpan = [0, this.ranges[0]];
		} else {
			var targetOffset = $(this.currentSpan[1].startContainer.parentNode).offset().top;
			var q = 0;
			var i;
			for (i = 0; i < this.ranges.length; i++) {
				if ((this.ranges[i].startContainer == this.currentSpan[1].startContainer && this.ranges[i].startOffset == this.currentSpan[1].startOffset)) {
					this.currentSpan = [i, this.ranges[i]];
					q = 1;
					if ($(this.ranges[i].startContainer.parentNode).offset().top > targetOffset) break;
				}
			}

			if (!q) {
				for (i = 0; i < this.ranges.length; i++) {
					if ($(this.ranges[i].startContainer.parentNode).offset().top + 2 >= targetOffset) {
						this.currentSpan = [i, this.ranges[i]];
						break;
					}
				}
			}
		}

		this.setMatchesText();
	};
}

function findRangeOfPlaintextInNode(range, node) {
	var r = rangy.createRange();
	var s = findPlaintextIndexInNode(range[0], node);
	var e = findPlaintextIndexInNode(range[1], node);
	if (s && e) {
		if (s[0] && e[0]) {
			r.setStart(s[0], s[1]);
			r.setEnd(e[0], e[1]);
			return r;
		}
	}

	return false;
}

function findPlaintextIndexInNode(index, node) {
	var childNodes = node.childNodes;
	var localIndex = 0; // [0, inf)
	for (var i = 0; i < childNodes.length; i++) {
		var cNode = childNodes[i];
		if (cNode.nodeType == Node.ELEMENT_NODE) {
			var testIndex = findPlaintextIndexInNode(index - localIndex, cNode);
			if (typeof(testIndex) == 'number') {
				localIndex += testIndex;
			} else {
				return testIndex;
			}
		} else if (cNode.nodeType == Node.TEXT_NODE) {
			var nodeString = cNode.data;
			if (nodeString.charAt(index - localIndex) != '') {
				return [cNode, index - localIndex];
			} else {
				localIndex += nodeString.length;
			}
		}
	}

	return localIndex;
}