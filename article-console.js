(function () {
    const MAX_HISTORY_ITEMS = 8;
    const pageKey = window.location.pathname.split('/').pop() || 'article';

    function escapeHtml(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getStorageKey() {
        return `floscar-article-brief-history:${pageKey}`;
    }

    function loadStoredJson(key, fallback) {
        try {
            const raw = window.localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    function saveStoredJson(key, value) {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // Ignore storage failures.
        }
    }

    function readUrlState() {
        const params = new URLSearchParams(window.location.search);
        return {
            brief: params.get('brief')
        };
    }

    function updateBriefUrl(entryId) {
        const url = new URL(window.location.href);
        if (entryId) {
            url.searchParams.set('brief', entryId);
        } else {
            url.searchParams.delete('brief');
        }
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }

    function ensureStyles() {
        if (document.getElementById('article-console-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'article-console-styles';
        style.textContent = `
            .article-console {
                margin: 0 0 2.4rem;
                padding: 1.4rem;
                border-radius: 22px;
                background: rgba(0, 12, 0, 0.52);
                border: 1px solid rgba(51, 255, 51, 0.16);
                box-shadow: inset 0 0 24px rgba(51, 255, 51, 0.05), 0 20px 48px rgba(0, 0, 0, 0.2);
                display: grid;
                gap: 1.1rem;
            }
            .article-console-header {
                display: grid;
                gap: 0.55rem;
            }
            .article-console-kicker {
                color: #8dff8d;
                font-size: 0.78rem;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                font-family: 'Courier New', monospace;
            }
            .article-console-header h2 {
                margin: 0;
                font-size: clamp(1.35rem, 3vw, 2rem);
                letter-spacing: 0.08em;
                color: #efffef;
            }
            .article-console-header p {
                margin: 0;
                color: #c7e6c7;
                line-height: 1.75;
            }
            .article-console-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 0.85rem;
            }
            .article-console-actions button {
                background: rgba(51, 255, 51, 0.12);
                color: #dbffdb;
                padding: 0.82rem 1.1rem;
                border-radius: 999px;
                border: 1px solid rgba(51, 255, 51, 0.28);
                cursor: pointer;
                font-weight: 700;
                transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
            }
            .article-console-actions button:hover {
                transform: translateY(-1px);
                box-shadow: 0 10px 24px rgba(51, 255, 51, 0.12);
                background: rgba(51, 255, 51, 0.18);
            }
            .article-console-grid {
                display: grid;
                grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
                gap: 1rem;
                align-items: start;
            }
            .article-console-card {
                padding: 1rem;
                border-radius: 18px;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(51, 255, 51, 0.1);
                display: grid;
                gap: 0.75rem;
            }
            .article-console-card h3 {
                margin: 0;
                color: #ebffeb;
                letter-spacing: 0.08em;
            }
            .article-console-caption,
            .article-console-empty,
            .article-compare-empty,
            .article-history-item span,
            .article-compare-row small {
                color: #8fbc8f;
                font-size: 0.78rem;
                letter-spacing: 0.08em;
                text-transform: uppercase;
            }
            .article-console-preview {
                margin: 0;
                white-space: pre-wrap;
                color: #e6ffe6;
                line-height: 1.7;
                font-family: 'Courier New', monospace;
                font-size: 0.92rem;
            }
            .article-history-list,
            .article-compare-list {
                display: grid;
                gap: 0.75rem;
            }
            .article-history-item {
                padding: 0.95rem;
                border-radius: 16px;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(51, 255, 51, 0.1);
                display: grid;
                gap: 0.45rem;
            }
            .article-history-item.is-selected,
            .article-history-item.is-secondary {
                border-color: rgba(51, 255, 51, 0.32);
                box-shadow: 0 0 0 1px rgba(51, 255, 51, 0.1);
            }
            .article-history-item strong {
                color: #efffef;
            }
            .article-history-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 0.6rem;
            }
            .article-history-actions button {
                padding: 0.55rem 0.8rem;
                border-radius: 999px;
                border: 1px solid rgba(51, 255, 51, 0.22);
                background: rgba(51, 255, 51, 0.1);
                color: #deffde;
                cursor: pointer;
            }
            .article-compare-row {
                padding: 0.9rem;
                border-radius: 16px;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(51, 255, 51, 0.08);
                display: grid;
                gap: 0.6rem;
            }
            .article-compare-row.is-changed {
                border-color: rgba(51, 255, 51, 0.22);
                background: rgba(51, 255, 51, 0.06);
            }
            .article-compare-values {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 0.8rem;
            }
            .article-compare-panel {
                padding: 0.85rem;
                border-radius: 14px;
                background: rgba(0, 0, 0, 0.22);
                border: 1px solid rgba(51, 255, 51, 0.08);
                display: grid;
                gap: 0.4rem;
            }
            .article-compare-panel strong {
                color: #ebffeb;
                white-space: pre-wrap;
            }
            .article-console-toast {
                position: fixed;
                right: 18px;
                bottom: 18px;
                z-index: 9999;
                padding: 0.9rem 1rem;
                border-radius: 16px;
                border: 1px solid rgba(51, 255, 51, 0.18);
                background: rgba(0, 16, 0, 0.9);
                color: #e8ffe8;
                box-shadow: 0 18px 48px rgba(0, 0, 0, 0.32);
            }
            @media (max-width: 860px) {
                .article-console-grid {
                    grid-template-columns: 1fr;
                }
                .article-compare-values {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function collectPageData() {
        const title = document.querySelector('.page-title')?.textContent?.trim() || document.title;
        const kicker = document.querySelector('.page-kicker')?.textContent?.trim() || 'Research Brief';
        const summary = document.querySelector('.page-copy')?.textContent?.trim() || '';
        const sections = Array.from(document.querySelectorAll('.section')).map(section => ({
            heading: section.querySelector('h2')?.textContent?.trim() || 'Section',
            paragraph: section.querySelector('p')?.textContent?.trim() || '',
            bullets: Array.from(section.querySelectorAll('li')).slice(0, 3).map(item => item.textContent.trim())
        }));
        const researchItems = Array.from(document.querySelectorAll('.research-list li')).slice(0, 4).map(item => item.textContent.trim());

        return { title, kicker, summary, sections, researchItems };
    }

    function buildBriefRecord(action) {
        const data = collectPageData();
        const keySignals = [
            ...data.sections.slice(0, 3).map(section => section.heading),
            ...data.researchItems.slice(0, 2)
        ].filter(Boolean);

        const briefText = [
            `FLOSCAR VANGUARD // ${data.title.toUpperCase()} BRIEF`,
            `LAYER: ${data.kicker}`,
            `GENERATED: ${new Date().toLocaleString()}`,
            '',
            'SUMMARY:',
            data.summary,
            '',
            'SECTION SIGNALS:',
            ...data.sections.slice(0, 4).map(section => `- ${section.heading}: ${section.paragraph}`),
            '',
            'RESEARCH HIGHLIGHTS:',
            ...data.researchItems.map(item => `- ${item}`)
        ].join('\n');

        return {
            id: `${window.location.pathname}-${Date.now()}`,
            pageKey,
            action,
            createdAt: new Date().toISOString(),
            title: data.title,
            kicker: data.kicker,
            summary: data.summary,
            sectionHeadings: data.sections.slice(0, 4).map(section => section.heading),
            researchCount: data.researchItems.length,
            keySignals,
            briefText
        };
    }

    async function apiRequest(url, options = {}, state) {
        const method = (options.method || 'GET').toUpperCase();
        const response = await fetch(url, {
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                ...(method !== 'GET' && state.csrfToken ? { 'X-CSRF-Token': state.csrfToken } : {}),
                ...(options.headers || {})
            },
            ...options
        });

        const isJson = response.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await response.json() : null;

        if (data?.csrfToken) {
            state.csrfToken = data.csrfToken;
        }

        if (!response.ok) {
            const error = new Error(data?.error || 'Request failed.');
            error.status = response.status;
            throw error;
        }

        return data;
    }

    function getHistory() {
        return loadStoredJson(getStorageKey(), []).filter(entry => entry && typeof entry === 'object');
    }

    function saveHistory(entries) {
        saveStoredJson(getStorageKey(), entries);
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'article-console-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        window.setTimeout(() => toast.remove(), 2200);
    }

    function exportBrief(record) {
        const blob = new Blob([record.briefText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${record.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-brief.txt`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function initConsole() {
        ensureStyles();

        const main = document.querySelector('.page-content');
        const intro = document.querySelector('.page-copy');
        if (!main || !intro || document.getElementById('articleBriefConsole')) {
            return;
        }

        const state = {
            activeRecord: getHistory()[0] || buildBriefRecord('live'),
            compareSelection: [],
            csrfToken: '',
            isAuthenticated: false
        };

        const consoleSection = document.createElement('section');
        consoleSection.className = 'article-console';
        consoleSection.id = 'articleBriefConsole';
        intro.insertAdjacentElement('afterend', consoleSection);

        function saveRecord(action) {
            const record = buildBriefRecord(action);
            const nextHistory = [record, ...getHistory().filter(entry => !(entry.title === record.title && entry.action === record.action && entry.briefText === record.briefText))].slice(0, MAX_HISTORY_ITEMS);
            saveHistory(nextHistory);
            state.activeRecord = record;
            render();

            persistRecord(record).then(serverState => {
                if (serverState?.latest) {
                    state.activeRecord = serverState.latest;
                    updateBriefUrl(state.activeRecord.id);
                    render();
                }
            }).catch(() => {
                // Keep local history if sync fails.
            });

            return record;
        }

        function mergeHistory(...collections) {
            const seenIds = new Set();
            return collections
                .flat()
                .filter(entry => entry && typeof entry === 'object')
                .filter(entry => {
                    const entryId = String(entry.id || '');
                    if (!entryId || seenIds.has(entryId)) {
                        return false;
                    }
                    seenIds.add(entryId);
                    return true;
                })
                .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
                .slice(0, MAX_HISTORY_ITEMS);
        }

        function syncLocalHistory(latest, history) {
            const merged = mergeHistory(history || [], latest ? [latest] : [], getHistory());
            saveHistory(merged);
            return {
                latest: merged[0] || latest || null,
                history: merged
            };
        }

        async function hydrateHistory(profile = null) {
            if (!state.isAuthenticated && !profile) {
                return;
            }

            try {
                const response = profile?.articleHistory
                    ? { latest: profile.articleLatest || null, history: profile.articleHistory.filter(entry => entry.pageKey === pageKey) }
                    : await apiRequest(`/api/articles/history?pageKey=${encodeURIComponent(pageKey)}`, {}, state);
                const synced = syncLocalHistory(response.latest, response.history);
                if (synced.latest) {
                    state.activeRecord = synced.latest;
                }
                render();
                loadBriefFromUrl();
            } catch {
                // Keep local history as fallback.
            }
        }

        async function persistRecord(record) {
            if (!state.isAuthenticated) {
                return null;
            }

            const response = await apiRequest('/api/articles/history', {
                method: 'POST',
                body: JSON.stringify({ article: record })
            }, state);

            return syncLocalHistory(response.latest, response.history);
        }

        async function checkSession() {
            try {
                const data = await apiRequest('/api/me', {}, state);
                state.isAuthenticated = true;
                await hydrateHistory(data.profile);
            } catch {
                state.isAuthenticated = false;
            }
        }

        function toggleCompare(id) {
            const nextSelection = [...state.compareSelection];
            const existingIndex = nextSelection.indexOf(id);
            if (existingIndex >= 0) {
                nextSelection.splice(existingIndex, 1);
            } else if (nextSelection.length < 2) {
                nextSelection.push(id);
            } else {
                nextSelection.shift();
                nextSelection.push(id);
            }
            state.compareSelection = nextSelection;
            render();
        }

        function loadBriefFromUrl() {
            const briefId = readUrlState().brief;
            if (!briefId) {
                return false;
            }

            const target = getHistory().find(entry => entry.id === briefId);
            if (!target) {
                return false;
            }

            state.activeRecord = target;
            render();
            return true;
        }

        function renderCompare(history) {
            const selected = state.compareSelection.map(id => history.find(entry => entry.id === id)).filter(Boolean);
            if (!selected.length) {
                return '<div class="article-compare-empty">Generate and store two article briefs, then compare their summaries, section coverage, and research highlights.</div>';
            }
            if (selected.length === 1) {
                return `<div class="article-compare-empty">${escapeHtml(selected[0].title)} is primed. Select one more saved brief to inspect changes in emphasis and highlights.</div>`;
            }

            const ordered = [...selected].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
            const rows = [
                { label: 'Summary', earlier: ordered[0].summary, later: ordered[1].summary },
                { label: 'Section Headings', earlier: ordered[0].sectionHeadings.join(', '), later: ordered[1].sectionHeadings.join(', ') },
                { label: 'Research Count', earlier: String(ordered[0].researchCount), later: String(ordered[1].researchCount) },
                { label: 'Key Signals', earlier: ordered[0].keySignals.join(', '), later: ordered[1].keySignals.join(', ') }
            ].map(row => ({ ...row, changed: row.earlier !== row.later }));

            return rows.map(row => `
                <div class="article-compare-row ${row.changed ? 'is-changed' : ''}">
                    <small>${escapeHtml(row.label)}</small>
                    <div class="article-compare-values">
                        <div class="article-compare-panel"><small>Earlier</small><strong>${escapeHtml(row.earlier)}</strong></div>
                        <div class="article-compare-panel"><small>Later</small><strong>${escapeHtml(row.later)}</strong></div>
                    </div>
                </div>
            `).join('');
        }

        function render() {
            const history = getHistory();
            const activeRecord = state.activeRecord || buildBriefRecord('live');
            consoleSection.innerHTML = `
                <div class="article-console-header">
                    <div class="article-console-kicker">Research Console // Stored Brief Layer</div>
                    <h2>${escapeHtml(activeRecord.title)} Brief Console</h2>
                    <p>Generate a structured article brief, store snapshots of the current research state, and compare two saved brief versions to inspect how the article emphasis evolves over time.</p>
                </div>
                <div class="article-console-actions">
                    <button type="button" data-action="generate">Generate Brief</button>
                    <button type="button" data-action="copy">Copy Brief</button>
                    <button type="button" data-action="export">Export Brief</button>
                    <button type="button" data-action="share">Share Brief</button>
                </div>
                <div class="article-console-grid">
                    <div class="article-console-card">
                        <h3>Active Brief</h3>
                        <div class="article-console-caption">${escapeHtml(activeRecord.kicker)} // ${escapeHtml(activeRecord.action)} // ${escapeHtml(new Date(activeRecord.createdAt).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }))}</div>
                        <pre class="article-console-preview">${escapeHtml(activeRecord.briefText)}</pre>
                    </div>
                    <div class="article-console-card">
                        <h3>Saved Briefs</h3>
                        <div class="article-history-list">
                            ${history.length ? history.map(entry => `
                                <div class="article-history-item ${state.compareSelection[0] === entry.id ? 'is-selected' : ''} ${state.compareSelection[1] === entry.id ? 'is-secondary' : ''}">
                                    <strong>${escapeHtml(entry.title)}</strong>
                                    <div>${escapeHtml(entry.summary)}</div>
                                    <span>${escapeHtml(entry.action)} // ${escapeHtml(new Date(entry.createdAt).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }))}</span>
                                    <div class="article-history-actions">
                                        <button type="button" data-history-action="load" data-id="${escapeHtml(entry.id)}">Load</button>
                                        <button type="button" data-history-action="compare" data-id="${escapeHtml(entry.id)}">${state.compareSelection.includes(entry.id) ? 'Selected' : 'Compare'}</button>
                                    </div>
                                </div>
                            `).join('') : '<div class="article-console-empty">No saved briefs yet. Generate, copy, export, or share to create article history.</div>'}
                        </div>
                    </div>
                </div>
                <div class="article-console-card">
                    <h3>Brief Compare</h3>
                    <div class="article-compare-list">${renderCompare(history)}</div>
                </div>
            `;

            consoleSection.querySelector('[data-action="generate"]').addEventListener('click', () => {
                const record = saveRecord('generate');
                updateBriefUrl(record.id);
                showToast('Article brief stored.');
            });

            consoleSection.querySelector('[data-action="copy"]').addEventListener('click', async () => {
                const record = saveRecord('copy');
                updateBriefUrl(record.id);
                await navigator.clipboard.writeText(record.briefText);
                showToast('Article brief copied.');
            });

            consoleSection.querySelector('[data-action="export"]').addEventListener('click', () => {
                const record = saveRecord('export');
                updateBriefUrl(record.id);
                exportBrief(record);
                showToast('Article brief exported.');
            });

            consoleSection.querySelector('[data-action="share"]').addEventListener('click', async () => {
                const record = saveRecord('share');
                updateBriefUrl(record.id);
                if (navigator.share) {
                    await navigator.share({ title: `${record.title} Brief`, text: record.briefText, url: window.location.href });
                } else {
                    await navigator.clipboard.writeText(`${record.briefText}\n\n${window.location.href}`);
                }
                showToast('Article brief shared.');
            });

            consoleSection.querySelectorAll('[data-history-action="load"]').forEach(button => {
                button.addEventListener('click', () => {
                    const entry = history.find(item => item.id === button.dataset.id);
                    if (!entry) {
                        return;
                    }
                    state.activeRecord = entry;
                    updateBriefUrl(entry.id);
                    render();
                });
            });

            consoleSection.querySelectorAll('[data-history-action="compare"]').forEach(button => {
                button.addEventListener('click', () => toggleCompare(button.dataset.id));
            });
        }

        render();
        loadBriefFromUrl();
        checkSession();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initConsole);
    } else {
        initConsole();
    }
})();