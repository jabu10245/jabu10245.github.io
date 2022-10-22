const options = {
    channelName: "",
    iconCount: 3,
    defaultEmote: "",
    debug: false,
    hideForm: true,
};

const elements = {
    form: null,
    channelNameTextfield: null,
    iconCountTextfield: null,
    defaultEmoteTextfield: null,
    debugCheckbox: null,
    applyButton: null,
    formReplacement: null,
    emoteContainer: null,
};

const runtime = {
    client: null,
};

function updateChannelName(name) {
    options.channelName = name;
    elements.channelNameTextfield.value = name;
}

function updateIconCount(count) {
    options.iconCount = count;
    elements.iconCountTextfield.value = `${count}`;
}

function updateDefaultEmote(id) {
    options.defaultEmote = id;
    elements.defaultEmoteTextfield.value = id;
}

function updateDebug(debug) {
    options.debug = !!debug;
    elements.debugCheckbox.checked = debug;
}

function updateHideForm(hide) {
    options.hideForm = hide;
}

function applyOptions() {
    writeOptionsToParameters();
}

function startApplication() {
    const { channelName, iconCount, defaultEmote, debug } = options;

    if (debug) {
        console.table(options);
    }

    let emotes = [];
    if (!!defaultEmote?.length) {
        emotes.push(defaultEmote);
        showEmotes(emotes);
    }

    const client = new tmi.Client({
        options: {
            debug,
            skinUpdatingemotesets: true,
            skipMembership: true,
        },
        channels: [channelName],
    });

    client.on("message", (channel, tags, message, self) => {
        if (!self && channel === `#${options.channelName}`) {
            collectEmotes(tags).forEach(emote => {
                const index = emotes.indexOf(emote);
                if (index !== -1) {
                    emotes.splice(index, 1);
                }
                emotes.push(emote);
                if (debug) {
                    console.log(emote);
                }
            });

            if (emotes.length > iconCount) {
                emotes = emotes.slice(emotes.length - iconCount);
            }

            showEmotes(emotes);
        }
    });

    client.connect().catch(console.error);

    runtime.client = client;
}

function readOptionsFromParameters() {
    if (window.location.search) {
        const params = new URLSearchParams(window.location.search);
        updateChannelName(params.get("c") ?? "");
        updateIconCount(parseInt(params.get("i")) ?? 3);
        updateDefaultEmote(params.get("d") ?? "");
        updateDebug(params.has("debug"));
    }
}

function writeOptionsToParameters() {
    const params = new URLSearchParams();
    if (!!options.channelName?.length) {
        params.set("c", options.channelName);
    }
    if (!!options.iconCount) {
        params.set("i", `${options.iconCount}`);
    }
    if (!!options.defaultEmote?.length) {
        params.set("d", options.defaultEmote);
    }
    if (!!options.debug) {
        params.set("debug", "");
    }

    window.location.search = params.toString();
}

window.addEventListener("load", () => {
    elements.form = document.querySelector("form");
    elements.channelNameTextfield = elements.form.querySelector("#channelName");
    elements.iconCountTextfield = elements.form.querySelector("#iconCount");
    elements.defaultEmoteTextfield = elements.form.querySelector("#defaultEmote");
    elements.debugCheckbox = elements.form.querySelector("#debug");
    elements.applyButton = elements.form.querySelector("#apply");
    elements.formReplacement = document.querySelector("#form-replacement");
    elements.emoteContainer = document.querySelector("#emote-container");

    elements.applyButton.addEventListener("click", (event) => {
        event.stopPropagation();
        applyOptions();
    });

    elements.form.addEventListener("submit", (event) => {
        event.stopPropagation();
        event.preventDefault();
        applyOptions();
    });

    elements.channelNameTextfield.addEventListener("change", (event) => {
        const name = event.target.value ?? "";
        event.stopPropagation();
        updateChannelName(name);
    });

    elements.iconCountTextfield.addEventListener("change", (event) => {
        const count = parseInt(event.target.value);
        if (count && !isNaN(count)) {
            event.stopPropagation();
            updateIconCount(count);
        }
    });

    elements.defaultEmoteTextfield.addEventListener("change", (event) => {
        const id = event.target.value ?? "";
        event.stopPropagation();
        updateDefaultEmote(id);
    });

    elements.debugCheckbox.addEventListener("click", (event) => {
        const debug = event.target.checked;
        event.stopPropagation();
        updateDebug(debug);
    });

    document.body.addEventListener("keyup", event => {
        const { key, target } = event;

        if (key === "Escape") {
            updateHideForm(false);
            elements.form.classList.remove("hidden");
            elements.formReplacement.classList.add("hidden");
            elements.emoteContainer.classList.add("hidden");
            runtime.client?.disconnect();
            runtime.client = null;
        }
    });

    readOptionsFromParameters();

    const appValid = options.channelName.length > 0 && options.iconCount > 0;

    if (options.hideForm && appValid) {
        elements.form.classList.add("hidden");
        if (!options.defaultEmote?.length) {
            elements.formReplacement.classList.remove("hidden");
        }
        elements.emoteContainer.classList.remove("hidden");
        setTimeout(() => elements.formReplacement.classList.add("hidden"), 2000);
    }
    
    if (appValid) {
        startApplication();
    }
});

function collectEmotes(tags) {
    const { emotes } = tags;
    const urls = new Set();

    if (emotes) {
        Object.keys(emotes).forEach(key => {
            const url = `https://static-cdn.jtvnw.net/emoticons/v2/${key}/default/dark/3.0`;
            urls.add(url);
        });
    }

    return Array.from(urls);
}

function showEmotes(urls) {
    elements.emoteContainer.innerHTML = "";
    if (options.hideForm) {
        urls.forEach(url => {
            const emote = document.createElement("div");
            emote.classList.add("emote");
            emote.innerHTML = `<img src="${url}">`;
            elements.emoteContainer.appendChild(emote);
        });
    }
}