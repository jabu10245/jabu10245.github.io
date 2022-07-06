window.addEventListener("load", () => {
    const { debug, channelName, maxEmotes } = readOptionsFromParameters();

    if (!channelName?.length) {
        console.warn('No channel name given!');
        return;
    }

    const emoteContext = {
        debug,
        channelName,
        maxEmotes,
        count: {
            total: 0
        },
        setupEmote: simpleMovingEmotes,
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
                const size = emoteSize(urls.length);
                urls.forEach(url => {
                    createEmote(url, emoteContext, size)
                        .then(appendImage)
                        .then(removeImage)
                        .catch(handleError);
                });
            }
    
            const emojiPattern = /\p{Extended_Pictographic}/ug;
            const emojis = message.match(emojiPattern);
            if (emojis?.length) {
                const size = emoteSize(emojis.length);
                emojis.forEach(emoji => {
                    createEmoji(emoji, emoteContext, size)
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
        maxEmotes: 20,
        channelName: "",
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

        const max = params.get("max");
        if (!!max) {
            options.maxEmotes = parseInt(max);
        }
    }

    return options;
}

function writeParametersFromOptions(options) {
    const params = new URLSearchParams();
    if (options.debug) {
        params.set("d", "1");
    }
    if (options.maxEmotes) {
        params.set("max", `${options.maxEmotes}`);
    }
    if (options.channelName?.length) {
        params.set("c", options.channelName);
    }
    window.location.search = params.toString();
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
    emote.time.untilAppending = Math.random() * 5000; // append after random delay up to 5s
    emote.time.untilRemoval = 10000;                  // remove after 10s

    if (emote.url?.length) {
        emote.element.classList.add('emote');
    } else if (emote.emoji?.length) {
        emote.element.classList.add('emoji');
    }
    emote.element.classList.add(emote.size);
    emote.element.style.top = `${Math.random() * 99}%`;
    emote.element.style.left = `${Math.random() * 99}%`;
    emote.element.style.opacity = 0;

    // Start moving them after 200ms, which takes 10s.
    setTimeout(() => {
        emote.element.style.top = `${Math.random() * 99}%`;
        emote.element.style.left = `${Math.random() * 99}%`;
        emote.element.style.opacity = 1;
    }, emote.time.untilAppending + 200);

    // Start fading them out after 8s, which takes 2s.
    setTimeout(() => {
        emote.element.style.opacity = 0;
    }, emote.time.untilAppending + emote.time.untilRemoval - 2000);
    
    return emote;
}