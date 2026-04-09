(function () {
    function resolvePageKind(pathname) {
        const file = (pathname.split('/').pop() || '').toLowerCase();
        if (file === 'index.html' || file === 'welcome.html' || file === 'welcome') return 'welcome';
        if (file === 'home.html' || file === 'home') return 'home';
        if (file === 'login.html') return 'login';
        if (file === 'tools.html') return 'tools';
        if (file === 'trends.html') return 'trends';
        if (file === 'profile.html') return 'profile';
        if (file === 'self-discovery.html') return 'self-discovery';
        if (file === 'biometric-ai.html' || file === 'edge-intelligence.html' || file === 'quantum-neural-networks.html') return 'article';
        return 'default';
    }

    function decorateSurface(surface) {
        if (!(surface instanceof HTMLElement) || surface.dataset.fvDecorated === 'true') {
            return;
        }
        surface.dataset.fvDecorated = 'true';
        surface.classList.add('fv-surface');
        ['top', 'right', 'bottom', 'left'].forEach(edge => {
            const tracer = document.createElement('span');
            tracer.className = `fv-edge-tracer is-${edge}`;
            tracer.setAttribute('aria-hidden', 'true');
            surface.appendChild(tracer);
        });
    }

    function decorateSurfaces(root) {
        const selectors = [
            '.hero', '.hero-panel', '.hero-copy', '.signal-panel', '.signal-card', '.auth-console', '.intel-rail-card',
            '.panel', '.panel-main', '.panel-side', '.dashboard-card', '.summary-card', '.detail-card', '.service-card',
            '.m-card', '.tool-card', '.manifest-card', '.rail-card', '.visual-sources-card', '.command-panel',
            '.result-card', '.status-card', '.telemetry-card', '.history-card', '.compare-panel', '.compare-overview-card',
            '.compare-diff-panel', '.profile-header', '.contact-card', '.psychometric-card', '.timeline-card',
            '.reflection-identity-card', '.tools-identity-card', '.quote-card', '.metric-card', '.avatar-card',
            '.redirect-card', '.trend-card', '.modal-content', '.secondary-panel', '.telemetry-cell', '.snapshot-history-card',
            '.snapshot-compare-panel', '.command-palette-card', '.section'
        ];
        root.querySelectorAll(selectors.join(',')).forEach(decorateSurface);
    }

    function assignRevealDelays(root) {
        root.querySelectorAll('.reveal-target').forEach((node, index) => {
            node.style.setProperty('--fv-delay', `${Math.min(index, 10) * 70}ms`);
        });
    }

    function start() {
        document.body.dataset.page = resolvePageKind(window.location.pathname);
        document.body.classList.add('fv-motion-ready');
        decorateSurfaces(document);
        assignRevealDelays(document);

        const observer = new MutationObserver(mutations => {
            let shouldRefresh = false;
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    shouldRefresh = true;
                    mutation.addedNodes.forEach(node => {
                        if (node instanceof HTMLElement) {
                            decorateSurfaces(node);
                        }
                    });
                }
            }
            if (shouldRefresh) {
                assignRevealDelays(document);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();