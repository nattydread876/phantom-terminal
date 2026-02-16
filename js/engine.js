var PhantomEngine = (function () {
  var state = {
    currentNode: null,
    inventory: [],
    visited: [],
    bootComplete: false,
    escPressCount: 0,
    isTyping: false,
    skipTyping: false,
    soundEnabled: true,
    merged: false,
    audioCtx: null,
    ambientOsc: null,
    ambientGain: null,
  };

  var els = {};
  var TYPING_SPEED = 25;
  var GLITCH_CHARS = "█▓▒░╗╔╚╝║═╣╠╩╦╬";

  function init() {
    els.terminal = document.getElementById("terminal-output");
    els.choicesContainer = document.getElementById("choices-container");
    els.inventoryList = document.getElementById("inventory-list");
    els.inventoryBar = document.getElementById("inventory-bar");
    els.inventoryToggle = document.getElementById("inventory-toggle");
    els.soundToggle = document.getElementById("sound-toggle");
    els.scanlines = document.getElementById("scanlines");

    els.soundToggle.addEventListener("click", toggleSound);
    els.inventoryToggle.addEventListener("click", toggleInventory);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleSkipClick);

    initAudio();
    checkSave();
  }

  function initAudio() {
    try {
      state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      state.soundEnabled = false;
    }
  }

  function resumeAudio() {
    if (state.audioCtx && state.audioCtx.state === "suspended") {
      state.audioCtx.resume();
    }
  }

  function playTick() {
    if (!state.soundEnabled || !state.audioCtx) return;
    resumeAudio();
    var osc = state.audioCtx.createOscillator();
    var gain = state.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(state.audioCtx.destination);
    osc.frequency.value = 800 + Math.random() * 200;
    osc.type = "square";
    gain.gain.value = 0.02;
    gain.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime + 0.05);
    osc.start(state.audioCtx.currentTime);
    osc.stop(state.audioCtx.currentTime + 0.05);
  }

  function playClick() {
    if (!state.soundEnabled || !state.audioCtx) return;
    resumeAudio();
    var osc = state.audioCtx.createOscillator();
    var gain = state.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(state.audioCtx.destination);
    osc.frequency.value = 1200;
    osc.type = "square";
    gain.gain.value = 0.06;
    gain.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime + 0.08);
    osc.start(state.audioCtx.currentTime);
    osc.stop(state.audioCtx.currentTime + 0.08);
  }

  function playStinger() {
    if (!state.soundEnabled || !state.audioCtx) return;
    resumeAudio();
    var freqs = [220, 185, 147, 110];
    freqs.forEach(function (freq, i) {
      var osc = state.audioCtx.createOscillator();
      var gain = state.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(state.audioCtx.destination);
      osc.frequency.value = freq;
      osc.type = "sawtooth";
      var t = state.audioCtx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  function playStatic() {
    if (!state.soundEnabled || !state.audioCtx) return;
    resumeAudio();
    var bufferSize = state.audioCtx.sampleRate * 0.5;
    var buffer = state.audioCtx.createBuffer(1, bufferSize, state.audioCtx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    var source = state.audioCtx.createBufferSource();
    var gain = state.audioCtx.createGain();
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(state.audioCtx.destination);
    gain.gain.setValueAtTime(0.06, state.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime + 0.5);
    source.start();
  }

  function startAmbient() {
    if (!state.soundEnabled || !state.audioCtx || state.ambientOsc) return;
    resumeAudio();
    state.ambientOsc = state.audioCtx.createOscillator();
    state.ambientGain = state.audioCtx.createGain();
    state.ambientOsc.connect(state.ambientGain);
    state.ambientGain.connect(state.audioCtx.destination);
    state.ambientOsc.frequency.value = 60;
    state.ambientOsc.type = "sine";
    state.ambientGain.gain.value = 0.015;
    state.ambientOsc.start();
  }

  function stopAmbient() {
    if (state.ambientOsc) {
      try { state.ambientOsc.stop(); } catch (e) {}
      state.ambientOsc = null;
      state.ambientGain = null;
    }
  }

  function playNodeSound(soundType) {
    if (!soundType) return;
    switch (soundType) {
      case "static": playStatic(); break;
      case "stinger": playStinger(); break;
    }
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    els.soundToggle.textContent = state.soundEnabled ? "[SND:ON]" : "[SND:OFF]";
    if (state.soundEnabled) {
      startAmbient();
    } else {
      stopAmbient();
    }
  }

  function toggleInventory() {
    els.inventoryBar.classList.toggle("collapsed");
    els.inventoryToggle.textContent = els.inventoryBar.classList.contains("collapsed")
      ? "[INV +]" : "[INV -]";
  }

  function updateInventoryDisplay() {
    els.inventoryList.innerHTML = "";
    if (state.inventory.length === 0) {
      els.inventoryList.innerHTML = "<span class=\"inv-empty\">(empty)</span>";
      return;
    }
    var names = {
      journal_entry: "Sysop's Journal",
      echo_program: "ECHO.EXE",
      rosetta_key: "ROSETTA.KEY",
      entity_trust: "Entity Trust",
      entity_distrust: "Entity Distrust",
    };
    state.inventory.forEach(function (item) {
      var el = document.createElement("span");
      el.className = "inv-item";
      el.textContent = "[" + (names[item] || item) + "]";
      els.inventoryList.appendChild(el);
    });
  }

  function hasItem(item) {
    return state.inventory.indexOf(item) !== -1;
  }

  function giveItem(item) {
    if (!hasItem(item)) {
      state.inventory.push(item);
      updateInventoryDisplay();
    }
  }

  function saveGame() {
    try {
      localStorage.setItem("phantom_save", JSON.stringify({
        currentNode: state.currentNode,
        inventory: state.inventory,
        visited: state.visited,
        merged: state.merged,
      }));
    } catch (e) {}
  }

  function loadGame() {
    try {
      var data = JSON.parse(localStorage.getItem("phantom_save"));
      if (data && data.currentNode) {
        state.currentNode = data.currentNode;
        state.inventory = data.inventory || [];
        state.visited = data.visited || [];
        state.merged = data.merged || false;
        return true;
      }
    } catch (e) {}
    return false;
  }

  function clearSave() {
    try { localStorage.removeItem("phantom_save"); } catch (e) {}
  }

  function checkSave() {
    if (loadGame()) {
      showSavePrompt();
    } else {
      startBoot();
    }
  }

  function showSavePrompt() {
    clearTerminal();
    appendText("Save data found.\n\nLast location: " + state.currentNode + "\nItems: " + state.inventory.length + "\n");
    showChoices([
      { text: "Continue", handler: function () { loadGame(); updateInventoryDisplay(); goToNode(state.currentNode); } },
      { text: "New Game", handler: function () { clearSave(); resetState(); startBoot(); } },
    ]);
  }

  function resetState() {
    state.currentNode = null;
    state.inventory = [];
    state.visited = [];
    state.bootComplete = false;
    state.escPressCount = 0;
    state.merged = false;
  }

  function clearTerminal() {
    els.terminal.innerHTML = "";
  }

  function appendText(text, cssClass) {
    var span = document.createElement("span");
    if (cssClass) span.className = cssClass;
    span.textContent = text;
    els.terminal.appendChild(span);
    scrollToBottom();
  }

  function appendHTML(html) {
    var div = document.createElement("div");
    div.innerHTML = html;
    while (div.firstChild) {
      els.terminal.appendChild(div.firstChild);
    }
    scrollToBottom();
  }

  function appendLine(text, cssClass) {
    appendText(text + "\n", cssClass);
  }

  function scrollToBottom() {
    var container = document.getElementById("terminal-body");
    container.scrollTop = container.scrollHeight;
  }

  function typeText(text, callback) {
    state.isTyping = true;
    state.skipTyping = false;
    var i = 0;
    var span = document.createElement("span");
    els.terminal.appendChild(span);

    function typeNext() {
      if (state.skipTyping) {
        span.textContent = text;
        scrollToBottom();
        state.isTyping = false;
        if (callback) callback();
        return;
      }
      if (i < text.length) {
        span.textContent += text.charAt(i);
        if (text.charAt(i) !== " " && text.charAt(i) !== "\n") {
          playTick();
        }
        i++;
        scrollToBottom();

        var delay = TYPING_SPEED;
        if (text.charAt(i - 1) === "\n") delay = TYPING_SPEED * 3;
        else if (text.charAt(i - 1) === ".") delay = TYPING_SPEED * 4;

        setTimeout(typeNext, delay);
      } else {
        state.isTyping = false;
        if (callback) callback();
      }
    }
    typeNext();
  }

  function glitchText(text) {
    var result = "";
    for (var i = 0; i < text.length; i++) {
      if (Math.random() < 0.03 && text[i] !== "\n" && text[i] !== " ") {
        result += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
      } else {
        result += text[i];
      }
    }
    return result;
  }

  function showChoices(choices) {
    els.choicesContainer.innerHTML = "";
    els.choicesContainer.style.display = "block";

    choices.forEach(function (choice, index) {
      var btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = "[" + (index + 1) + "] " + choice.text;
      btn.setAttribute("data-key", String(index + 1));
      btn.addEventListener("click", function () {
        playClick();
        els.choicesContainer.style.display = "none";
        choice.handler();
      });

      if (choice.locked) {
        btn.classList.add("locked");
        btn.disabled = true;
        btn.textContent += " [LOCKED]";
      }

      els.choicesContainer.appendChild(btn);
    });
    scrollToBottom();
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      if (!state.bootComplete) {
        state.escPressCount++;
        if (state.escPressCount >= 1) {
          state.bootComplete = true;
          goToNode("ending_loop");
          return;
        }
      }
    }

    if (state.isTyping) {
      state.skipTyping = true;
      return;
    }

    var key = parseInt(e.key);
    if (key >= 1 && key <= 9) {
      var btns = els.choicesContainer.querySelectorAll(".choice-btn:not(.locked)");
      var targetIndex = 0;
      var allBtns = els.choicesContainer.querySelectorAll(".choice-btn");
      var enabledCount = 0;
      for (var i = 0; i < allBtns.length; i++) {
        if (!allBtns[i].disabled) {
          enabledCount++;
          if (enabledCount === key) {
            allBtns[i].click();
            break;
          }
        }
      }
    }
  }

  function handleSkipClick(e) {
    if (state.isTyping && !e.target.classList.contains("choice-btn")) {
      state.skipTyping = true;
    }
  }

  function startBoot() {
    clearTerminal();
    state.bootComplete = false;
    state.escPressCount = 0;
    resumeAudio();
    startAmbient();

    var lines = BOOT_SEQUENCE.slice();
    var i = 0;

    function nextLine() {
      if (state.bootComplete && state.currentNode === "ending_loop") return;
      if (i >= lines.length) {
        state.bootComplete = true;
        appendLine("");
        showWelcome();
        return;
      }
      var line = lines[i];
      appendLine(line.text, line.text.indexOf("~~") !== -1 ? "modem-noise" : null);
      if (line.text.indexOf("CONNECT") === 0) playStatic();
      i++;
      setTimeout(nextLine, line.delay);
    }
    nextLine();
  }

  function showWelcome() {
    goToNode("welcome");
  }

  function goToNode(nodeId) {
    if (nodeId === "_restart") {
      clearSave();
      resetState();
      clearTerminal();
      startBoot();
      return;
    }

    if (nodeId === "_restart_merged") {
      clearSave();
      resetState();
      state.merged = true;
      clearTerminal();
      startBoot();
      return;
    }

    var node = STORY_NODES[nodeId];
    if (!node) return;

    if (node.id === "welcome" && hasItem("echo_program")) {
      node = STORY_NODES["welcome_with_door"];
      nodeId = "welcome_with_door";
    }

    state.currentNode = nodeId;
    if (state.visited.indexOf(nodeId) === -1) {
      state.visited.push(nodeId);
    }

    if (node.effect) {
      if (node.effect.type === "give") giveItem(node.effect.item);
    }

    saveGame();

    appendLine("\n────────────────────────────────────\n", "divider");

    if (node.ascii && STORY_ASCII[node.ascii]) {
      appendLine(STORY_ASCII[node.ascii], "ascii-art");
      appendLine("");
    }

    var text = node.text;
    if (state.merged && (nodeId === "welcome" || nodeId === "welcome_with_door")) {
      text = text.replace("Current users online: 1 (you)", "Current users online: 1 (we)");
      text = text.replace("or is it 2?", "there is no 2. there is only us.");
      text = text.replace("Current users online: 2", "Current users online: 1 (we are one)");
    }

    if (node.ending) {
      text = glitchText(text);
    }

    playNodeSound(node.sound);

    typeText(text + "\n", function () {
      if (node.ending) {
        appendLine("");
        appendLine(STORY_ASCII.gameover, "ascii-art ending-art");
        appendLine("");
        appendLine("  - " + node.endingTitle + " -", "ending-title");
        appendLine("");
      }

      var choices = buildChoices(node);
      if (choices.length > 0) {
        showChoices(choices);
      }
    });
  }

  function buildChoices(node) {
    if (!node.choices) return [];

    if (node._check_merge) {
      var hasAll = hasItem("echo_program") && hasItem("rosetta_key") && hasItem("entity_trust");
      if (!hasAll) {
        appendLine("\n  AUTHORIZATION FAILED.", "error-text");
        appendLine("  Required: ECHO.EXE + ROSETTA.KEY + ENTITY TRUST", "error-text");
        appendLine("  Missing components detected.\n", "error-text");
        return [{ text: "Back to Emergency Protocols", handler: function () { goToNode("sysop_emergency"); } }];
      }
    }

    return node.choices.map(function (choice) {
      var locked = false;
      if (choice.requires && !hasItem(choice.requires)) {
        locked = true;
      }
      return {
        text: choice.text,
        locked: locked,
        handler: function () {
          appendLine("\n  > " + choice.text, "player-choice");
          if (choice.gives) giveItem(choice.gives);
          goToNode(choice.next);
        },
      };
    });
  }

  return { init: init };
})();

document.addEventListener("DOMContentLoaded", PhantomEngine.init);
