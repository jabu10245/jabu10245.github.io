const ENABLED = false;
const COTM_USERNAME = "Jabu10245".toLowerCase();
const MPOTM_USERNAME = "Major_Postal".toLowerCase();
const BOTM_USERNAME = "benez256".toLowerCase();
const IBTCOTM_USERNAME = "EchoAlpha_x5".toLowerCase();
const MONTH = "2024-11";
const COTM_FILENAME = `cotm-${MONTH}`;
const MPOTM_FILENAME = `mpotm-${MONTH}`;
const BOTM_FILENAME = `botm-${MONTH}`;
const IBTCOTM_FILENAME = `ibtcotm-${MONTH}`;
const DURATION = 20_000; // milliseconds
const CLIENT_ID = "a3o2mhosy9osxod70iwb4awr9uw95y";
const OAUTH_STATE = "auto-award-oauth-state";
const CHANNEL_NAME = "benez256";

const soundCommands = [
    {
        usernames: ['jabu10245'],
        sounds: ['*'],
    },
    {
        usernames: ['kayos_theory', 'heart_of_mithril', 'benez256'],
        sounds: ['yippee'],
    },
    {
        usernames: ['nottheps1addict'],
        sounds: ['namispep'],
    },
    {
        usernames: ['theps1addict'],
        sounds: ['thepsone'],
    }
];

function setup() {
    removeAuthenticateButton();

    const params = new URLSearchParams(document.location.search);
    const hash = !!document.location.hash?.length ? new URLSearchParams(document.location.hash.substring(1)) : new URLSearchParams();

    if (params.has('test')) {
        const testDuration = 5_000; // milliseconds
        showAward(`${COTM_FILENAME}?nofooter`, testDuration);
        setInterval(() => showAward(`${COTM_FILENAME}?nofooter`, testDuration), testDuration * 2);
    }
    
    else if (params.has('token')) {
        connect(params.get('token'))
            .then(() => console.log(`Connected to chat and waiting for a message from ${COTM_USERNAME} or ${BOTM_USERNAME}.`))
            .catch(() => createAuthenticateButton("Error connecting to Twitch"));
    }
    
    else if (hash.has('access_token')) { // Twitch calling back after authorization
        const token = validateAuthorizationResults();
        if (token === null) {
            createAuthenticateButton("Failed to connect to Twitch");
        } else {
            let [url] = document.location.href.split('#');
            document.location.href = `${url}?token=${token}`;
        }
    }
    
    else {
        createAuthenticateButton("Not connected to Twitch");
    }
}

async function after(milliseconds, command) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const result = command();
            resolve(result);
        }, milliseconds);
    });
}

function showAward(filename, duration) {
    if (!ENABLED) {
        return;
    }
    
    const iframe = document.createElement("iframe");
    iframe.setAttribute("src", filename);
    iframe.classList.add("award");

    const install = () => document.body.append(iframe);
    const uninstall = () => iframe.remove();
    const show = () => iframe.classList.add("shown");
    const hide = () => iframe.classList.remove("shown");

    const run = async () => {
        install();
        await after(1, show);
        await after(duration, hide);
        await after(1000, uninstall);
    };

    run().then(_ => {}).catch(console.error);
}

function fart() {
    anySound('fart');
}

function anySound(name) {
    const audioPlayer = document.getElementById('audio');
    audioPlayer.src = './' + name + '.mp3';
    audioPlayer.play().then(() => console.log('playing sfx ' + name)).catch(console.error);
}

function didUserMessage(name) {
    const item = sessionStorage.getItem('messaged_names');
    const names = (item ?? '').split('::');
    return names.includes(name);
}

function userMessaged(name) {
    const item = sessionStorage.getItem('messaged_names');
    const names = (item ?? '').split('::');
    sessionStorage.setItem('messaged_names', [...names, name].join('::'));
}

function requestAuthentication() {
    const scope = ["chat:read"];

    const uri = document.location.hostname.includes('github')
        ? "https://jabu10245.github.io/awards/auto-award.html"
        : "http://localhost:8080/docs/awards/auto-award.html";

    const params = new URLSearchParams();
    params.append("response_type", "token");
    params.append("client_id", CLIENT_ID);
    params.append("redirect_uri", uri);
    params.append("scope", scope.join(" "));
    params.append("state", OAUTH_STATE);
    params.append("force_verify", "true");

    document.location.href = `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
}

function createAuthenticateButton(message) {
    const messageBlock = document.createElement("div");
    messageBlock.innerHTML = message;

    const button = document.createElement("button");
    button.setAttribute("type", "button");
    button.innerHTML = "Connect";
    button.addEventListener("click", requestAuthentication);

    const container = document.createElement("div");
    container.setAttribute("id", "authenticate-button-container");
    container.appendChild(messageBlock);
    container.appendChild(button);
    document.body.appendChild(container);
}

function removeAuthenticateButton() {
    const container = document.getElementById("authenticate-button-container");
    if (container) {
        container.remove();
    }
}

function validateAuthorizationResults() {
    const params = new URLSearchParams(document.location.hash.substring(1));
    const token = params.get("access_token");
    const state = params.get("state");

    if (!token?.length || state !== OAUTH_STATE) {
        return null;
    } else {
        return token;
    }
}

async function validateToken(token) {
    const url = "https://id.twitch.tv/oauth2/validate";

    const response = await fetch(url, {
        headers: {
            "Authorization": `OAuth ${token}`,
        },
    });

    if (response.status === 200) {
        const context = await response.json(); // { login, client_id, user_id, scopes, expires_in }
        console.log("OAuth token validated.");
        return context;
    }

    if (response.status === 401) {
        const text = await response.text();
        throw new Error(`OAuth token not validated. ${text}`);
    }

    throw new Error(`Unexpected HTTP status ${response.status}`);
}

function createClient(login, token) {
    const username = login;
    const password = `oauth:${token}`;

    return new tmi.Client({
        options: {
            debug: false,
            skipUpdatingEmotesets: true,
        },
        identity: { username, password },
        channels: [CHANNEL_NAME],
    });
}

function allowSoundCommand(username, message) {
    if (!username?.length || !message?.length) {
        return null;
    }

    const words = message.split(' ');
    if (words.length < 1) {
        return null;
    }

    const firstWord = words[0];
    if (!firstWord.startsWith('!!')) {
        return null;
    }

    const command = firstWord.substring(2);

    if (['behindyou', 'beware', 'jumpscare', 'zombie'].includes(command.toLowerCase())) {
        const spooktober = new Date().getMonth() === 9;
        if (spooktober) {
            return command;
        }
    }

    const sound = soundCommands.find(({usernames, sounds}) => {
        const matchesUser = usernames.includes(username.toLowerCase());
        const matchesSound = sounds.includes(command.toLowerCase()) || sounds.includes('*');
        return matchesUser && matchesSound;
    });

    if (sound === undefined) {
        return null;
    }

    return command;
}

async function connect(token) {
    const { login } = await validateToken(token);
    const client = createClient(login, token);
    await client.connect();

    client.on('message', (channel, user, message, self) => {
        if (!self) {
            const username = (user?.username ?? '').toLowerCase();
            const broadcaster = username === CHANNEL_NAME;
            const moderator = !!user?.mod;

            if (message === '!cotm' && (broadcaster || moderator)) {
                showAward(`${COTM_FILENAME}?nofooter`, DURATION);
            } else if (message === '!mpotm' && (broadcaster || moderator)) {
                showAward(`${MPOTM_FILENAME}?nofooter`, DURATION);
            } else if (message === '!botm' && (broadcaster || moderator)) {
                showAward(`${BOTM_FILENAME}?nofooter`, DURATION);
            } else if (message === '!ibtcotm' && (broadcaster || moderator)) {
                showAward(`${IBTCOTM_FILENAME}?nofooter`, DURATION);
            }

            else if (username === COTM_USERNAME && !didUserMessage(username)) {
                showAward(`${COTM_FILENAME}?nofooter`, DURATION);
                userMessaged(username);
            }

            else if (username === BOTM_USERNAME && !didUserMessage(username)) {
                showAward(`${BOTM_FILENAME}?nofooter`, DURATION);
                userMessaged(username);
            }

            else if (username === 'jabu10245' && message === '!fart') {
                setTimeout(fart, 2000);
            }

            else {
                const sound = allowSoundCommand(username, message);
                if (sound !== null) {
                    anySound(sound);
                }
            }
        }
    });
}

window.addEventListener("load", setup);