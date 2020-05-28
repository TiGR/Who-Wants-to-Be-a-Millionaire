/**
* Edits the number prototype to allow money formatting
*
* @param fixed the number to fix the decimal at. Default 2.
* @param decimalDelim the string to deliminate the non-decimal
*        parts of the number and the decimal parts with. Default "."
* @param breakdDelim the string to deliminate the non-decimal
*        parts of the number with. Default ","
* @return returns this number as a USD-money-formatted String
*		  like this: x,xxx.xx
*/
Number.prototype.money = function(fixed, decimalDelim, breakDelim){
	var n = this,
	fixed = isNaN(fixed = Math.abs(fixed)) ? 2 : fixed,
	decimalDelim = decimalDelim == undefined ? "." : decimalDelim,
	breakDelim = breakDelim == undefined ? "," : breakDelim,
	negative = n < 0 ? "-" : "",
	i = parseInt(n = Math.abs(+n || 0).toFixed(fixed)) + "",
	j = (j = i.length) > 3 ? j % 3 : 0;
	return negative + (j ? i.substr(0, j) +
		 breakDelim : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + breakDelim) +
		  (fixed ? decimalDelim + Math.abs(n - i).toFixed(fixed).slice(2) : "");
}

/* Any for array */
anyInArray = function (array, filter) {
	var result = false;
	for (var i=0; i<array.length; i++) {
		if (filter(array[i]))
			result = true;
	}
	return result;
}

/**
* Ko handler to merge visible and transition
*/
ko.bindingHandlers.fadeVisible = {
    init: function(element, valueAccessor) {
        // Initially set the element to be instantly visible/hidden depending on the value
        var value = valueAccessor();
        $(element).toggle(ko.unwrap(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
    },
    update: function(element, valueAccessor) {
        // Whenever the value subsequently changes, slowly fade the element in or out
        var value = valueAccessor();
        ko.unwrap(value) ? $(element).removeClass('disabled') : $(element).addClass('disabled');
    }
};

/**
* Settings which can differ from game to game. Change them if you like. Easy and awesome.
*/
var configuration = {
	// Default options
	// Possible values (can be multiple): 'fifty', 'phone', 'audience'
	defaultOptions: ['fifty', 'phone', 'audience', 'secondChance', 'secondChance', 'secondChance'],
	// Default highlighted money amounts (numerated from 1 to 15)
	defaultMajorLevels: [5, 10, 15],
	// If true, then after game over you can continue current level
	giveLastChance: false,
	// If true, then after 'last chance restart' options are reseted
	resetOptionsAfterLastChance: true
}

/**
* Plays a sound via HTML5 through Audio tags on the page
*
* @require the id must be the id of an <audio> tag.
* @param id the id of the element to play
* @param loop the boolean flag to loop or not loop this sound
*/
startSound = function(id, loop) {
	soundHandle = document.getElementById(id);
	if(loop)
		soundHandle.setAttribute('loop', loop);
	soundHandle.play();
}

/* Give me random natural number */
getRandomNumber = function (from, to) {
	return Math.floor(Math.random() * (to - from + 1) + from);
}

/*
* State of the answer (A-D)
* Contains: is answer visible and is answer selected
*/
var AnswerState = function () {
	this.visible = ko.observable(true);
	this.selected = ko.observable(false);
}

/**
* The View Model that represents one game of
* Who Wants to Be a Millionaire.
*
* @param data the question bank to use
*/
var MillionaireModel = function(data) {
	var self = this;

	// The 15 questions of this game
    this.questions = data.questions;

    // Boolean whether mute is on or off
    this.muting		= false;

    // A flag to keep multiple selections
    // out while transitioning levels
    this.transitioning = false;

    // The current money obtained
 	this.money = ko.observable(0);

 	// The current level(starting at 1)
 	this.level = ko.observable(1);

 	// States of all four answers
 	this.answerStates = [new AnswerState(), new AnswerState(), new AnswerState(), new AnswerState()]

 	// Is 'second chance' option recently used
 	this.secondChanceInUse = ko.observable(false);

 	// The possible (unused) options (50-50 and etc)
 	this.options = ko.observableArray(configuration.defaultOptions.slice(0));

 	// Highlighted amounts
 	this.majorLevels = ko.observableArray(configuration.defaultMajorLevels.slice(0))

 	self.mute = function(){
 		this.muting = !this.muting;
 		var muting = this.muting;

 		var src = $("#mute").attr("src");
 		$("#mute").attr("src", $("#mute").attr("altimg"));

 		$("#mute").attr("altimg", src)

 		$("audio").each(function(){
 			$(this).prop('muted', muting);
 		});
 	}

 	// Grabs the question text of the current question
 	self.getQuestionText = function() {
 		return self.questions[self.level() - 1].question;
 	}

 	// Gets the answer text of a specified question index (0-3)
 	// from the current question
 	self.getAnswerText = function(index) {
 		return self.questions[self.level() - 1].content[index];
 	}

 	self.useOption = function(index) {
		if (self.transitioning)
			return;
		var value = self.options()[index()];
		var used = false;
		if (value == 'fifty') {
			used = self.fifty();
		} else if (value == 'secondChance') {
			used = self.secondChance();
		} else if (value == 'phone' || value == 'audience') {
			used = true;
		} else {
			throw 'Unknown option ' + value;
		}
		if (used) {
			self.options.splice(index(), 1);
		}
 	}

 	// You can choose one wrong answer option.
 	self.secondChance = function() {
 		if (self.secondChanceInUse()) {
 			return false;
 		}
 		self.secondChanceInUse(true);
 		return true;
 	}

 	// Uses the fifty-fifty option of the user
 	self.fifty = function() {
 		var currentlyVisible = 0;
 		for (var i=0; i<4; i++) {
 			if (self.answerStates[i].visible()) {
 				currentlyVisible++;
 			}
 		}
 		if (currentlyVisible < 4)
 			return false;

 		var correct = this.questions[self.level() - 1].correct;
 		var first = correct;
 		var second = correct;
 		while (first == correct || second == correct || first == second)
 		{
	 		first = getRandomNumber(0, 3);
	 		second = getRandomNumber(0, 3);
 		}
 		self.answerStates[first].visible(false);
 		self.answerStates[second].visible(false);
 		return true;
 	}

 	self.majorLevel = function(numpy) {
 		if (anyInArray(self.majorLevels(), function (level) {
 			return level == numpy;
 		})) {
 			self.majorLevels.remove(numpy);
 		} else {
 			self.majorLevels.push(numpy);
 		}
 	}

 	self.isMajorLevel = function(numpy) {
 		return anyInArray(self.majorLevels(), function (level) {
 			return numpy == level;
 		});
 	}

 	self.unselectAnswers = function() {
 		for (var i=0; i<4; i++) {
			self.answerStates[i].selected(false);
		}
 	}

 	self.showAllAnswers = function() {
 		for (var i=0; i<4; i++) {
			self.answerStates[i].visible(true);
		}
 	}

	self.resetAnswersView = function() {
 		$('.answer').css('background', '');
 	}

 	// Attempts to answer the question with the specified
 	// answer index (0-3) from a click event of elm
 	self.answerQuestion = function(index, elm) {
 		if(self.transitioning)
 			return;
 		if (!self.answerStates[index].selected()) {
 			self.unselectAnswers();
			self.answerStates[index].selected(true);
			return;
 		}
 		self.unselectAnswers();
 		self.transitioning = true;
 		if(self.questions[self.level() - 1].correct == index) {
 			self.rightAnswer(elm);
 		} else {
 			self.wrongAnswer(elm);
 		}
 		self.secondChanceInUse(false);
 	}

 	// Executes the proceedure of a correct answer guess, moving
 	// the player to the next level (or winning the game if all
 	// levels have been completed)
 	self.rightAnswer = function(elm) {

 			startSound('rightsound', false);
 			//var bgcss = ($("#" + elm).toggleClass('correct'))
 			$(elm).toggleClass('correct');
			setTimeout(function () {
 				self.money($(".active").data('amt'));
 				if(self.level() + 1 > 15) {
	 				$("#game").fadeOut('slow', function() {
	 					$("#game-over").html('You Win!');
	 					$("#game-over").fadeIn('slow');
	 				});
 				} else {

 					$("#question-answer-block").fadeOut('fast', function(){
 						$("#question-answer-block").fadeIn('slow');

	 					self.level(self.level() + 1);
	 					var bgcss = ($(elm).toggleClass('correct'))
				 		self.showAllAnswers();
				 		self.transitioning = false;
			 		})
 				}
 				self.resetAnswersView();
 			}, 1000)


 	}

 	// Executes the proceedure of guessing incorrectly, losing the game.
 	self.wrongAnswer = function(elm) {

 			startSound('wrongsound', false);
 			$(elm).css('background', 'red');
 			if (self.secondChanceInUse()) {
 				self.secondChanceInUse(false);
 				self.transitioning = false;
 				return;
 			}
 			setTimeout(function(){
 				$("#game").fadeOut('slow', function() {
 					if (configuration.giveLastChance) {
 						$("#game-over").html('<p>Game Over!</p><p id="more-chance">please give me one more chance</p>');
 						$("#more-chance").click(function () {
							$("#game-over").fadeOut('slow', function () {
								$("#game").fadeIn('slow')
							});
							if (configuration.resetOptionsAfterLastChance) {
								self.options(configuration.defaultOptions.slice(0));
							}
						});
 					} else {
 						$("#game-over").html('Game Over!');
 					}
 					$("#game-over").fadeIn('slow');
 					self.transitioning = false;
 					self.resetAnswersView();
 				});
 			}, 1000)

 	}

 	// Gets the money formatted string of the current won amount of money.
 	self.formatMoney = function() {
	    return self.money().money(2, '.', ',');
	}
};

// Executes on page load, bootstrapping
// the start game functionality to trigger a game model
// being created
$(document).ready(function() {
	$.getJSON("questions.json", function(data) {
		for(var i = 1; i <= data.games.length; i++) {
			$("#problem-set").append('<option value="' + i + '">' + i + '</option>');
		}
		$("#pre-start").show();
		$("#start").click(function() {
			var index = $('#problem-set').find(":selected").val() - 1;
			ko.applyBindings(new MillionaireModel(data.games[index]));
			$("#pre-start").fadeOut('slow', function() {
				startSound('background', true);
				$("#game").fadeIn('slow');
			});
		});
	});
});
