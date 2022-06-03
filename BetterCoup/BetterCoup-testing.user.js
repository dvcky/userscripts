// ==UserScript==
// @name        BetterCoup
// @match       https://www.chickenkoup.com/*
// @version     0.2-beta
// @author      dvcky
// @description A userscript for Coup Online with more sane defaults.
// ==/UserScript==

var allPlayers = [];
var selectedPlayer = "";

// RUN THROUGH NUMBER OF OCCURENCES. FIRST LOOP, TOGGLE FALSE. ALL LOOPS AFTER TOGGLE TRUE
function validateName(name, phrase) {
	var expression = new RegExp("(.*) blocked (.*) |(.*) challenged (.*)'s |(.*)'s challenge on (.*)'s |(.*)'s challenge on (.*) |(.*) used.*on (.*)|(.*) used|(.*) lost", "gm");

	var matches = expression.exec(phrase);

	if (matches != null) {
		for (var i = 1; i < matches.length; ++i) {
			if (matches[i] != null && matches[i] == name) {
				return true;
			}
		}
	}
	return false;
}


function getPlayerActivity(player) {
	var eventLogs = document.getElementsByClassName("EventLogBody")[0];
	var playerName = player.firstChild.textContent;
	selectedPlayer = player;

	if (getComputedStyle(player).boxShadow == "rgb(112, 112, 112) 0px 0px 0px 2px inset") {
		player.style.boxShadow = "none";
	} else {
		for (var i = 0; i < player.parentElement.childElementCount; ++i) {
			player.parentElement.children[i].style.boxShadow = "none";
		}
		player.style.boxShadow = "rgb(112, 112, 112) 0px 0px 0px 2px inset";
	}

	// get player rgba
	var rgba = getComputedStyle(player).backgroundColor.replace("rgb", "rgba").replace(")", ", 0.4)");

	// iterate through each previous chat message and apply styling that makes it visually gone. IMPORTANT: can't actually delete these, bug occurs.
	for (var i = 1; i < eventLogs.childElementCount; ++i) {

		// make sure message is from current game, pointless and wasteful to check others
		if (!(eventLogs.children[i].style.padding == "0" || eventLogs.children[i].textContent.includes("[BetterCoup]"))) {

			// store current rgba value before removing it
			var prevRgba = eventLogs.children[i].style.backgroundColor;
			eventLogs.children[i].style.backgroundColor = "unset";

			// check if message has user's name in it
			if (validateName(playerName, eventLogs.children[i].textContent)) {

				// if not already selected, select!
				if (prevRgba != rgba) {
					eventLogs.children[i].style.backgroundColor = rgba;
				} else {
					selectedPlayer = "";
				}
			}
		}
	}
}


// tag for BetterCoup
var tag = "<b style='background-color: black; color: white;'><span style='color: fuchsia;'>[</span>BetterCoup<span style='color: cyan;'>]</span></b>";


// observer - checks for changes on a given object
var observer = new MutationObserver(function (mutations, observer) {
	// iterate through all mutations
	for (var m = 0; m < mutations.length; ++m) {
		// if mutation is an addition, check it's type
		if (mutations[m].addedNodes.length > 0) {
			// if new element is GameContainer, the user is at a screen where the Event Logs exist
			if (mutations[m].addedNodes[0].className == "GameContainer") {

				var sheet = document.styleSheets[0];
				// grab Event Log element
				var eventLogs = document.getElementsByClassName("EventLogBody")[0];
				sheet.addRule('.GameContainer', 'pointer-events: none;');
				sheet.addRule('@keyframes slideLeft', 'from { transform: translateX(110%); } to { transform: translateX(0%); }');
				sheet.addRule('.EventLogContainer', 'line-height: unset !important;');
				sheet.addRule('.EventLogBody', 'overflow-x: hidden;');
				sheet.addRule('.EventLogBody p', 'background-origin: border-box; margin: 0; padding: 6px 0;');
				sheet.addRule('.PlayerBoardItem', 'cursor: pointer');
				sheet.addRule('.new', 'animation: slideLeft ease 1s !important;');

				// set flexbox - allows for new chat display order
				eventLogs.style.display = "flex";
				eventLogs.style.flexDirection = "column";
				// eventLogs.style.justifyContent = "flex-end";

				// new height
				eventLogs.style.height = "24vh";

				// keeps text aligned to the bottom of the Event Log
				const eventSpacer = document.createElement("div");
				eventSpacer.style.width = "20vh";
				eventSpacer.style.marginTop = "auto";
				eventLogs.prepend(eventSpacer);

				// adds a draggable div to adjust the size of Event Log
				const eventDrag = document.createElement("div");
				eventDrag.style.height = "2px";
				eventDrag.style.width = "100%";
				eventDrag.style.cursor = "ns-resize";
				eventDrag.style.color = "white";
				eventDrag.style.textAlign = "center";
				eventDrag.style.backgroundColor = "#707070";
				eventLogs.parentElement.append(eventDrag);

				var m_pos_x, m_pos_y;
				// drag-and-drop resize calculations (for eventDrag)
				function resize(e) {
					var dy = m_pos_y - e.y;
					m_pos_y = e.y;
					eventLogs.style.height = parseInt(getComputedStyle(eventLogs).height) - dy + "px";
				}

				function moveLog(e) {
					var dy = m_pos_y - e.y;
					var dx = m_pos_x - e.x;
					m_pos_y = e.y;
					m_pos_x = e.x;
					eventLogs.parentElement.style.top = parseInt(getComputedStyle(eventLogs.parentElement).top) - dy + "px";
					eventLogs.parentElement.style.right = parseInt(getComputedStyle(eventLogs.parentElement).right) + dx + "px";
				}

				eventLogs.addEventListener("mousedown", function (e) {
					if (e.button == 1) {
						eventLogs.style.cursor = "move";
						m_pos_y = e.y;
						m_pos_x = e.x;
						document.addEventListener("mousemove", moveLog, false);
					}
				});

				// event listeners for drap-and-drop action
				eventDrag.addEventListener("mousedown", function (e) {
					m_pos_y = e.y;
					document.addEventListener("mousemove", resize, false);
				});
				document.addEventListener("mouseup", function () {
					document.removeEventListener("mousemove", resize, false);
					eventLogs.style.cursor = "unset";
					document.removeEventListener("mousemove", moveLog, false);
				});
			}

			// if new element is startGameButton, the game is over. clear chat!
			if (mutations[m].addedNodes[0].className == "startGameButton") {
				// grab Event Log element again
				var eventLogs = document.getElementsByClassName("EventLogBody")[0];

				// iterate through each previous chat message and apply styling that makes it visually gone. IMPORTANT: can't actually delete these, bug occurs.
				for (var i = 1; i < eventLogs.childElementCount; ++i) {
					eventLogs.children[i].style.height = "0";
					eventLogs.children[i].style.padding = "0";
					eventLogs.children[i].style.overflow = "hidden";
				}

				// create clear message and print it to the event log
				const clearMsg = document.createElement("p");
				clearMsg.innerHTML = tag + " <i>Chat cleared!</i>";

				eventLogs.firstChild.insertAdjacentElement("afterend", clearMsg);
			}

			if (mutations[m].addedNodes[0].className == "PlayerBoardItem") {
				allPlayers.push(mutations[m].addedNodes[0].firstChild.textContent);
				mutations[m].addedNodes[0].addEventListener("click", function () { getPlayerActivity(this); });
			}
			if (mutations[m].addedNodes[0].className == "new") {
				if (validateName(selectedPlayer.firstChild.textContent, mutations[m].addedNodes[0].textContent)) {
					mutations[m].addedNodes[0].style.backgroundColor = getComputedStyle(selectedPlayer).backgroundColor.replace("rgb", "rgba").replace(")", ", 0.4)");
				}
			}
		}
	}
});

// start observing the entire page for changes
observer.observe(document.documentElement, { childList: true, subtree: true });

function fakeCommit(length) {
	var result = "";
	var characters = "abcdefghij0123456789";
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

var toggle = false;
function toggleTheme(button) {
	var sheet = document.styleSheets[0];
	console.log(sheet);
	if(sheet.length > 0) {
		sheet.removeRule(0);
	}
	if(!toggle) {
		sheet.addRule('p','color: white !important;');
		button.style.borderRadius = "unset";
		button.style.backgroundColor = "white";
		document.body.style.backgroundColor = "black";
	} else {
		sheet.addRule('p','color: black !important;');
		button.style.borderRadius = "50%";
		button.style.backgroundColor = "black";
		
		document.body.style.backgroundColor = "white";
	}
	toggle = !toggle;
}

window.onload = function () {

	const themeSvg = document.createElement("div");
	document.body.style.transition = "1s";
	themeSvg.style.borderRadius = "50%";
	themeSvg.style.top = "1em";
	themeSvg.style.width = "20px";
	themeSvg.style.height = "20px";
	themeSvg.style.right = "1em";
	themeSvg.style.position = "absolute";
	themeSvg.style.backgroundColor = "black";
	themeSvg.style.cursor = "pointer";
	themeSvg.style.transition = "1s";
	themeSvg.style.zIndex = "8";
	themeSvg.addEventListener("click", function () { toggleTheme(this); });
	document.body.prepend(themeSvg);

	// THE MOST IMPORTANT PART: THE WATERMARK!
	const watermark = document.createElement("p");
	watermark.innerHTML = tag + " v0.2-beta+" + fakeCommit(7);
	watermark.style.position = "absolute";
	watermark.style.marginLeft = "1em";
	watermark.style.zIndex = "8";
	document.body.prepend(watermark);

	if(document.getElementsByClassName("homeContainer")[0] != null) {
		var homeChildren = document.getElementsByClassName("homeContainer")[0].children;
		homeChildren[0].innerHTML = "Welcome to " + tag;
		homeChildren[1].innerHTML = "A game of deduction and deception <span style='color: fuchsia;'><i>(with some tweaked, more sane defaults!)</i></span>";
		homeChildren[2].src = "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f438.svg";
	}
};