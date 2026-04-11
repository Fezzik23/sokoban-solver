(function () {
    const adsConfig = {
        client: '',
        slots: {
            solverBanner: '',
            gameSidebar: '',
        },
    };

    const slots = Array.from(document.querySelectorAll('.ad-slot'));
    const previewEnabled = new URLSearchParams(window.location.search).get('ads-preview') === '1';
    const hasClient = typeof adsConfig.client === 'string' && adsConfig.client.trim() !== '';

    function getSlotId(slotKey) {
        if (!slotKey || !adsConfig.slots) {
            return '';
        }
        return typeof adsConfig.slots[slotKey] === 'string' ? adsConfig.slots[slotKey].trim() : '';
    }

    function hideSlot(slotElement) {
        const shell = slotElement.closest('.ad-shell');
        if (shell) {
            shell.hidden = true;
        }
    }

    function renderPreview(slotElement) {
        slotElement.classList.add('ad-slot-preview');
        slotElement.innerHTML = `
            <div class="ad-preview-box">
                <strong>Espacio publicitario</strong>
                <span>Activa AdSense para mostrar anuncios reales.</span>
            </div>
        `;
    }

    function injectAd(slotElement, clientId, slotId) {
        slotElement.innerHTML = '';
        const adUnit = document.createElement('ins');
        adUnit.className = 'adsbygoogle';
        adUnit.style.display = 'block';
        adUnit.dataset.adClient = clientId;
        adUnit.dataset.adSlot = slotId;
        adUnit.dataset.adFormat = 'auto';
        adUnit.dataset.fullWidthResponsive = 'true';
        slotElement.appendChild(adUnit);
        (window.adsbygoogle = window.adsbygoogle || []).push({});
    }

    function loadAdSense(clientId) {
        if (document.querySelector('script[data-adsense-loader="true"]')) {
            return;
        }

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
        script.crossOrigin = 'anonymous';
        script.dataset.adsenseLoader = 'true';
        document.head.appendChild(script);
    }

    slots.forEach(slotElement => {
        const slotKey = slotElement.dataset.adSlotKey;
        const slotId = getSlotId(slotKey);

        if (previewEnabled) {
            renderPreview(slotElement);
            return;
        }

        if (!hasClient || !slotId) {
            hideSlot(slotElement);
            return;
        }

        loadAdSense(adsConfig.client.trim());
        injectAd(slotElement, adsConfig.client.trim(), slotId);
    });
}());
