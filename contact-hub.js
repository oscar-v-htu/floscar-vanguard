(function () {
    const GLOBAL_SUPPORT_CONFIG = {
        beneficiary: 'VORDZORGBE OSCAR DZIEDZORM',
        bankName: 'CalBank',
        routingNumber: 'ADD ROUTING NUMBER IF NEEDED',
        accountNumber: '2394010600001',
        accountType: 'Bank Transfer',
        swiftCode: 'ADD SWIFT / BIC IF REQUIRED',
        reference: 'Include your name and project/support note',
        acceptedCurrencies: ['GHS', 'USD'],
        primaryLabel: 'EMAIL_FOR_MOMO_DETAILS',
        supportLabel: 'Bank Transfer / Sponsorship Details',
        supportTitle: 'Direct Support Details',
        supportKicker: 'Direct Support',
        supportCopy: 'Support Floscar Vanguard using the bank details below. If you need Mobile Money guidance or want to confirm a sponsorship transfer first, send an email directly from this panel.',
        supportMetaPrefix: 'Channels',
        note: 'Use these details exactly as provided. If your bank or transfer provider requires extra routing, branch, or SWIFT information, request it by email before sending funds.'
    };

    function injectFundingStyles() {
        if (document.getElementById('global-support-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'global-support-styles';
        style.textContent = `
            #contactModal .modal-content {
                max-width: 560px;
            }

            #contactModal .contact-item.funding .icon-box i {
                color: #7ce9ff;
            }

            #contactModal .contact-item.funding:hover .icon-box i {
                color: #c9fbff;
            }

            #contactModal .funding-panel {
                margin: 0 30px 30px;
                padding: 18px;
                border: 1px solid rgba(51, 255, 51, 0.18);
                background: linear-gradient(180deg, rgba(3, 14, 8, 0.88), rgba(2, 8, 5, 0.96));
                box-shadow: inset 0 0 18px rgba(51, 255, 51, 0.05), 0 12px 32px rgba(0, 0, 0, 0.22);
            }

            #contactModal .funding-panel[hidden] {
                display: none;
            }

            #contactModal .funding-kicker {
                display: inline-block;
                margin-bottom: 0.55rem;
                color: #7df7e4;
                font-size: 0.68rem;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                font-family: 'Courier New', monospace;
            }

            #contactModal .funding-panel h3 {
                margin: 0;
                color: #f2fff2;
                font-size: 1.1rem;
                letter-spacing: 0.05em;
            }

            #contactModal .funding-copy {
                margin: 0.7rem 0 0;
                color: #a7c8a7;
                font-size: 0.86rem;
                line-height: 1.6;
            }

            #contactModal .funding-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 1rem;
            }

            #contactModal .funding-btn {
                appearance: none;
                border: 1px solid rgba(51, 255, 51, 0.24);
                background: rgba(255, 255, 255, 0.03);
                color: #efffef;
                text-decoration: none;
                padding: 0.8rem 1rem;
                font-size: 0.75rem;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                font-family: 'Courier New', monospace;
                cursor: pointer;
                transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
            }

            #contactModal .funding-btn:hover {
                transform: translateY(-1px);
                border-color: rgba(51, 255, 51, 0.55);
                background: rgba(51, 255, 51, 0.08);
            }

            #contactModal .funding-btn-primary {
                background: linear-gradient(90deg, rgba(30, 255, 160, 0.86), rgba(30, 210, 255, 0.86));
                color: #041108;
                font-weight: 700;
                border-color: transparent;
            }

            #contactModal .funding-meta {
                margin-top: 0.9rem;
                color: #73a273;
                font-size: 0.72rem;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                font-family: 'Courier New', monospace;
            }

            #contactModal .funding-terminal {
                margin-top: 1rem;
                border: 1px solid rgba(124, 233, 255, 0.18);
                background: rgba(0, 5, 8, 0.9);
            }

            #contactModal .funding-terminal-bar {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 0.7rem 0.9rem;
                border-bottom: 1px solid rgba(124, 233, 255, 0.12);
                background: rgba(255, 255, 255, 0.03);
            }

            #contactModal .funding-dot {
                width: 9px;
                height: 9px;
                border-radius: 50%;
                display: inline-block;
            }

            #contactModal .funding-dot.red { background: #ff5f56; }
            #contactModal .funding-dot.amber { background: #ffbd2e; }
            #contactModal .funding-dot.green { background: #27c93f; }

            #contactModal .funding-terminal-title {
                color: #92cad4;
                font-size: 0.72rem;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                font-family: 'Courier New', monospace;
            }

            #contactModal .funding-terminal-body {
                display: grid;
                gap: 0.72rem;
                padding: 1rem;
                color: #dff8ff;
                font-family: 'Courier New', monospace;
                font-size: 0.8rem;
            }

            #contactModal .funding-terminal-line {
                display: grid;
                grid-template-columns: 160px 1fr;
                gap: 12px;
                align-items: start;
            }

            #contactModal .funding-terminal-line.is-intro {
                grid-template-columns: 1fr;
                color: #7df7e4;
            }

            #contactModal .funding-terminal-label {
                color: #84b6c2;
                text-transform: uppercase;
            }

            #contactModal .funding-terminal-value {
                color: #f6ffff;
                word-break: break-word;
            }

            #contactModal .funding-terminal-note {
                margin-top: 0.15rem;
                padding-top: 0.9rem;
                border-top: 1px dashed rgba(124, 233, 255, 0.14);
                color: #8da6ad;
                line-height: 1.6;
            }

            @media (max-width: 640px) {
                #contactModal .funding-terminal-line {
                    grid-template-columns: 1fr;
                    gap: 4px;
                }

                #contactModal .funding-actions {
                    flex-direction: column;
                }

                #contactModal .funding-btn {
                    width: 100%;
                    text-align: center;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function buildFundingMarkup() {
        const currencies = GLOBAL_SUPPORT_CONFIG.acceptedCurrencies.join(' / ');
        return `
            <a href="javascript:void(0)" onclick="openContactModal('funding')" class="contact-item funding">
                <div class="icon-box"><i class="fas fa-globe"></i></div>
                <div class="label-box">
                    <span class="main-label">Global Support</span>
                    <span class="sub-label">${GLOBAL_SUPPORT_CONFIG.supportLabel}</span>
                </div>
            </a>
            <div id="fundingPanel" class="funding-panel" hidden>
                <span class="funding-kicker">${GLOBAL_SUPPORT_CONFIG.supportKicker}</span>
                <h3>${GLOBAL_SUPPORT_CONFIG.supportTitle}</h3>
                <p class="funding-copy">${GLOBAL_SUPPORT_CONFIG.supportCopy}</p>
                <div class="funding-actions">
                    <button type="button" class="funding-btn funding-btn-primary" onclick="emailForSupportDetails()">${GLOBAL_SUPPORT_CONFIG.primaryLabel}</button>
                    <button type="button" class="funding-btn" onclick="copyFundingWireTemplate()">COPY_BANK_DETAILS</button>
                </div>
                <div class="funding-meta">${GLOBAL_SUPPORT_CONFIG.supportMetaPrefix}: ${currencies}</div>
                <div class="funding-terminal">
                    <div class="funding-terminal-bar">
                        <span class="funding-dot red"></span>
                        <span class="funding-dot amber"></span>
                        <span class="funding-dot green"></span>
                        <span class="funding-terminal-title">bank://global-support</span>
                    </div>
                    <div class="funding-terminal-body">
                        <div class="funding-terminal-line is-intro"><span>&gt; DIRECT_BANK_SUPPORT = ACTIVE</span></div>
                        <div class="funding-terminal-line"><span class="funding-terminal-label">Beneficiary</span><span class="funding-terminal-value">${GLOBAL_SUPPORT_CONFIG.beneficiary}</span></div>
                        <div class="funding-terminal-line"><span class="funding-terminal-label">Bank</span><span class="funding-terminal-value">${GLOBAL_SUPPORT_CONFIG.bankName}</span></div>
                        <div class="funding-terminal-line"><span class="funding-terminal-label">Routing / ABA</span><span class="funding-terminal-value">${GLOBAL_SUPPORT_CONFIG.routingNumber}</span></div>
                        <div class="funding-terminal-line"><span class="funding-terminal-label">Account Number</span><span class="funding-terminal-value">${GLOBAL_SUPPORT_CONFIG.accountNumber}</span></div>
                        <div class="funding-terminal-line"><span class="funding-terminal-label">Account Type</span><span class="funding-terminal-value">${GLOBAL_SUPPORT_CONFIG.accountType}</span></div>
                        <div class="funding-terminal-line"><span class="funding-terminal-label">Swift / Bic</span><span class="funding-terminal-value">${GLOBAL_SUPPORT_CONFIG.swiftCode}</span></div>
                        <div class="funding-terminal-line"><span class="funding-terminal-label">Reference</span><span class="funding-terminal-value">${GLOBAL_SUPPORT_CONFIG.reference}</span></div>
                        <div class="funding-terminal-note">${GLOBAL_SUPPORT_CONFIG.note}</div>
                    </div>
                </div>
            </div>
        `;
    }

    function enhanceContactModal() {
        injectFundingStyles();
        const modal = document.getElementById('contactModal');
        if (!modal) {
            return;
        }

        const content = modal.querySelector('.modal-content');
        const grid = modal.querySelector('.contact-grid');
        if (!content || !grid || modal.dataset.fundingEnhanced === 'true') {
            return;
        }

        content.style.maxWidth = '560px';
        grid.insertAdjacentHTML('beforeend', buildFundingMarkup());
        modal.dataset.fundingEnhanced = 'true';
    }

    function getFundingPanel() {
        return document.getElementById('fundingPanel');
    }

    function setFundingVisibility(visible) {
        const panel = getFundingPanel();
        if (!panel) {
            return;
        }
        panel.hidden = !visible;
    }

    function buildFundingWireTemplate() {
        return [
            'GLOBAL SUPPORT // BANK TRANSFER DETAILS',
            `Beneficiary: ${GLOBAL_SUPPORT_CONFIG.beneficiary}`,
            `Bank: ${GLOBAL_SUPPORT_CONFIG.bankName}`,
            `Routing / ABA: ${GLOBAL_SUPPORT_CONFIG.routingNumber}`,
            `Account Number: ${GLOBAL_SUPPORT_CONFIG.accountNumber}`,
            `Account Type: ${GLOBAL_SUPPORT_CONFIG.accountType}`,
            `Swift / BIC: ${GLOBAL_SUPPORT_CONFIG.swiftCode}`,
            `Reference: ${GLOBAL_SUPPORT_CONFIG.reference}`,
            `Accepted: ${GLOBAL_SUPPORT_CONFIG.acceptedCurrencies.join(' / ')}`,
            `Note: ${GLOBAL_SUPPORT_CONFIG.note}`
        ].join('\n');
    }

    const originalOpenContactModal = typeof window.openContactModal === 'function'
        ? window.openContactModal.bind(window)
        : function () {
            const modal = document.getElementById('contactModal');
            if (modal) {
                modal.style.display = 'block';
            }
        };

    const originalCloseContactModal = typeof window.closeContactModal === 'function'
        ? window.closeContactModal.bind(window)
        : function () {
            const modal = document.getElementById('contactModal');
            if (modal) {
                modal.style.display = 'none';
            }
        };

    window.openContactModal = function (mode) {
        originalOpenContactModal();
        setFundingVisibility(mode === 'funding');
    };

    window.closeContactModal = function () {
        setFundingVisibility(false);
        originalCloseContactModal();
    };

    window.emailForSupportDetails = function () {
        const subject = encodeURIComponent('Sponsorship/Donation Inquiry');
        window.location.href = `mailto:vordzorgbeoscar02@gmail.com?subject=${subject}`;
    };

    window.copyFundingWireTemplate = async function () {
        const payload = buildFundingWireTemplate();
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(payload);
                window.alert('Bank details copied.');
                return;
            }
        } catch {
            // Fall through to prompt.
        }

        window.prompt('Copy the bank details below:', payload);
    };

    window.showDonateInfo = function () {
        window.openContactModal('funding');
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enhanceContactModal);
    } else {
        enhanceContactModal();
    }
})();