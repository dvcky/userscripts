// ==UserScript==
// @name        BetterCoup
// @match       https://www.chickenkoup.com/*
// @version     0.1-beta
// @author      dvcky
// @description A userscript for Coup Online with more sane defaults.
// ==/UserScript==

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
				// grab Event Log element
				var eventLogs = document.getElementsByClassName("EventLogBody")[0];

				// set flexbox - allows for new chat display order
				eventLogs.style.display = "flex";
				eventLogs.style.flexDirection = "column";
				// eventLogs.style.justifyContent = "flex-end";

				// new height
				eventLogs.style.height = "16vh";
				eventLogs.style.height = "48vh";

				// fix issues with external elements surrounding
				eventLogs.parentElement.style.paddingRight = "0";
				eventLogs.parentElement.firstChild.style.height = "1.2vh";
				eventLogs.parentElement.firstChild.style.padding = "5px 0 0 2px";
				eventLogs.parentElement.firstChild.style.backgroundColor = "#707070";
				eventLogs.parentElement.firstChild.style.color = "white";

				// keeps text aligned to the bottom of the Event Log
				const eventSpacer = document.createElement("div");
				eventSpacer.style.marginTop = "auto";
				eventLogs.prepend(eventSpacer);

				// adds a draggable div to adjust the size of Event Log
				const eventDrag = document.createElement("div");
				eventDrag.style.height = "1vh";
				eventDrag.style.width = "100%";
				eventDrag.style.cursor = "ns-resize";
				eventDrag.style.color = "white";
				eventDrag.style.textAlign = "center";
				eventDrag.style.backgroundColor = "#707070";
				eventDrag.innerHTML = "🠗";
				eventLogs.parentElement.append(eventDrag);

				var m_pos;
				// drag-and-drop resize calculations (for eventDrag)
				function resize(e) {
					var dy = m_pos - e.y;
					m_pos = e.y;
					eventLogs.style.height = parseInt(getComputedStyle(eventLogs).height) - dy + "px";
				}
				// event listeners for drap-and-drop action
				eventDrag.addEventListener("mousedown", function (e) {
					m_pos = e.y;
					document.addEventListener("mousemove", resize, false);
				});
				document.addEventListener("mouseup", function () {
					document.removeEventListener("mousemove", resize, false);
				});
			}

			// if new element is startGameButton, the game is over. clear chat!
			if (mutations[m].addedNodes[0].className == "startGameButton") {
				// grab Event Log element again
				var eventLogs = document.getElementsByClassName("EventLogBody")[0];

				// iterate through each previous chat message and apply styling that makes it visually gone. IMPORTANT: can't actually delete these, bug occurs.
				for (var i = 1; i < eventLogs.childElementCount; ++i) {
					eventLogs.children[i].style.height = "0";
					eventLogs.children[i].style.margin = "0";
					eventLogs.children[i].style.overflow = "hidden";
				}

				// create clear message and print it to the event log
				const clearMsg = document.createElement("p");
				clearMsg.innerHTML = tag + " <i>Chat cleared!</i>";

				eventLogs.firstChild.insertAdjacentElement("afterend", clearMsg);
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

window.onload = function () {
	var homeChildren = document.getElementsByClassName("homeContainer")[0].children;
	homeChildren[0].innerHTML = "Welcome to " + tag;
	homeChildren[1].innerHTML = "A game of deduction and deception <span style='color: fuchsia;'><i>(with some tweaked, more sane defaults!)</i></span>";
	homeChildren[2].src = "https://raw.githubusercontent.com/twitter/twemoji/master/assets/svg/1f438.svg";

	// THE MOST IMPORTANT PART: THE WATERMARK!
	const watermark = document.createElement("p");
	watermark.innerHTML = tag + " v0.1-beta+" + fakeCommit(7);
	watermark.style.position = "absolute";
	watermark.style.marginLeft = "1em";
	document.body.prepend(watermark);
};
