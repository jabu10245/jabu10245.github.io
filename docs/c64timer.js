const options = {
    time: null,
    message: "time left",
    flicker: false,
    shadow: false,
    hideForm: false,
    timer: null,
};

const elements = {
    form: null,
    timeTextfield: null,
    messageTextfield: null,
    flickerCheckbox: null,
    shadowCheckbox: null,
    formHiddenCheckbox: null,
    unhideInfo: null,
    timeAndMessage: null,
    outerContainer: null,
    flickerOnOff: null,
    textShadowOnOff: null
};

function setup() {
    readOptionsFromParameters();

    elements.form = document.querySelector("form");
    elements.timeTextfield = elements.form.querySelector("#time");
    elements.messageTextfield = elements.form.querySelector("#message");
    elements.flickerCheckbox = elements.form.querySelector("#flicker");
    elements.shadowCheckbox = elements.form.querySelector("#shadow");
    elements.formHiddenCheckbox = elements.form.querySelector("#hide");
    elements.unhideInfo = document.querySelector(".unhide-info");
    elements.timeAndMessage = document.querySelector(".time-and-message");
    elements.outerContainer = document.querySelector(".basic-outer");
    elements.flickerOnOff = document.querySelector(".flicker-on-off");
    elements.textShadowOnOff = document.querySelector(".text-shadow-on-off");

    updateTime(options.time);
    updateMessage(options.message);
    updateFlicker(options.flicker);
    updateShadow(options.shadow);
    updateFormHidden(options.hideForm);

    document.body.onkeyup = event => {
        const { key, target } = event;
        console.log(event);
        if (key === "Escape") {
            updateFormHidden(false);
            if (elements.form.classList.contains("hidden")) {
                elements.form.classList.remove("hidden");
            }
            if (!elements.unhideInfo.classList.contains("hidden")) {
                elements.unhideInfo.classList.add("hidden");
            }
        } else if (key === "f" && target === document.body) {
            updateFlicker(!options.flicker);
            writeParametersFromOptions();
        } else if (key === "s" && target === document.body) {
            updateShadow(!options.shadow);
            writeParametersFromOptions();
        }
    };

    if (options.hideForm) {
        elements.form.classList.add("hidden");
        elements.unhideInfo.classList.remove("hidden");
    }

    startTimer();
}

function startTimer() {
    if (!!options.time && !!options.message?.length && options.timer === null) {
        options.timer = setTimeout(() => timeStep());
    }
}

function updateTime(time) {
    options.time = time;
    elements.timeTextfield.value = time ? formatTime(time) : null;
}

function updateMessage(message) {
    options.message = message;
    elements.messageTextfield.value = message ?? "";
}

function updateFlicker(enabled) {
    options.flicker = enabled;
    elements.flickerCheckbox.checked = enabled;
    if (enabled && !elements.outerContainer.classList.contains("flicker")) {
        elements.outerContainer.classList.add("flicker");
    } else if (!enabled && elements.outerContainer.classList.contains("flicker")) {
        elements.outerContainer.classList.remove("flicker");
    }
    if (enabled) {
        elements.flickerOnOff.innerHTML = 'CRT FLICKER&nbsp;ON&nbsp;&nbsp;-&nbsp;PRESS "F" TO TOGGLE';
    } else {
        elements.flickerOnOff.innerHTML = 'CRT FLICKER&nbsp;OFF&nbsp;-&nbsp;PRESS "F" TO TOGGLE';
    }
}

function updateShadow(enabled) {
    options.shadow = enabled;
    elements.shadowCheckbox.checked = enabled;
    if (enabled && !elements.outerContainer.classList.contains("textshadow")) {
        elements.outerContainer.classList.add("textshadow");
    } else if (!enabled && elements.outerContainer.classList.contains("textshadow")) {
        elements.outerContainer.classList.remove("textshadow");
    }
    if (enabled) {
        elements.textShadowOnOff.innerHTML = 'CRT SHADOW&nbsp; ON&nbsp;&nbsp;-&nbsp;PRESS "S" TO TOGGLE';
    } else {
        elements.textShadowOnOff.innerHTML = 'CRT SHADOW&nbsp; OFF&nbsp;-&nbsp;PRESS "S" TO TOGGLE';
    }
}

function updateFormHidden(enabled) {
    options.hideForm = enabled;
    elements.formHiddenCheckbox.checked = enabled;
}

function applyOptions() {
    writeParametersFromOptions();
    startTimer();
}

function readOptionsFromParameters() {
    if (window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const crt = params.get("crt");
        options.time = parseTime(params.get("t"));
        options.message = decodeURIComponent(params.get("m") ?? "");
        options.flicker = !!crt && crt.indexOf("f") !== -1;
        options.shadow = !!crt && crt.indexOf("s") !== -1;
        options.hideForm = params.get("form") === "hidden";
    }
}

function writeParametersFromOptions() {
    const params = new URLSearchParams();
    if (options.time) {
        params.set("t", formatTime(options.time));
    }
    if (options.message?.length) {
        params.set("m", encodeURIComponent(options.message));
    }
    if (options.flicker && options.shadow) {
        params.set("crt", "fs");
    } else if (options.flicker) {
        params.set("crt", "f");
    } else if (options.shadow) {
        params.set("crt", "s");
    }
    if (options.hideForm) {
        params.set("form", "hidden");
    }
    window.location.search = params.toString();
}

function parseTime(string) {
    if (!string?.length) { return null }

    const match = string.match(/^(\d{2}):(\d{2})/);
    if (!match?.length) { return null }

    const [_, hh, mm] = match;
    const hours = parseInt(hh);
    const minutes = parseInt(mm);
    if (hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60) { return null }

    return makeTime(hours, minutes, 0);
}

function makeTime(hours, minutes, seconds) {
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(seconds);
    return date;
}

function formatTime(date) {
    const h = date.getHours();
    const m = date.getMinutes();
    const hh = h < 10 ? `0${h}` : h;
    const mm = m < 10 ? `0${m}` : m;
    return hh + ":" + mm;
}

function timeStep() {
    const now = new Date();
    if (now.getTime() >= options.time.getTime()) {
        let hhmmss = "\ue073\ue073 NOW \ue073\ue073";
        let message = options.message.toLocaleUpperCase();
        const length = Math.max(hhmmss.length, message.length);
        hhmmss = center(hhmmss, length);
        empty = center("", length);
        message = center(message, length);
        const content = `${message}\n${empty}\n${hhmmss}`;
        const borderedContent = border(pad(content), {
            top: "\ue0c3", left: "\ue0dd", right: "\ue0dd", bottom: "\ue0c3",
            topLeft: "\ue0d5", topRight: "\ue0c9", bottomLeft: "\ue0ca", bottomRight: "\ue0cb"
        });

        elements.timeAndMessage.innerHTML = `<pre class="c64">${borderedContent}</pre>`;
    } else {
        const seconds = Math.floor((options.time.getTime() - now.getTime()) / 1000);
        const s = seconds % 60;
        const ss = s < 10 ? `0${s}` : `${s}`;

        const minutes = Math.floor(seconds / 60);
        const m = minutes % 60;
        const mm = m < 10 ? `0${m}` : `${m}`;

        const h = Math.floor(minutes / 60);
        const hh = h < 10 ? `0${h}` : `${h}`;

        let hhmmss = `${hh}:${mm}:${ss}`;
        let message = options.message.toLocaleUpperCase();
        const length = Math.max(hhmmss.length, message.length);
        hhmmss = center(hhmmss, length);
        empty = center("", length);
        message = center(message, length);
        const content = `${message}\n${empty}\n${hhmmss}`;
        const borderedContent = border(pad(content), {
            top: "\ue0c3", left: "\ue0dd", right: "\ue0dd", bottom: "\ue0c3",
            topLeft: "\ue0d5", topRight: "\ue0c9", bottomLeft: "\ue0ca", bottomRight: "\ue0cb"
        });

        elements.timeAndMessage.innerHTML = `<pre class="c64">${borderedContent}</pre>`;
        
        options.timer = setTimeout(() => timeStep(), 1000);
    }
}

function center(string, length) {
    const halfLength = Math.floor((length - string.length) / 2);
    let paddedString = string;
    if (string.length < length) {
        for (let i = 0; i < halfLength; ++i) {
            paddedString = " " + paddedString;
        }
    }
    while (paddedString.length < length) {
        paddedString += " ";
    }
    return paddedString;
}

function border(string, border) {
    const { topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left } = border;
    const lines = string.split("\n");
    const borderedLines = [];

    let line = topLeft;
    for (let i = 0; i < lines[0].length; ++i) {
        line += top;
    }
    line += topRight;
    borderedLines.push(line);

    lines.forEach(line => {
        borderedLines.push(left + line + right);
    });

    line = bottomLeft;
    for (let i = 0; i < lines[0].length; ++i) {
        line += bottom;
    }
    line += bottomRight;
    borderedLines.push(line);

    return borderedLines.join("\n");
}

function pad(string) {
    return border(string, {
        top: " ", left: " ", right: " ", bottom: " ",
        topLeft: " ", topRight: " ", bottomLeft: " ", bottomRight: " "
    });
}

window.addEventListener("load", setup);