const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const ENV_FILE = path.join(ROOT, '.env');

loadEnvFile();

const HOST = process.env.HOST || '0.0.0.0';
const PORT = readNumberEnv('PORT', 3000);
const DATA_DIR = path.resolve(ROOT, process.env.DATA_DIR || 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const PASSWORD_PEPPER = process.env.PASSWORD_PEPPER || '';
const SESSION_TTL_MS = readNumberEnv('SESSION_TTL_MS', 24 * 60 * 60 * 1000);
const COOKIE_SECURE = readBooleanEnv('COOKIE_SECURE', false);

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
};

const TOOL_CATALOG = {
    'Jan': {
        name: 'Jan',
        version: 'Current public desktop release',
        description: 'Open-source local AI app for chatting with models on your own machine and managing practical assistant workflows.',
        payload: {
            category: 'Local AI Apps',
            officialUrl: 'https://jan.ai/',
            installSurface: 'Desktop app',
            interactionModel: 'Local assistant desktop',
            strengths: ['local-first chat', 'assistant management', 'personal workflow control']
        }
    },
    'LM Studio': {
        name: 'LM Studio',
        version: 'Current public desktop release',
        description: 'Local model workstation for downloading, serving, and testing open models with a serious desktop workflow.',
        payload: {
            category: 'Local AI Apps',
            officialUrl: 'https://lmstudio.ai/',
            installSurface: 'Desktop runtime',
            interactionModel: 'Local model lab',
            strengths: ['model downloads', 'local serving', 'inference testing']
        }
    },
    'Open WebUI': {
        name: 'Open WebUI',
        version: 'Current public self-hosted release',
        description: 'Self-hosted AI interaction surface for local and remote models with document, admin, and multi-user workflows.',
        payload: {
            category: 'Workspace Consoles',
            officialUrl: 'https://openwebui.com/',
            installSurface: 'Self-hosted web console',
            interactionModel: 'Self-hosted UI layer',
            strengths: ['browser workspace', 'admin controls', 'multi-model access']
        }
    },
    'AnythingLLM': {
        name: 'AnythingLLM',
        version: 'Current public workspace release',
        description: 'Workspace-oriented local AI layer for retrieval, documents, agent tasks, and persistent knowledge contexts.',
        payload: {
            category: 'Workspace Consoles',
            officialUrl: 'https://anythingllm.com/',
            installSurface: 'Desktop and self-hosted workspace',
            interactionModel: 'RAG workspace',
            strengths: ['document grounding', 'persistent context', 'agent-style workflows']
        }
    },
    'Ollama': {
        name: 'Ollama',
        version: 'Current public runtime release',
        description: 'The dominant local runtime for pulling, serving, and scripting open models from a command line or app stack.',
        payload: {
            category: 'Developer Stack',
            officialUrl: 'https://ollama.com/',
            installSurface: 'CLI runtime',
            interactionModel: 'Runtime backbone',
            strengths: ['local model serving', 'CLI workflows', 'programmable APIs']
        }
    },
    'Continue': {
        name: 'Continue',
        version: 'Current public extension release',
        description: 'IDE-native AI coding layer for autocomplete, chat, edits, and codebase interaction across local or hosted models.',
        payload: {
            category: 'Developer Stack',
            officialUrl: 'https://www.continue.dev/',
            installSurface: 'IDE extension',
            interactionModel: 'Editor-side agent',
            strengths: ['autocomplete', 'chat and edits', 'codebase-aware assistance']
        }
    }
};

const ALLOWED_PHOTO_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);
const MAX_PROFILE_NAME_LENGTH = 80;
const MAX_PROFILE_MESSAGE_LENGTH = 500;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const MAX_REFLECTION_HISTORY = 12;
const MAX_TOOL_HISTORY = 12;
const MAX_TREND_HISTORY = 12;
const MAX_ARTICLE_HISTORY = 18;
const PSYCHOMETRIC_TYPES = new Set(['Analytical', 'Creative', 'Strategic', 'Empathic']);
const PSYCHOMETRIC_ANSWER_VALUES = new Set(['analytical', 'creative', 'strategic', 'empathic']);
const RATE_LIMIT_CONFIG = {
    login: {
        windowMs: readNumberEnv('LOGIN_WINDOW_MS', 60 * 1000),
        maxAttempts: readNumberEnv('LOGIN_MAX_ATTEMPTS', 10),
        blockMs: readNumberEnv('LOGIN_BLOCK_MS', 5 * 60 * 1000)
    },
    register: {
        windowMs: readNumberEnv('REGISTER_WINDOW_MS', 60 * 1000),
        maxAttempts: readNumberEnv('REGISTER_MAX_ATTEMPTS', 5),
        blockMs: readNumberEnv('REGISTER_BLOCK_MS', 10 * 60 * 1000)
    },
    download: {
        windowMs: readNumberEnv('DOWNLOAD_WINDOW_MS', 60 * 1000),
        maxAttempts: readNumberEnv('DOWNLOAD_MAX_ATTEMPTS', 30),
        blockMs: readNumberEnv('DOWNLOAD_BLOCK_MS', 5 * 60 * 1000)
    }
};

const rateLimitRecords = new Map();

ensureStorage();

function loadEnvFile() {
    if (!fs.existsSync(ENV_FILE)) {
        return;
    }

    const envLines = fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/);
    for (const line of envLines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) {
            continue;
        }

        const separatorIndex = trimmedLine.indexOf('=');
        if (separatorIndex === -1) {
            continue;
        }

        const key = trimmedLine.slice(0, separatorIndex).trim();
        if (!key || process.env[key] !== undefined) {
            continue;
        }

        let value = trimmedLine.slice(separatorIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        process.env[key] = value;
    }
}

function readNumberEnv(name, fallback) {
    const rawValue = process.env[name];
    if (rawValue === undefined || rawValue === '') {
        return fallback;
    }

    const parsedValue = Number.parseInt(rawValue, 10);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function readBooleanEnv(name, fallback) {
    const rawValue = process.env[name];
    if (rawValue === undefined || rawValue === '') {
        return fallback;
    }

    return ['1', 'true', 'yes', 'on'].includes(String(rawValue).trim().toLowerCase());
}

function ensureStorage() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, '[]', 'utf8');
    }
    if (!fs.existsSync(SESSIONS_FILE)) {
        fs.writeFileSync(SESSIONS_FILE, '{}', 'utf8');
    }
}

function readSessions() {
    try {
        const file = fs.readFileSync(SESSIONS_FILE, 'utf8');
        const sessions = JSON.parse(file || '{}');
        if (!sessions || typeof sessions !== 'object' || Array.isArray(sessions)) {
            return {};
        }
        return sessions;
    } catch {
        return {};
    }
}

function writeSessions(sessions) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf8');
}

function purgeExpiredSessions(sessions) {
    let didChange = false;
    const now = Date.now();

    for (const [sessionId, session] of Object.entries(sessions)) {
        if (!session || session.expiresAt < now) {
            delete sessions[sessionId];
            didChange = true;
        }
    }

    return didChange;
}

function readUsers() {
    try {
        const file = fs.readFileSync(USERS_FILE, 'utf8');
        const users = JSON.parse(file || '[]');
        let didMigrateLegacyPasswords = false;

        const normalizedUsers = users.map(user => {
            if (typeof user.password === 'string' && user.password && !user.passwordHash) {
                const { salt, passwordHash } = hashPassword(user.password);
                const { password, ...userWithoutPassword } = user;
                didMigrateLegacyPasswords = true;
                return {
                    ...userWithoutPassword,
                    salt,
                    passwordHash
                };
            }
            return user;
        }).map(user => {
            if (Object.prototype.hasOwnProperty.call(user, 'password')) {
                const { password, ...safeUser } = user;
                return safeUser;
            }
            return user;
        });

        if (didMigrateLegacyPasswords) {
            writeUsers(normalizedUsers);
        }

        return normalizedUsers;
    } catch {
        return [];
    }
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function sendJson(res, statusCode, payload, headers = {}) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        ...headers
    });
    res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, payload) {
    res.writeHead(statusCode, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store'
    });
    res.end(payload);
}

function parseCookies(req) {
    const cookieHeader = req.headers.cookie || '';
    return cookieHeader.split(';').reduce((cookies, pair) => {
        const [rawKey, ...rawValue] = pair.trim().split('=');
        if (!rawKey) return cookies;
        cookies[rawKey] = decodeURIComponent(rawValue.join('='));
        return cookies;
    }, {});
}

function getSession(req) {
    const cookies = parseCookies(req);
    const sessionId = cookies.sessionId;
    if (!sessionId) return null;
    const sessions = readSessions();
    const didPurgeExpiredSessions = purgeExpiredSessions(sessions);
    const session = sessions[sessionId];

    if (!session) {
        if (didPurgeExpiredSessions) {
            writeSessions(sessions);
        }
        return null;
    }

    if (didPurgeExpiredSessions) {
        writeSessions(sessions);
    }

    return { id: sessionId, ...session };
}

function createSession(email) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessions = readSessions();
    const session = {
        email,
        csrfToken: crypto.randomBytes(32).toString('hex'),
        expiresAt: Date.now() + SESSION_TTL_MS
    };

    sessions[sessionId] = session;
    writeSessions(sessions);

    return { sessionId, session };
}

function destroySession(req) {
    const session = getSession(req);
    if (session) {
        const sessions = readSessions();
        delete sessions[session.id];
        writeSessions(sessions);
    }
}

function setSessionCookie(res, sessionId) {
    const maxAge = Math.max(1, Math.floor(SESSION_TTL_MS / 1000));
    const parts = [
        `sessionId=${sessionId}`,
        'HttpOnly',
        'Path=/',
        'SameSite=Strict',
        `Max-Age=${maxAge}`
    ];
    if (COOKIE_SECURE) {
        parts.push('Secure');
    }
    res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
    const parts = ['sessionId=', 'HttpOnly', 'Path=/', 'SameSite=Strict', 'Max-Age=0'];
    if (COOKIE_SECURE) {
        parts.push('Secure');
    }
    res.setHeader('Set-Cookie', parts.join('; '));
}

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
        return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || 'unknown';
}

function getRateLimitKey(req, bucket, discriminator = '') {
    return `${bucket}:${getClientIp(req)}:${discriminator || 'global'}`;
}

function pruneRateLimitRecord(record, config, now = Date.now()) {
    record.attempts = record.attempts.filter(timestamp => now - timestamp <= config.windowMs);
    if (record.blockUntil && record.blockUntil <= now) {
        record.blockUntil = 0;
    }
}

function getRateLimitState(req, bucket, discriminator = '') {
    const config = RATE_LIMIT_CONFIG[bucket];
    const key = getRateLimitKey(req, bucket, discriminator);
    const now = Date.now();
    const record = rateLimitRecords.get(key) || { attempts: [], blockUntil: 0 };

    pruneRateLimitRecord(record, config, now);
    rateLimitRecords.set(key, record);

    if (record.blockUntil > now) {
        return {
            limited: true,
            retryAfterSeconds: Math.max(1, Math.ceil((record.blockUntil - now) / 1000))
        };
    }

    return { limited: false, retryAfterSeconds: 0 };
}

function registerRateLimitHit(req, bucket, discriminator = '') {
    const config = RATE_LIMIT_CONFIG[bucket];
    const key = getRateLimitKey(req, bucket, discriminator);
    const now = Date.now();
    const record = rateLimitRecords.get(key) || { attempts: [], blockUntil: 0 };

    pruneRateLimitRecord(record, config, now);
    record.attempts.push(now);

    if (record.attempts.length >= config.maxAttempts) {
        record.blockUntil = now + config.blockMs;
        record.attempts = [];
    }

    rateLimitRecords.set(key, record);
}

function clearRateLimit(req, bucket, discriminator = '') {
    rateLimitRecords.delete(getRateLimitKey(req, bucket, discriminator));
}

function sendRateLimitResponse(res, retryAfterSeconds, message) {
    return sendJson(
        res,
        429,
        { error: message },
        { 'Retry-After': String(retryAfterSeconds) }
    );
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            if (body.length > 1_000_000) {
                req.destroy();
                reject(new Error('Payload too large'));
            }
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                reject(new Error('Invalid JSON payload'));
            }
        });
        req.on('error', reject);
    });
}

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function sanitizeProfile(user) {
    return {
        name: user.name,
        email: user.email,
        message: user.message || '',
        joinDate: user.joinDate,
        photo: user.photo || '',
        psychometric: user.psychometric || null,
        reflectionLatest: sanitizeReflectionPayload(user.reflectionLatest),
        reflectionHistory: sanitizeReflectionHistory(user.reflectionHistory),
        toolLatest: sanitizeToolHistoryEntry(user.toolLatest),
        toolHistory: sanitizeToolHistory(user.toolHistory),
        trendLatest: sanitizeTrendSnapshot(user.trendLatest),
        trendHistory: sanitizeTrendHistory(user.trendHistory),
        articleLatest: sanitizeArticleBrief(user.articleLatest),
        articleHistory: sanitizeArticleHistory(user.articleHistory)
    };
}

function trimText(value, maxLength) {
    return String(value || '').trim().slice(0, maxLength);
}

function sanitizeReflectionList(values, maxItems, maxLength) {
    if (!Array.isArray(values)) {
        return [];
    }

    return values
        .map(value => trimText(value, maxLength))
        .filter(Boolean)
        .slice(0, maxItems);
}

function sanitizeReflectionInputs(inputs) {
    if (!inputs || typeof inputs !== 'object' || Array.isArray(inputs)) {
        return {};
    }

    const allowedKeys = ['goal', 'strength', 'challenge', 'energy', 'horizon', 'environment', 'vision'];
    return allowedKeys.reduce((accumulator, key) => {
        if (Object.prototype.hasOwnProperty.call(inputs, key)) {
            accumulator[key] = trimText(inputs[key], 500);
        }
        return accumulator;
    }, {});
}

function sanitizeReflectionPayload(reflection) {
    if (!reflection || typeof reflection !== 'object' || Array.isArray(reflection)) {
        return null;
    }

    const summary = trimText(reflection.summary, 1200);
    if (!summary) {
        return null;
    }

    const clarityValue = Number.parseInt(reflection.clarity, 10);
    const createdAtValue = String(reflection.createdAt || '').trim();
    const createdAt = Number.isNaN(Date.parse(createdAtValue)) ? new Date().toISOString() : new Date(createdAtValue).toISOString();

    return {
        id: trimText(reflection.id, 120) || `reflection-${Date.now()}`,
        createdAt,
        action: trimText(reflection.action, 40) || 'save',
        mode: trimText(reflection.mode, 80) || 'Visionary',
        modeKey: trimText(reflection.modeKey, 40) || 'visionary',
        track: trimText(reflection.track, 120) || 'Identity Reset',
        trackKey: trimText(reflection.trackKey, 40) || 'identity',
        archetype: trimText(reflection.archetype, 120) || 'Signal Builder',
        clarity: Number.isFinite(clarityValue) ? Math.max(0, Math.min(100, clarityValue)) : 0,
        summary,
        vector: sanitizeReflectionList(reflection.vector, 6, 300),
        nextMoves: sanitizeReflectionList(reflection.nextMoves, 6, 300),
        prompt: trimText(reflection.prompt, 500),
        snapshot: sanitizeReflectionList(reflection.snapshot, 8, 300),
        inputs: sanitizeReflectionInputs(reflection.inputs)
    };
}

function sanitizeReflectionHistory(history) {
    if (!Array.isArray(history)) {
        return [];
    }

    const seenIds = new Set();
    return history
        .map(sanitizeReflectionPayload)
        .filter(entry => {
            if (!entry || seenIds.has(entry.id)) {
                return false;
            }
            seenIds.add(entry.id);
            return true;
        })
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
        .slice(0, MAX_REFLECTION_HISTORY);
}

function sanitizeToolPayloadValue(value, depth = 0) {
    if (depth > 4) {
        return null;
    }

    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === 'string') {
        return trimText(value, 300);
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }

    if (Array.isArray(value)) {
        return value
            .map(item => sanitizeToolPayloadValue(item, depth + 1))
            .filter(item => item !== null)
            .slice(0, 12);
    }

    if (typeof value === 'object') {
        return Object.entries(value).slice(0, 12).reduce((accumulator, [key, nestedValue]) => {
            const sanitizedValue = sanitizeToolPayloadValue(nestedValue, depth + 1);
            if (sanitizedValue !== null) {
                accumulator[trimText(key, 80)] = sanitizedValue;
            }
            return accumulator;
        }, {});
    }

    return null;
}

function sanitizeToolHistoryEntry(entry) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return null;
    }

    const name = trimText(entry.name, 120);
    if (!name) {
        return null;
    }

    const downloadedAtValue = String(entry.downloadedAt || '').trim();
    const downloadedAt = Number.isNaN(Date.parse(downloadedAtValue)) ? new Date().toISOString() : new Date(downloadedAtValue).toISOString();

    return {
        id: trimText(entry.id, 120) || `${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
        name,
        version: trimText(entry.version, 40) || '0.0.0',
        description: trimText(entry.description, 500),
        payload: sanitizeToolPayloadValue(entry.payload || {}, 0) || {},
        fileName: trimText(entry.fileName, 160) || `${name.replace(/\s+/g, '_').toLowerCase()}.json`,
        downloadedAt
    };
}

function sanitizeToolHistory(history) {
    if (!Array.isArray(history)) {
        return [];
    }

    const seenIds = new Set();
    return history
        .map(sanitizeToolHistoryEntry)
        .filter(entry => {
            if (!entry || seenIds.has(entry.id)) {
                return false;
            }
            seenIds.add(entry.id);
            return true;
        })
        .sort((left, right) => Date.parse(right.downloadedAt) - Date.parse(left.downloadedAt))
        .slice(0, MAX_TOOL_HISTORY);
}

function sanitizeTrendSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
        return null;
    }

    const filterLabel = trimText(snapshot.filterLabel, 120);
    const snapshotText = trimText(snapshot.snapshotText, 6000);
    if (!filterLabel || !snapshotText) {
        return null;
    }

    const createdAtValue = String(snapshot.createdAt || '').trim();
    const createdAt = Number.isNaN(Date.parse(createdAtValue)) ? new Date().toISOString() : new Date(createdAtValue).toISOString();
    const visibleCountValue = Number.parseInt(snapshot.visibleCount, 10);

    return {
        id: trimText(snapshot.id, 120) || `trend-snapshot-${Date.now()}`,
        action: trimText(snapshot.action, 40) || 'capture',
        createdAt,
        filterKey: trimText(snapshot.filterKey, 40) || 'all',
        filterLabel,
        alertLevel: trimText(snapshot.alertLevel, 80) || 'Elevated',
        signalHealth: trimText(snapshot.signalHealth, 40) || '0%',
        lastSync: trimText(snapshot.lastSync, 80),
        visibleCount: Number.isFinite(visibleCountValue) ? Math.max(0, Math.min(99, visibleCountValue)) : 0,
        visibleSignals: sanitizeReflectionList(snapshot.visibleSignals, 12, 240),
        snapshotText
    };
}

function sanitizeTrendHistory(history) {
    if (!Array.isArray(history)) {
        return [];
    }

    const seenIds = new Set();
    return history
        .map(sanitizeTrendSnapshot)
        .filter(entry => {
            if (!entry || seenIds.has(entry.id)) {
                return false;
            }
            seenIds.add(entry.id);
            return true;
        })
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
        .slice(0, MAX_TREND_HISTORY);
}

function validateTrendSnapshot(snapshot) {
    const sanitizedSnapshot = sanitizeTrendSnapshot(snapshot);
    if (!sanitizedSnapshot) {
        return { error: 'Trend snapshot payload is invalid.' };
    }

    if (!sanitizedSnapshot.visibleSignals.length) {
        return { error: 'Trend snapshot is missing visible signals.' };
    }

    return { snapshot: sanitizedSnapshot };
}

function sanitizeArticleBrief(article) {
    if (!article || typeof article !== 'object' || Array.isArray(article)) {
        return null;
    }

    const title = trimText(article.title, 160);
    const summary = trimText(article.summary, 1200);
    const briefText = trimText(article.briefText, 8000);
    const pageKey = trimText(article.pageKey, 120);

    if (!title || !summary || !briefText || !pageKey) {
        return null;
    }

    const createdAtValue = String(article.createdAt || '').trim();
    const createdAt = Number.isNaN(Date.parse(createdAtValue)) ? new Date().toISOString() : new Date(createdAtValue).toISOString();
    const researchCountValue = Number.parseInt(article.researchCount, 10);

    return {
        id: trimText(article.id, 120) || `article-brief-${Date.now()}`,
        pageKey,
        action: trimText(article.action, 40) || 'generate',
        createdAt,
        title,
        kicker: trimText(article.kicker, 160) || 'Research Brief',
        summary,
        sectionHeadings: sanitizeReflectionList(article.sectionHeadings, 8, 160),
        researchCount: Number.isFinite(researchCountValue) ? Math.max(0, Math.min(99, researchCountValue)) : 0,
        keySignals: sanitizeReflectionList(article.keySignals, 12, 240),
        briefText
    };
}

function sanitizeArticleHistory(history) {
    if (!Array.isArray(history)) {
        return [];
    }

    const seenIds = new Set();
    return history
        .map(sanitizeArticleBrief)
        .filter(entry => {
            if (!entry || seenIds.has(entry.id)) {
                return false;
            }
            seenIds.add(entry.id);
            return true;
        })
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
        .slice(0, MAX_ARTICLE_HISTORY);
}

function validateArticleBrief(article) {
    const sanitizedArticle = sanitizeArticleBrief(article);
    if (!sanitizedArticle) {
        return { error: 'Article brief payload is invalid.' };
    }

    if (!sanitizedArticle.sectionHeadings.length || !sanitizedArticle.keySignals.length) {
        return { error: 'Article brief is incomplete.' };
    }

    return { article: sanitizedArticle };
}

function validateToolHistoryEntry(entry) {
    const sanitizedEntry = sanitizeToolHistoryEntry(entry);
    if (!sanitizedEntry) {
        return { error: 'Tool manifest payload is invalid.' };
    }

    if (!TOOL_CATALOG[sanitizedEntry.name]) {
        return { error: 'Tool manifest references an unknown tool.' };
    }

    if (!sanitizedEntry.description || typeof sanitizedEntry.payload !== 'object') {
        return { error: 'Tool manifest is incomplete.' };
    }

    return { entry: sanitizedEntry };
}

function validateReflectionPayload(reflection) {
    const sanitizedReflection = sanitizeReflectionPayload(reflection);
    if (!sanitizedReflection) {
        return { error: 'Reflection payload is invalid.' };
    }

    if (!sanitizedReflection.mode || !sanitizedReflection.track || !sanitizedReflection.archetype || !sanitizedReflection.prompt) {
        return { error: 'Reflection payload is missing required fields.' };
    }

    if (!sanitizedReflection.nextMoves.length || !sanitizedReflection.vector.length) {
        return { error: 'Reflection payload is incomplete.' };
    }

    return { reflection: sanitizedReflection };
}

function getRequestOrigin(req) {
    const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
    const protocol = forwardedProto || (req.socket.encrypted ? 'https' : 'http');
    return `${protocol}://${req.headers.host}`;
}

function isDataDirectoryWritable() {
    try {
        fs.accessSync(DATA_DIR, fs.constants.W_OK);
        return true;
    } catch {
        return false;
    }
}

function isTrustedOrigin(req) {
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    const requestOrigin = getRequestOrigin(req);

    if (origin) {
        return origin === requestOrigin;
    }

    if (referer) {
        try {
            return new URL(referer).origin === requestOrigin;
        } catch {
            return false;
        }
    }

    return true;
}

function requireCsrf(req) {
    const session = getSession(req);
    if (!session) {
        return { ok: false, statusCode: 401, error: 'Not authenticated.' };
    }

    if (!isTrustedOrigin(req)) {
        return { ok: false, statusCode: 403, error: 'Untrusted request origin.' };
    }

    const csrfToken = req.headers['x-csrf-token'];
    if (!csrfToken || csrfToken !== session.csrfToken) {
        return { ok: false, statusCode: 403, error: 'Invalid CSRF token.' };
    }

    return { ok: true, session };
}

function validateProfileName(name) {
    if (!name) {
        return 'Name is required.';
    }
    if (name.length > MAX_PROFILE_NAME_LENGTH) {
        return `Name must be ${MAX_PROFILE_NAME_LENGTH} characters or fewer.`;
    }
    if (!/^[\p{L}\p{N} .,'_-]+$/u.test(name)) {
        return 'Name contains unsupported characters.';
    }
    return null;
}

function validateProfileMessage(message) {
    if (message.length > MAX_PROFILE_MESSAGE_LENGTH) {
        return `Mission must be ${MAX_PROFILE_MESSAGE_LENGTH} characters or fewer.`;
    }
    return null;
}

function validateProfilePhoto(photo) {
    if (!photo) {
        return null;
    }

    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(photo);
    if (!match) {
        return 'Profile photo must be a base64-encoded PNG, JPEG, GIF, or WebP image.';
    }

    const mimeType = match[1].toLowerCase();
    if (!ALLOWED_PHOTO_MIME_TYPES.has(mimeType)) {
        return 'Profile photo format is not allowed.';
    }

    let buffer;
    try {
        buffer = Buffer.from(match[2], 'base64');
    } catch {
        return 'Profile photo payload is invalid.';
    }

    if (!buffer.length) {
        return 'Profile photo payload is empty.';
    }

    if (buffer.length > MAX_PHOTO_BYTES) {
        return 'Profile photo must be 2MB or smaller.';
    }

    return null;
}

function validatePsychometricPayload(psychometric) {
    if (!psychometric || typeof psychometric !== 'object') {
        return 'Invalid psychometric payload.';
    }

    if (!PSYCHOMETRIC_TYPES.has(String(psychometric.type || ''))) {
        return 'Psychometric type is invalid.';
    }

    if (typeof psychometric.summary !== 'string' || !psychometric.summary.trim() || psychometric.summary.length > 400) {
        return 'Psychometric summary is invalid.';
    }

    const scores = psychometric.scores;
    const answers = psychometric.answers;
    if (!scores || typeof scores !== 'object' || !answers || typeof answers !== 'object') {
        return 'Psychometric scores or answers are invalid.';
    }

    const scoreKeys = ['analytical', 'creative', 'strategic', 'empathic'];
    for (const key of scoreKeys) {
        if (!Number.isInteger(scores[key]) || scores[key] < 0 || scores[key] > 5) {
            return 'Psychometric scores are invalid.';
        }
    }

    const answerKeys = ['q1', 'q2', 'q3', 'q4', 'q5'];
    for (const key of answerKeys) {
        if (!PSYCHOMETRIC_ANSWER_VALUES.has(String(answers[key] || ''))) {
            return 'Psychometric answers are invalid.';
        }
    }

    return null;
}

function derivePasswordHash(password, salt, pepper = PASSWORD_PEPPER) {
    return crypto.scryptSync(`${password}${pepper}`, salt, 64).toString('hex');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex'), pepper = PASSWORD_PEPPER) {
    const passwordHash = derivePasswordHash(password, salt, pepper);
    return { salt, passwordHash };
}

function verifyPassword(password, salt, passwordHash) {
    if (!salt || !passwordHash) {
        return { isValid: false, usedLegacyHash: false };
    }

    const derived = Buffer.from(derivePasswordHash(password, salt, PASSWORD_PEPPER), 'hex');
    const existing = Buffer.from(passwordHash, 'hex');
    if (existing.length === derived.length && crypto.timingSafeEqual(existing, derived)) {
        return { isValid: true, usedLegacyHash: false };
    }

    if (PASSWORD_PEPPER) {
        const legacyDerived = Buffer.from(derivePasswordHash(password, salt, ''), 'hex');
        if (existing.length === legacyDerived.length && crypto.timingSafeEqual(existing, legacyDerived)) {
            return { isValid: true, usedLegacyHash: true };
        }
    }

    return { isValid: false, usedLegacyHash: false };
}

function findUserBySession(req) {
    const session = getSession(req);
    if (!session) return null;
    const users = readUsers();
    const user = users.find(entry => entry.email === session.email);
    return user ? { user, users } : null;
}

async function handleApi(req, res, pathname) {
    const requestUrl = new URL(req.url, getRequestOrigin(req));

    if (pathname === '/api/health' && req.method === 'GET') {
        return sendJson(res, 200, {
            ok: true,
            uptimeSeconds: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
            dataDirectory: DATA_DIR,
            dataDirectoryWritable: isDataDirectoryWritable()
        });
    }

    if (pathname === '/api/auth/register' && req.method === 'POST') {
        const body = await readBody(req);
        const name = String(body.name || '').trim();
        const email = normalizeEmail(body.email);
        const password = String(body.password || '');
        const message = String(body.message || '').trim();
        const registerRateLimit = getRateLimitState(req, 'register');

        if (registerRateLimit.limited) {
            return sendRateLimitResponse(res, registerRateLimit.retryAfterSeconds, 'Too many registration attempts. Please wait before creating another account.');
        }

        registerRateLimitHit(req, 'register');

        const nameError = validateProfileName(name);
        const messageError = validateProfileMessage(message);

        if (!name || !email || !password) {
            return sendJson(res, 400, { error: 'Name, email, and password are required.' });
        }
        if (nameError) {
            return sendJson(res, 400, { error: nameError });
        }
        if (messageError) {
            return sendJson(res, 400, { error: messageError });
        }
        if (password.length < 8) {
            return sendJson(res, 400, { error: 'Password must be at least 8 characters long.' });
        }

        const users = readUsers();
        const existingUser = users.find(entry => entry.email === email);
        if (existingUser) {
            return sendJson(res, 409, { error: 'An account with that email already exists.' });
        }

        const { salt, passwordHash } = hashPassword(password);
        const user = {
            id: crypto.randomUUID(),
            name,
            email,
            message,
            photo: '',
            joinDate: new Date().toISOString(),
            psychometric: null,
            reflectionLatest: null,
            reflectionHistory: [],
            toolLatest: null,
            toolHistory: [],
            trendLatest: null,
            trendHistory: [],
            articleLatest: null,
            articleHistory: [],
            passwordHash,
            salt
        };

        users.push(user);
        writeUsers(users);

        const { sessionId, session } = createSession(email);
        setSessionCookie(res, sessionId);
        return sendJson(res, 201, { profile: sanitizeProfile(user), csrfToken: session.csrfToken });
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
        const body = await readBody(req);
        const email = normalizeEmail(body.email);
        const password = String(body.password || '');

        if (!email || !password) {
            return sendJson(res, 400, { error: 'Email and password are required.' });
        }

        const loginRateLimit = getRateLimitState(req, 'login', email);
        if (loginRateLimit.limited) {
            return sendRateLimitResponse(res, loginRateLimit.retryAfterSeconds, 'Too many login attempts. Please wait before trying again.');
        }

        const users = readUsers();
        const user = users.find(entry => entry.email === email);
        const passwordCheck = user ? verifyPassword(password, user.salt, user.passwordHash) : { isValid: false, usedLegacyHash: false };
        if (!user || !passwordCheck.isValid) {
            registerRateLimitHit(req, 'login', email);
            return sendJson(res, 401, { error: 'Invalid email or password.' });
        }

        if (passwordCheck.usedLegacyHash && PASSWORD_PEPPER) {
            const currentUser = users.find(entry => entry.email === email);
            const upgradedPassword = hashPassword(password, currentUser.salt, PASSWORD_PEPPER);
            currentUser.passwordHash = upgradedPassword.passwordHash;
            writeUsers(users);
        }

        clearRateLimit(req, 'login', email);

        const { sessionId, session } = createSession(email);
        setSessionCookie(res, sessionId);
        return sendJson(res, 200, { profile: sanitizeProfile(user), csrfToken: session.csrfToken });
    }

    if (pathname === '/api/auth/logout' && req.method === 'POST') {
        const csrf = requireCsrf(req);
        if (!csrf.ok) {
            return sendJson(res, csrf.statusCode, { error: csrf.error });
        }
        destroySession(req);
        clearSessionCookie(res);
        return sendJson(res, 200, { success: true });
    }

    if (pathname === '/api/session-status' && req.method === 'GET') {
        const record = findUserBySession(req);
        if (!record) {
            return sendJson(res, 200, { authenticated: false });
        }

        return sendJson(res, 200, {
            authenticated: true,
            profile: sanitizeProfile(record.user),
            csrfToken: getSession(req).csrfToken
        });
    }

    if (pathname === '/api/me' && req.method === 'GET') {
        const record = findUserBySession(req);
        if (!record) {
            return sendJson(res, 401, { error: 'Not authenticated.' });
        }
        return sendJson(res, 200, { profile: sanitizeProfile(record.user), csrfToken: getSession(req).csrfToken });
    }

    if (pathname === '/api/tools/download' && req.method === 'GET') {
        const record = findUserBySession(req);
        if (!record) {
            return sendJson(res, 401, { error: 'Log in to download tools.' });
        }

        const downloadRateLimit = getRateLimitState(req, 'download');
        if (downloadRateLimit.limited) {
            return sendRateLimitResponse(res, downloadRateLimit.retryAfterSeconds, 'Too many download requests. Please wait before trying again.');
        }

        const toolName = String(requestUrl.searchParams.get('name') || '').trim();
        const tool = TOOL_CATALOG[toolName];
        if (!tool) {
            return sendJson(res, 404, { error: 'Requested tool was not found.' });
        }

        registerRateLimitHit(req, 'download');

        return sendJson(res, 200, {
            tool,
            fileName: `${tool.name.replace(/\s+/g, '_').toLowerCase()}.json`
        });
    }

    if (pathname === '/api/tools/history' && req.method === 'GET') {
        const record = findUserBySession(req);
        if (!record) {
            return sendJson(res, 401, { error: 'Not authenticated.' });
        }

        return sendJson(res, 200, {
            latest: sanitizeToolHistoryEntry(record.user.toolLatest),
            history: sanitizeToolHistory(record.user.toolHistory),
            csrfToken: getSession(req).csrfToken
        });
    }

    if (pathname === '/api/tools/history' && req.method === 'POST') {
        const csrf = requireCsrf(req);
        if (!csrf.ok) {
            return sendJson(res, csrf.statusCode, { error: csrf.error });
        }

        const record = findUserBySession(req);
        if (!record) {
            return sendJson(res, 401, { error: 'Not authenticated.' });
        }

        const body = await readBody(req);
        const toolCheck = validateToolHistoryEntry(body.toolManifest);
        if (toolCheck.error) {
            return sendJson(res, 400, { error: toolCheck.error });
        }

        const currentUser = record.users.find(entry => entry.email === record.user.email);
        const sanitizedEntry = toolCheck.entry;
        const nextHistory = sanitizeToolHistory([
            sanitizedEntry,
            ...(Array.isArray(currentUser.toolHistory) ? currentUser.toolHistory : [])
        ]);

        currentUser.toolLatest = sanitizedEntry;
        currentUser.toolHistory = nextHistory;
        writeUsers(record.users);

        return sendJson(res, 200, {
            latest: sanitizeToolHistoryEntry(currentUser.toolLatest),
            history: sanitizeToolHistory(currentUser.toolHistory)
        });
    }

    if (pathname === '/api/trends/history' && req.method === 'GET') {
        const record = findUserBySession(req);
        if (!record) {
            return sendJson(res, 401, { error: 'Not authenticated.' });
        }

        return sendJson(res, 200, {
            latest: sanitizeTrendSnapshot(record.user.trendLatest),
            history: sanitizeTrendHistory(record.user.trendHistory),
            csrfToken: getSession(req).csrfToken
        });
    }

    if (pathname === '/api/trends/history' && req.method === 'POST') {
        const csrf = requireCsrf(req);
        if (!csrf.ok) {
            return sendJson(res, csrf.statusCode, { error: csrf.error });
        }

        const record = findUserBySession(req);
        if (!record) {
            return sendJson(res, 401, { error: 'Not authenticated.' });
        }

        const body = await readBody(req);
        const snapshotCheck = validateTrendSnapshot(body.snapshot);
        if (snapshotCheck.error) {
            return sendJson(res, 400, { error: snapshotCheck.error });
        }

        const currentUser = record.users.find(entry => entry.email === record.user.email);
        const sanitizedSnapshot = snapshotCheck.snapshot;
        const nextHistory = sanitizeTrendHistory([
            sanitizedSnapshot,
            ...(Array.isArray(currentUser.trendHistory) ? currentUser.trendHistory : [])
        ]);

        currentUser.trendLatest = sanitizedSnapshot;
        currentUser.trendHistory = nextHistory;
        writeUsers(record.users);

        return sendJson(res, 200, {
            latest: sanitizeTrendSnapshot(currentUser.trendLatest),
            history: sanitizeTrendHistory(currentUser.trendHistory)
        });
    }

    if (pathname === '/api/articles/history' && req.method === 'GET') {
        const record = findUserBySession(req);
        if (!record) {
            return sendJson(res, 401, { error: 'Not authenticated.' });
        }

        const pageKey = trimText(requestUrl.searchParams.get('pageKey'), 120);
        const articleHistory = sanitizeArticleHistory(record.user.articleHistory).filter(entry => !pageKey || entry.pageKey === pageKey);

        return sendJson(res, 200, {
            latest: articleHistory[0] || sanitizeArticleBrief(record.user.articleLatest),
            history: articleHistory,
            csrfToken: getSession(req).csrfToken
        });
    }

    if (pathname === '/api/articles/history' && req.method === 'POST') {
        const csrf = requireCsrf(req);
        if (!csrf.ok) {
            return sendJson(res, csrf.statusCode, { error: csrf.error });
        }

        const record = findUserBySession(req);
        if (!record) {
            return sendJson(res, 401, { error: 'Not authenticated.' });
        }

        const body = await readBody(req);
        const articleCheck = validateArticleBrief(body.article);
        if (articleCheck.error) {
            return sendJson(res, 400, { error: articleCheck.error });
        }

        const currentUser = record.users.find(entry => entry.email === record.user.email);
        const sanitizedArticle = articleCheck.article;
        const nextHistory = sanitizeArticleHistory([
            sanitizedArticle,
            ...(Array.isArray(currentUser.articleHistory) ? currentUser.articleHistory : [])
        ]);

        currentUser.articleLatest = sanitizedArticle;
        currentUser.articleHistory = nextHistory;
        writeUsers(record.users);

        return sendJson(res, 200, {
            latest: sanitizeArticleBrief(currentUser.articleLatest),
            history: sanitizeArticleHistory(currentUser.articleHistory).filter(entry => entry.pageKey === sanitizedArticle.pageKey)
        });
    }

    if (pathname === '/api/profile' && req.method === 'PUT') {
        const csrf = requireCsrf(req);
        if (!csrf.ok) {
            return sendJson(res, csrf.statusCode, { error: csrf.error });
        }

        const record = findUserBySession(req);
        if (!record) {
            return sendJson(res, 401, { error: 'Not authenticated.' });
        }

        const body = await readBody(req);
        const name = String(body.name || '').trim();
        const message = String(body.message || '').trim();
        const photo = String(body.photo || '').trim();
        const nameError = validateProfileName(name);
        const messageError = validateProfileMessage(message);
        const photoError = validateProfilePhoto(photo);

        if (nameError) {
            return sendJson(res, 400, { error: nameError });
        }
        if (messageError) {
            return sendJson(res, 400, { error: messageError });
        }
        if (photoError) {
            return sendJson(res, 400, { error: photoError });
        }

        const currentUser = record.users.find(entry => entry.email === record.user.email);
        currentUser.name = name;
        currentUser.message = message;
        currentUser.photo = photo;
        writeUsers(record.users);

        return sendJson(res, 200, { profile: sanitizeProfile(currentUser) });
    }

    if (pathname === '/api/reflections' && req.method === 'GET') {
        const record = findUserBySession(req);
        if (!record) {
            return sendJson(res, 401, { error: 'Not authenticated.' });
        }

        return sendJson(res, 200, {
            latest: sanitizeReflectionPayload(record.user.reflectionLatest),
            history: sanitizeReflectionHistory(record.user.reflectionHistory),
            csrfToken: getSession(req).csrfToken
        });
    }

    if (pathname === '/api/reflections' && req.method === 'POST') {
        const csrf = requireCsrf(req);
        if (!csrf.ok) {
            return sendJson(res, csrf.statusCode, { error: csrf.error });
        }

        const record = findUserBySession(req);
        if (!record) {
            return sendJson(res, 401, { error: 'Not authenticated.' });
        }

        const body = await readBody(req);
        const reflectionCheck = validateReflectionPayload(body.reflection);
        if (reflectionCheck.error) {
            return sendJson(res, 400, { error: reflectionCheck.error });
        }

        const currentUser = record.users.find(entry => entry.email === record.user.email);
        const sanitizedReflection = reflectionCheck.reflection;
        const nextHistory = sanitizeReflectionHistory([
            sanitizedReflection,
            ...(Array.isArray(currentUser.reflectionHistory) ? currentUser.reflectionHistory : [])
        ]);

        currentUser.reflectionLatest = sanitizedReflection;
        currentUser.reflectionHistory = nextHistory;
        writeUsers(record.users);

        return sendJson(res, 200, {
            latest: sanitizeReflectionPayload(currentUser.reflectionLatest),
            history: sanitizeReflectionHistory(currentUser.reflectionHistory)
        });
    }

    if (pathname === '/api/psychometric' && req.method === 'POST') {
        const csrf = requireCsrf(req);
        if (!csrf.ok) {
            return sendJson(res, csrf.statusCode, { error: csrf.error });
        }

        const record = findUserBySession(req);
        if (!record) {
            return sendJson(res, 401, { error: 'Not authenticated.' });
        }

        const body = await readBody(req);
        const psychometric = body.psychometric;
        const psychometricError = validatePsychometricPayload(psychometric);
        if (psychometricError) {
            return sendJson(res, 400, { error: psychometricError });
        }

        const currentUser = record.users.find(entry => entry.email === record.user.email);
        currentUser.psychometric = {
            ...psychometric,
            completedAt: psychometric.completedAt || new Date().toISOString()
        };
        writeUsers(record.users);

        return sendJson(res, 200, { profile: sanitizeProfile(currentUser) });
    }

    return sendJson(res, 404, { error: 'API route not found.' });
}

function serveStaticFile(req, res, pathname) {
    const routeAliases = {
        '/': '/index.html',
        '/welcome': '/index.html',
        '/home': '/home.html',
        '/favicon.ico': '/AI.jpg'
    };

    let requestPath = routeAliases[pathname] || pathname;
    const safePath = path.normalize(path.join(ROOT, requestPath));
    if (!safePath.startsWith(ROOT)) {
        return sendText(res, 403, 'Forbidden');
    }

    if (safePath.startsWith(DATA_DIR)) {
        return sendText(res, 403, 'Forbidden');
    }

    fs.readFile(safePath, (error, file) => {
        if (error) {
            if (error.code === 'ENOENT') {
                return sendText(res, 404, 'Not found');
            }
            return sendText(res, 500, 'Internal server error');
        }

        const extension = path.extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[extension] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(file);
    });
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    try {
        if (url.pathname.startsWith('/api/')) {
            await handleApi(req, res, url.pathname);
            return;
        }

        if (url.pathname === '/profile.html' && !getSession(req)) {
            res.writeHead(302, { Location: '/login.html' });
            res.end();
            return;
        }

        serveStaticFile(req, res, url.pathname);
    } catch (error) {
        sendJson(res, 500, { error: error.message || 'Unexpected server error.' });
    }
});

server.listen(PORT, HOST, () => {
    console.log(`A Brighter Future server running at http://${HOST}:${PORT}`);
    console.log(`Data directory: ${DATA_DIR}`);
});