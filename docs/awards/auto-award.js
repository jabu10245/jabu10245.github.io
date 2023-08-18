const USERNAME = "heart_of_mithril";
const FILENAME = "cotm-2023-07";
const DURATION = 20_000; // milliseconds
const CLIENT_ID = "a3o2mhosy9osxod70iwb4awr9uw95y";
const OAUTH_STATE = "auto-award-oauth-state";
const CHANNEL_NAME = "benez256";

function setup() {
    removeAuthenticateButton();

    const params = new URLSearchParams(document.location.search);
    const hash = !!document.location.hash?.length ? new URLSearchParams(document.location.hash.substring(1)) : new URLSearchParams();

    if (params.has('test')) {
        const testDuration = 5_000; // milliseconds
        showAward(`${FILENAME}?nofooter`, testDuration);
        setInterval(() => showAward(`${FILENAME}?nofooter`, testDuration), testDuration * 2);
    }
    
    else if (params.has('token')) {
        connect(params.get('token'))
            .then(() => console.log(`Connected to chat and waiting for a message from ${USERNAME}.`))
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

function didUserMessage() {
    return sessionStorage.getItem('messaged') === 'true';
}

function userMessaged() {
    sessionStorage.setItem('messaged', 'true');
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
                showAward(`${FILENAME}?nofooter`, DURATION);
            }

            else if (username === USERNAME && !didUserMessage()) {
                showAward(`${FILENAME}?nofooter`, DURATION);
                userMessaged();
            }
        }
    });
}

window.addEventListener("load", setup);