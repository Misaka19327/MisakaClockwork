(function () {
    var requests = new Map;
    var activeRequest = null;
    var metadataBase = null;

    function remember(data, sourceUrl) {
        if (!data) return;

        if (sourceUrl) rememberMetadataBase(sourceUrl);

        (data instanceof Array ? data : [data]).forEach(function (request) {
            if (!request || !request.id) return;

            requests.set(request.id, request);
            activeRequest = request;
        });

        render();
    }

    function rememberMetadataBase(sourceUrl) {
        try {
            var url = new URL(sourceUrl, window.location.href);
            var marker = '/__clockwork/';
            var index = url.pathname.indexOf(marker);

            if (index !== -1) {
                metadataBase = url.origin + url.pathname.slice(0, index + marker.length);
            }
        } catch (e) {
        }
    }

    function requestFromHash() {
        var hash = window.location.hash ? window.location.hash.slice(1) : null;
        var match = hash ? hash.match(/[0-9]+-[0-9]+(?:-[0-9]+)?/) : null;
        var id = match ? match[0] : hash;

        return id && requests.get(id) ? requests.get(id) : activeRequest;
    }

    function ensureBadge() {
        var badge = document.querySelector('[data-clockwork-uuid-badge]');

        if (badge) return badge;

        var style = document.createElement('style');
        style.textContent = [
            '.clockwork-uuid-badge{position:fixed;right:16px;top:12px;z-index:2147483647;display:none;max-width:min(520px,calc(100vw - 32px));align-items:center;gap:8px;padding:7px 10px;border:1px solid rgba(148,163,184,.38);border-radius:6px;background:rgba(15,23,42,.88);color:#f8fafc;box-shadow:0 10px 24px rgba(15,23,42,.18);font:12px/1.35 ui-monospace,SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace;letter-spacing:0;backdrop-filter:saturate(140%) blur(8px)}',
            '.clockwork-uuid-badge strong{font:600 11px/1.35 system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#a7f3d0;text-transform:uppercase;letter-spacing:.04em}',
            '.clockwork-uuid-badge code{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#f8fafc}',
            '.clockwork-uuid-badge button{width:24px;height:24px;border:0;border-radius:5px;background:rgba(255,255,255,.1);color:#f8fafc;cursor:pointer;font:700 11px/1 system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}',
            '.clockwork-uuid-badge button:hover{background:rgba(255,255,255,.18)}'
        ].join('');
        document.head.appendChild(style);

        badge = document.createElement('div');
        badge.className = 'clockwork-uuid-badge';
        badge.setAttribute('data-clockwork-uuid-badge', '');
        badge.innerHTML = '<strong>UUID</strong><code></code><button type="button" data-action="details" title="Open event details" aria-label="Open event details">i</button><button type="button" data-action="copy" title="Copy UUID" aria-label="Copy UUID">C</button>';
        badge.querySelector('[data-action="copy"]').addEventListener('click', function () {
            var uuid = badge.querySelector('code').textContent;

            if (navigator.clipboard) navigator.clipboard.writeText(uuid);
        });
        badge.querySelector('[data-action="details"]').addEventListener('click', function () {
            var uuid = badge.querySelector('code').textContent;
            var base = metadataBase || new URL('/__clockwork/', window.location.href).toString();

            window.open(base + 'uuid/' + uuid + '/details', '_blank', 'noopener');
        });
        document.body.appendChild(badge);

        return badge;
    }

    function render() {
        if (!document.body) return;

        var request = requestFromHash();
        var badge = ensureBadge();

        if (!request || !request.uuid) {
            badge.style.display = 'none';
            return;
        }

        badge.querySelector('code').textContent = request.uuid;
        badge.style.display = 'flex';
    }

    if (window.fetch) {
        var originalFetch = window.fetch;

        window.fetch = function () {
            return originalFetch.apply(this, arguments).then(function (response) {
                try {
                    var url = new URL(response.url);

                    if (url.pathname.indexOf('/__clockwork/') !== -1 && url.pathname.indexOf('/assets/') === -1) {
                        response.clone().json().then(function (data) {
                            remember(data, response.url);
                        }).catch(function () {
                        });
                    }
                } catch (e) {
                }

                return response;
            });
        };
    }

    if (window.XMLHttpRequest) {
        var OriginalXhr = window.XMLHttpRequest;

        var PatchedXhr = function () {
            var xhr = new OriginalXhr();
            var requestUrl = null;
            var originalOpen = xhr.open;

            xhr.open = function (method, url) {
                requestUrl = url;
                return originalOpen.apply(xhr, arguments);
            };
            xhr.addEventListener('load', function () {
                try {
                    var responseUrl = xhr.responseURL || requestUrl;
                    var url = new URL(responseUrl, window.location.href);

                    if (url.pathname.indexOf('/__clockwork/') === -1 || url.pathname.indexOf('/assets/') !== -1) return;
                    if (url.pathname.indexOf('/uuid/') !== -1) return;

                    remember(JSON.parse(xhr.responseText), responseUrl);
                } catch (e) {
                }
            });

            return xhr;
        };

        PatchedXhr.prototype = OriginalXhr.prototype;
        ['UNSENT', 'OPENED', 'HEADERS_RECEIVED', 'LOADING', 'DONE'].forEach(function (key) {
            PatchedXhr[key] = OriginalXhr[key];
        });
        window.XMLHttpRequest = PatchedXhr;
    }

    window.addEventListener('hashchange', render);
    document.addEventListener('DOMContentLoaded', render);
})();
