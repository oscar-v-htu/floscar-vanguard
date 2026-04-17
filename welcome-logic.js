const textElement = document.getElementById('typing-text');
const feedbackElement = document.getElementById('action-feedback');
const redirectCountElement = document.getElementById('redirect-count');

const phrases = [
    'Preparing a cleaner entry sequence...',
    'Loading projects, ideas, and site pathways...',
    'Opening the main Floscar Vanguard experience...',
    'Vanguard welcome page ready.'
];

const HOME_TARGET = 'home.html';
const REDIRECT_SECONDS = 15;
const isLocalPreview = window.location.protocol === 'file:';

let phraseIndex = 0;
let charIndex = 0;
let activeTimeoutId;
let redirectIntervalId;
let redirectTimeoutId;

function schedule(callback, delay) {
    activeTimeoutId = window.setTimeout(callback, delay);
}

function type() {
    if (!textElement) {
        return;
    }

    if (charIndex < phrases[phraseIndex].length) {
        textElement.textContent += phrases[phraseIndex].charAt(charIndex);
        charIndex += 1;
        schedule(type, 65);
        return;
    }

    schedule(erase, 1800);
}

function erase() {
    if (!textElement) {
        return;
    }

    if (charIndex > 0) {
        textElement.textContent = phrases[phraseIndex].substring(0, charIndex - 1);
        charIndex -= 1;
        schedule(erase, 28);
        return;
    }

    phraseIndex = (phraseIndex + 1) % phrases.length;
    schedule(type, 450);
}

function startRedirectCountdown() {
    if (!redirectCountElement || !feedbackElement) {
        return;
    }

    if (isLocalPreview) {
        feedbackElement.textContent = 'Local preview mode. Live entry remains wired to home.html.';
        return;
    }

    let secondsRemaining = REDIRECT_SECONDS;
    feedbackElement.innerHTML = `Auto-entering the main site in <span id="redirect-count">${secondsRemaining}</span>s.`;

    redirectIntervalId = window.setInterval(() => {
        secondsRemaining = Math.max(secondsRemaining - 1, 0);

        const liveCountElement = document.getElementById('redirect-count');
        if (liveCountElement) {
            liveCountElement.textContent = String(secondsRemaining);
        }

        if (secondsRemaining === 0) {
            window.clearInterval(redirectIntervalId);
            feedbackElement.textContent = 'Entering the main site...';
        }
    }, 1000);

    redirectTimeoutId = window.setTimeout(() => {
        window.location.href = HOME_TARGET;
    }, REDIRECT_SECONDS * 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('is-ready');
    type();
    startRedirectCountdown();
});

window.addEventListener('beforeunload', () => {
    window.clearTimeout(activeTimeoutId);
    window.clearInterval(redirectIntervalId);
    window.clearTimeout(redirectTimeoutId);
});