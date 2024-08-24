const DEFAULT_MAX_EMOTES = 20;

window.addEventListener("load", () => {
    const { debug, channelName, size, mode, modulateColors, maxEmotes, editOptions } = readOptionsFromParameters();

    if (!channelName?.length) {
        showForm({ debug, channelName, size, mode, modulateColors, maxEmotes, editOptions })
            .then(options => writeParametersFromOptions(options));
        return;
    } else if (editOptions) {
        showForm({ debug, channelName, size, mode, modulateColors, maxEmotes, editOptions })
            .then(options => writeParametersFromOptions(options));
    } else {
        showOptions({ debug, channelName, size, mode, modulateColors, maxEmotes, editOptions });
    }

    let setupEmote = simpleMovingEmotes;
    if (mode === 'bouncy') {
        setupEmote = bouncyMovingEmotes;
    }

    const emoteContext = {
        debug,
        channelName,
        maxEmotes,
        size,
        mode,
        modulateColors,
        count: {
            total: 0
        },
        setupEmote,
    };
    
    const client = new tmi.Client({
        options: {
            debug,
            skipUpdatingEmotesets: true,
            skipMembership: true,
        },
        channels: [channelName],
    });
    
    client.on("message", (channel, tags, message, self) => {
        if (!self && channel === `#${channelName}`) {
            
            const handleError = reason => {
                if (debug || reason !== 'too many') {
                    console.warn(reason);
                }
            };

            const urls = collectEmotes(tags);
            if (urls?.length) {
                const currentSize = (size !== undefined && size !== "dynamic")
                    ? size
                    : emoteSize(urls.length);
                
                urls.forEach(url => {
                    createEmote(url, emoteContext, currentSize)
                        .then(appendImage)
                        .then(removeImage)
                        .catch(handleError);
                });
            }
    
            const emojiPattern = /\p{Extended_Pictographic}/ug;
            const emojis = message.match(emojiPattern);
            if (emojis?.length) {
                const currentSize = (size !== undefined && size !== "dynamic")
                    ? size
                    : emoteSize(emojis.length);

                emojis.forEach(emoji => {
                    createEmoji(emoji, emoteContext, currentSize)
                        .then(appendImage)
                        .then(removeImage)
                        .catch(handleError);
                });
            }
        }
    });
    
    client.connect().catch(console.error);
});

function readOptionsFromParameters() {
    const options = {
        debug: false,
        maxEmotes: 0,
        size: "dynamic",
        mode: "default",
        modulateColors: true,
        channelName: "",
        editOptions: false,
    };

    if (window.location.search) {
        const params = new URLSearchParams(window.location.search);
        
        const c = params.get("c");
        if (c?.length) {
            options.channelName = c;
        }

        if (!!params.get("d")) {
            options.debug = true;
        }

        const s = params.get("s");
        if (s === "dynamic" || s === "large" || s === "medium" || s === "small") {
            options.size = s;
        }

        const m = params.get("m");
        if (m === "default" || m === "bouncy") {
            options.mode = m;
        }

        if (options.mode === "bouncy") {
            const value = params.get("modulate");
            options.modulateColors = value !== "0" && value !== 0 && value !== "false" && value !== false && value !== "off";
        }

        const max = params.get("max");
        if (!!max) {
            options.maxEmotes = parseInt(max);
        } else {
            options.maxEmotes = DEFAULT_MAX_EMOTES;
        }

        if (!!params.get("edit")) {
            options.editOptions = true;
        }
    } else {
        options.maxEmotes = DEFAULT_MAX_EMOTES;
    }

    return options;
}

function writeParametersFromOptions(options) {
    const params = new URLSearchParams();
    if (options.debug) {
        params.set("d", "1");
    }
    params.set("max", `${options.maxEmotes}`);
    if (options.channelName?.length) {
        params.set("c", options.channelName);
    }
    params.set("s", options.size ?? "dynamic");
    params.set("m", options.mode ?? "default");
    if (!options.modulateColors) {
        params.set("modulate", "0");
    }
    if (options.editOptions) {
        params.set("edit", "1");
    }
    window.location.search = params.toString();
}

async function showForm(options) {
    return new Promise(resolve => {
        const channelNameTextfield = document.querySelector('#channelName');
        channelNameTextfield.value = options.channelName;

        const debugCheckbox = document.querySelector('#debug');
        debugCheckbox.checked = options.debug;

        const maxEmotesTextfield = document.querySelector('#maxEmotes');
        maxEmotesTextfield.value = options.maxEmotes;

        const sizeCombobox = document.querySelector('#size');
        sizeCombobox.value = options.size;

        const modeCombobox = document.querySelector('#mode');
        modeCombobox.value = options.mode;

        const modeDescription = document.querySelector('#mode_description');
        modeDescription.innerHTML = describeMode(options.mode);
        modeCombobox.addEventListener('change', () => modeDescription.innerHTML = describeMode(modeCombobox.value));

        const modulateColorsCheckbox = document.querySelector('#modulateColors');
        modulateColorsCheckbox.checked = options.modulateColors;
        modulateColorsCheckbox.disabled = options.mode !== "bouncy";
        modeCombobox.addEventListener('change', () => modulateColorsCheckbox.disabled = modeCombobox.value !== "bouncy");

        const apply = document.querySelector('#apply');
        apply.addEventListener("click", () => {
            const channelName = channelNameTextfield.value;
            const debug = debugCheckbox.checked;
            const maxEmotes = parseInt(maxEmotesTextfield.value) ?? 0;
            const size = sizeCombobox.value;
            const mode = modeCombobox.value;
            const modulateColors = modulateColorsCheckbox.checked
            resolve({ channelName, debug, size, mode, modulateColors, maxEmotes });
        });
    });
}

function showOptions(options) {
    const channelName = document.createElement('div');
    channelName.innerHTML = `<code>channelName = ${options.channelName}</code>`;
    document.body.appendChild(channelName);

    const debug = document.createElement('div');
    debug.innerHTML = `<code>debug = ${options.debug ? "on" : "off"}</code>`;
    document.body.appendChild(debug);

    const maxEmotes = document.createElement('div');
    maxEmotes.innerHTML = `<code>maxEmotes = ${options.maxEmotes}</code>`;
    document.body.appendChild(maxEmotes);

    const size = document.createElement('div');
    size.innerHTML = `<code>size = ${options.size}</code>`;
    document.body.appendChild(size);

    const mode = document.createElement('div');
    mode.innerHTML = `<code>mode = ${options.mode}</code>`;
    document.body.appendChild(mode);

    const modulateColors = document.createElement('div');
    if (options.mode === "bouncy") {
        modulateColors.innerHTML = `<code>modulateColors = ${options.modulateColors ? "on" : "off"}</code>`;
    }
    document.body.appendChild(modulateColors);

    const escapeHint = document.createElement('div');
    escapeHint.innerHTML = `<code>Press ESC to edit options.</code>`;
    document.body.appendChild(escapeHint);

    const form = document.querySelector('form');
    document.body.removeChild(form);

    setTimeout(() => {
        document.body.removeChild(channelName);
        document.body.removeChild(debug);
        document.body.removeChild(maxEmotes);
        document.body.removeChild(size);
        document.body.removeChild(mode);
        document.body.removeChild(modulateColors)
        document.body.removeChild(escapeHint);
    }, 2000);

    document.body.onkeyup = event => {
        const { key } = event;
        
        if (key === "Escape") {
            writeParametersFromOptions({ ...options, editOptions: true });
        }
    };
}

function collectEmotes(tags) {
    const { emotes } = tags;
    const urls = [];

    if (emotes) {
        Object.keys(emotes).forEach(key => {
            const url = `https://static-cdn.jtvnw.net/emoticons/v2/${key}/default/dark/3.0`;
            emotes[key].forEach(emote => {
                urls.push(url);
            })
        });
    }

    return urls;
}

function emoteSize(n) {
    if (n > 5) {
        return 'small';
    } else if (n > 1) {
        return 'medium';
    } else {
        return 'large';
    }
}

function describeMode(mode) {
    if (mode === "bouncy") {
        return "Emotes move across the screen and bounce off the window edges like the classic DVD screensaver.";
    } else {
        return "Emotes move in a random direction at a random speed and disappear.";
    }
}

async function createEmoji(emoji, context, size) {
    const countByEmoji = context.count[emoji] ?? 0;
    if (context.maxEmotes > 0 && countByEmoji >= context.maxEmotes) {
        return Promise.reject('too many');
    }

    context.count.total += 1;
    context.count[emoji] = countByEmoji + 1;

    const time = {
        untilAppending: 0,
        untilRemoval: 0,
    };

    return new Promise(resolve => {
        const element = document.createElement('div');
        element.innerHTML = emoji;

        const emote = context.setupEmote({ element, context, emoji, time, size });
        resolve(emote);
    });
}

async function createEmote(url, context, size) {
    const countByURL = context.count[url] ?? 0;
    if (context.maxEmotes > 0 && countByURL >= context.maxEmotes) {
        return Promise.reject('too many');
    }

    context.count.total += 1;
    context.count[url] = countByURL + 1;

    const time = {
        untilAppending: 0,
        untilRemoval: 0,
    };

    return new Promise(resolve => {
        const element = document.createElement('div');
        element.innerHTML = `<img src="${url}">`;

        const emote = context.setupEmote({ element, context, url, time, size });
        resolve(emote);
    });
}

async function appendImage(emote) {
    const delay = emote.time.untilAppending;

    return new Promise(resolve => setTimeout(() => {
        document.body.appendChild(emote.element);
        resolve(emote);
    }, delay));
}

async function removeImage(emote) {
    const delay = emote.time.untilRemoval;

    return new Promise(resolve => setTimeout(() => {
        document.body.removeChild(emote.element);
        emote.context.count.total -= 1;
        if (emote.url?.length) {
            emote.context.count[emote.url] -= 1;
        } else if (emote.emoji?.length) {
            emote.context.count[emote.emoji] -= 1;
        }
        resolve(emote);
    }, delay));
}

function simpleMovingEmotes(emote) {

    const randomPercentage = (minDelta) => {
        const a = Math.random() * 100;
        const b = Math.random() * 100;
        const delta = Math.abs(a - b);
        if (minDelta < delta) {
            return [a, b];
        } else {
            const d = (minDelta - delta) / 2;
            if (a < b) {
                return [a - d, b + d];
            } else {
                return [a + d, b - d];
            }
        }
    };

    emote.time.untilAppending = Math.random() * 5000; // append after random delay up to 5s
    emote.time.untilRemoval = 10000;                  // remove after 10s

    const [topStart, topEnd] = randomPercentage(20);
    const [leftStart, leftEnd] = randomPercentage(15);

    if (emote.url?.length) {
        emote.element.classList.add('emote');
    } else if (emote.emoji?.length) {
        emote.element.classList.add('emoji');
    }
    emote.element.classList.add(emote.size);
    emote.element.style.top = `${topStart}%`;
    emote.element.style.left = `${leftStart}%`;
    emote.element.style.opacity = 0;

    // Start moving them after 200ms, which takes 10s.
    setTimeout(() => {
        emote.element.style.top = `${topEnd}%`;
        emote.element.style.left = `${leftEnd}%`;
        emote.element.style.opacity = 1;
    }, emote.time.untilAppending + 200);

    // Start fading them out after 8s, which takes 2s.
    setTimeout(() => {
        emote.element.style.opacity = 0;
    }, emote.time.untilAppending + emote.time.untilRemoval - 2000);
    
    return emote;
}

function bouncyMovingEmotes(emote) {
    emote.time.untilAppending = Math.random() * 5000; // append after random delay up to 5s
    emote.time.untilRemoval = 15000;                  // remove after 15s

    const w = window?.innerWidth ?? document?.documentElement?.clientWidth ?? document?.body?.clientWidth ?? 1;
    const h = window?.innerHeight ?? document?.documentElement?.clientHeight ?? document?.body?.clientHeight ?? 1;
    const fps = 60;
    const speed = (w / fps) * 0.2; // 5s to cross the canvas width
    const color_modulate_steps = 8;

    if (emote.url?.length) {
        emote.element.classList.add('emote');
    } else {
        emote.element.classList.add('emoji');
    }
    emote.element.classList.add(emote.size);
    emote.element.classList.add('fps');

    const x = Math.random() * w * 0.5 + w * 0.25;
    const y = Math.random() * h * 0.5 + h * 0.25;

    emote.element.style.left = `${x}px`;
    emote.element.style.top = `${y}px`;
    emote.element.style.opacity = 0;
    emote.velocity = {
        x: Math.random() < 0.5 ? -speed : speed,
        y: Math.random() < 0.5 ? -speed : speed,
    };
    emote.flipped = {
        x: false,
        y: false,
    };
    emote.colorModulate = 0;
    emote.visible = false;

    // Start fading them in after 200ms, which takes 2s.
    setTimeout(() => {
        emote.element.style.opacity = 1;
        emote.visible = true;
    }, emote.time.untilAppending + 200);

    const updatePosition = setInterval(() => {
        if (!emote.visible) {
            return;
        }

        const rect = emote.element.getBoundingClientRect();
        if ((rect.x + rect.width) >= w) {
            emote.velocity.x = -emote.velocity.x;
            emote.flipped.x = !emote.flipped.x;
            if (emote.context.modulateColors) {
                emote.colorModulate = (emote.colorModulate + 1) % color_modulate_steps;
            }
        } else if (rect.x <= 0) {
            emote.velocity.x = -emote.velocity.x;
            emote.flipped.x = !emote.flipped.x;
            if (emote.context.modulateColors) {
                emote.colorModulate = (emote.colorModulate + 1) % color_modulate_steps;
            }
        }
        if ((rect.y + rect.height) >= h) {
            emote.velocity.y = -emote.velocity.y;
            emote.flipped.y = !emote.flipped.y;
            if (emote.context.modulateColors) {
                emote.colorModulate = (emote.colorModulate + 1) % color_modulate_steps;
            }
        } else if (rect.y <= 0) {
            emote.velocity.y = -emote.velocity.y;
            emote.flipped.y = !emote.flipped.y;
            if (emote.context.modulateColors) {
                emote.colorModulate = (emote.colorModulate + 1) % color_modulate_steps;
            }
        }

        const x = rect.x + emote.velocity.x;
        const y = rect.y + emote.velocity.y;
        const tx = emote.flipped.x ? `rotateY(180deg)` : `rotateY(0)`;
        const ty = emote.flipped.y ? `rotateX(180deg)` : `rotateX(0)`;
        const c = 360 * emote.colorModulate / color_modulate_steps;

        emote.element.style.left = `${x}px`;
        emote.element.style.top = `${y}px`;
        emote.element.style.transform = tx + ' ' + ty;
        emote.element.style.filter = `hue-rotate(${c}deg)`;
    }, 1000 / fps);

    // Start fading them out after 8s, which takes 2s.
    setTimeout(() => {
        emote.element.style.opacity = 0;
        clearInterval(updatePosition);
    }, emote.time.untilAppending + emote.time.untilRemoval - 2000);

    return emote;
}