// ==UserScript==
// @name         精简B站顶栏+批量导出合集视频链接
// @namespace    https://github.com/MagicKong21/bilibili-utilities
// @version      0.0.2
// @author       Hugo
// @description  哔哩哔哩顶栏精简 + 增加一键导出合集链接功能
// @match        *://*.bilibili.com/*
// @match        *://*.acfun.cn/*
// @grant        GM_addStyle
// @grant        GM_download
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // =====================
    // Part 1: Header Simplify (Bilibili only)
    // =====================

    const HeaderSimplifier = {
        init() {
            if (!this.isBilibili()) return;
            this.addStyles();
            this.processHeader();
            this.setupObservers();
        },

        isBilibili() {
            return location.hostname.includes('bilibili.com');
        },

        addStyles() {
            GM_addStyle(`
                /* ===== Hide left redundant nav ===== */
                .left-entry a[href*="anime"],
                .left-entry a[href*="anime/"],
                .left-entry a[href="//live.bilibili.com"],
                .left-entry a[href*="live.bilibili.com"]:not([href*="space"]),
                .left-entry a[href*="game.bilibili.com"],
                .left-entry a[href*="show.bilibili.com"],
                .left-entry a[href*="manga.bilibili.com"],
                .left-entry a[href*="match"],
                .left-entry .loc-entry,
                .left-entry .left-loc-entry,
                .left-entry .download-entry,
                .left-entry a[href*="app.bilibili.com"] {
                    display: none !important;
                }

                .left-entry .v-popover-wrap:not(:first-child) {
                    display: none !important;
                }

                /* ===== Hide right redundant buttons ===== */
                .right-entry a[href*="account.bilibili.com/big"],
                .right-entry .right-entry--vip,
                .vip-wrap,
                .right-entry a[href*="member.bilibili.com/platform/home"],
                .right-entry-item:has(a[href*="member.bilibili.com/platform/home"]),
                .right-entry-item--upload,
                .header-upload-entry,
                a[data-idx="upload"] {
                    display: none !important;
                }

                .right-entry .v-popover-wrap:has(a[href*="account.bilibili.com/big"]),
                .right-entry .v-popover-wrap:has(.right-entry--vip),
                .right-entry .v-popover-wrap:has(a[href*="member.bilibili.com/platform/home"]) {
                    display: none !important;
                }

                /* ===== Unified header layout ===== */
                .bili-header__bar,
                .bili-header__bar.mini-header {
                    justify-content: center !important;
                    gap: 16px !important;
                    overflow: visible !important;
                }

                .bili-header__bar .left-entry,
                .bili-header__bar .right-entry {
                    flex: 0 0 auto !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 10px !important;
                    margin: 0 8px !important;
                    overflow: visible !important;
                    z-index: 10 !important;
                }

                .bili-header__bar .center-search-container {
                    flex: 0 0 auto !important;
                    margin: 0 16px !important;
                }

                .bili-header__bar .center-search__bar {
                    min-width: 320px !important;
                    max-width: 520px !important;
                }

                .bili-header__bar .left-entry a.entry-title,
                .bili-header__bar .left-entry a.left-entry__title {
                    display: flex !important;
                }

                /* ===== Avatar hover behavior - show big avatar on hover ===== */
                .bili-header__bar .right-entry .header-avatar-wrap--container {
                    display: block !important;
                }

                .header-avatar-wrap--container:hover .q-avatar--normal,
                .header-avatar-wrap--container:hover .bili-header-avatar-img:not([style*="width: 82px"]) {
                    opacity: 0 !important;
                    visibility: hidden !important;
                }

                .bili-avatar[style*="width: 82px"],
                .bili-avatar[style*="width:82px"] {
                    display: block !important;
                    margin: 0 auto !important;
                }

                /* ===== Fix avatar popover alignment ===== */
                .header-avatar-wrap .v-popover-content {
                    left: 50% !important;
                    transform: translateX(-50%) !important;
                }

                /* ===== Export button styles ===== */
                .video-exporter-btn {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    z-index: 999999;
                    padding: 10px 14px;
                    background: #00a1d6;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                    box-shadow: 0 2px 6px rgba(0,0,0,.2);
                    transition: all 0.3s ease;
                }

                .video-exporter-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,.3);
                }
            `);
        },

        processHeader() {
            try {
                const leftEntry = document.querySelector('.left-entry');
                if (leftEntry) {
                    const leftItems = leftEntry.querySelectorAll('.v-popover-wrap, > li');
                    leftItems.forEach((item, index) => {
                        const link = item.querySelector('a');
                        if (!link) {
                            item.style.display = 'none';
                            return;
                        }

                        const href = link.getAttribute('href') || '';
                        const text = link.textContent || '';

                        const isHome = href === '//www.bilibili.com' ||
                                       href === 'https://www.bilibili.com' ||
                                       href === '/' ||
                                       text.includes('首页');

                        if (!isHome) {
                            item.style.display = 'none';
                        } else {
                            item.style.display = 'flex';
                            item.style.opacity = '1';
                            item.style.visibility = 'visible';
                        }
                    });
                }

                const rightItems = document.querySelectorAll('.right-entry .v-popover-wrap, .right-entry .right-entry-item');
                rightItems.forEach(item => {
                    const link = item.querySelector('a');
                    if (!link) return;

                    const href = link.getAttribute('href') || '';
                    const text = link.textContent || '';

                    const shouldHide =
                        href.includes('account.bilibili.com/big') ||
                        href.includes('member.bilibili.com/platform/home') ||
                        text.includes('大会员') ||
                        text.includes('创作中心') ||
                        item.classList.contains('right-entry-item--upload');

                    if (shouldHide) {
                        item.style.display = 'none';
                    }
                });

                document.querySelectorAll('.header-upload-entry, .right-entry-item--upload').forEach(el => {
                    el.style.display = 'none';
                });

                const avatarWrap = document.querySelector('.header-avatar-wrap');
                if (avatarWrap) {
                    avatarWrap.style.height = '';
                    avatarWrap.style.display = '';
                    avatarWrap.style.alignItems = '';

                    const avatarContainer = avatarWrap.querySelector('.header-avatar-wrap--container');
                    if (avatarContainer) {
                        avatarContainer.style.height = '';
                        avatarContainer.style.display = '';
                        avatarContainer.style.alignItems = '';
                    }
                }

                // Reorder buttons: move message to right of history (only once)
                if (!this.buttonsReordered) {
                    const rightEntry = document.querySelector('.right-entry');
                    if (rightEntry) {
                        const messageLi = rightEntry.querySelector('.right-entry--message');
                        const historyLink = rightEntry.querySelector('a[href*="history"]');
                        const historyLi = historyLink ? historyLink.closest('li') : null;

                        if (messageLi && historyLi) {
                            const nextSibling = historyLi.nextElementSibling;
                            if (nextSibling !== messageLi) {
                                historyLi.parentNode.insertBefore(messageLi, nextSibling);
                            }
                            this.buttonsReordered = true;
                        }
                    }
                }

            } catch (e) {
                // Ignore errors
            }
        },

        setupObservers() {
            const observer = new MutationObserver(() => {
                this.processHeader();
            });

            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        }
    };

    // =====================
    // Part 2: Video Collection Exporter
    // =====================

    const ExporterConfig = {
        acfun: {
            name: 'AcFun',
            color: '#ff5c5c',
            apiUrls: [
                'https://www.acfun.cn/rest/pc-direct/arubamu/content/list',
                'https://api-new.acfunchina.com/rest/pc-direct/arubamu/content/list'
            ]
        },
        bilibili: {
            name: 'Bilibili',
            color: '#00a1d6',
            apiUrl: 'https://api.bilibili.com/x/polymer/web-space/seasons_archives_list'
        }
    };

    const ExporterUtils = {
        cleanFilename(text, maxLength = 50) {
            return (text || '')
                .replace(/[<>:"/\\|?*]/g, '')
                .replace(/\s+/g, ' ')
                .replace(/[《》]/g, '')
                .trim()
                .substring(0, maxLength);
        },

        safeDownload(filename, content) {
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });

            if (typeof GM_download === 'function') {
                try {
                    const url = URL.createObjectURL(blob);
                    GM_download({
                        url: url,
                        name: filename,
                        saveAs: true,
                        onload: () => URL.revokeObjectURL(url)
                    });
                    return true;
                } catch (e) {
                    console.warn('GM_download failed:', e);
                }
            }

            try {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                setTimeout(() => {
                    link.remove();
                    URL.revokeObjectURL(url);
                }, 100);
                return true;
            } catch (e) {
                console.warn('Link download failed:', e);
                return false;
            }
        }
    };

    function detectSite() {
        return location.hostname.includes('acfun.cn') ? 'acfun' :
               location.hostname.includes('bilibili.com') ? 'bilibili' : null;
    }

    function isCollectionPage(site) {
        if (!site) return false;

        if (site === 'acfun') {
            return /\/a\/(aa\d+)/.test(location.pathname);
        }

        if (site === 'bilibili') {
            return /\/\d+\/(?:lists|channel|collection|series)\/\d+/.test(location.href);
        }

        return false;
    }

    const ExporterUI = {
        btn: null,
        site: null,

        init() {
            this.site = detectSite();
            if (!this.site) return;

            this.createButton();
            this.setupObservers();
            this.updateButtonVisibility();
        },

        createButton() {
            document.querySelector('.video-exporter-btn')?.remove();

            const btn = document.createElement('button');
            btn.className = 'video-exporter-btn';
            btn.textContent = '批量导出视频链接';
            btn.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 999999;
                padding: 10px 14px;
                background: ${ExporterConfig[this.site].color};
                color: #fff;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                box-shadow: 0 2px 6px rgba(0,0,0,.2);
                transition: all 0.3s ease;
            `;

            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'translateY(-2px)';
                btn.style.boxShadow = '0 4px 12px rgba(0,0,0,.3)';
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = '0 2px 6px rgba(0,0,0,.2)';
            });

            btn.onclick = handleExport;
            if (document.body) {
                document.body.appendChild(btn);
            } else {
                document.addEventListener('DOMContentLoaded', () => document.body.appendChild(btn));
            }
            this.btn = btn;
        },

        updateButtonVisibility() {
            if (!this.btn) return;

            const shouldShow = isCollectionPage(this.site);

            if (shouldShow) {
                this.btn.style.display = 'block';
                this.btn.disabled = false;
            } else {
                this.btn.style.display = 'none';
                this.btn.disabled = true;
            }
        },

        setupObservers() {
            let lastUrl = location.href;
            setInterval(() => {
                if (location.href !== lastUrl) {
                    lastUrl = location.href;
                    console.log('URL changed to:', lastUrl);
                    this.updateButtonVisibility();
                }
            }, 500);

            if (this.site === 'bilibili') {
                window.addEventListener('popstate', () => {
                    setTimeout(() => this.updateButtonVisibility(), 300);
                });

                const originalPushState = history.pushState;
                const originalReplaceState = history.replaceState;

                history.pushState = function(...args) {
                    originalPushState.apply(this, args);
                    setTimeout(() => ExporterUI.updateButtonVisibility(), 300);
                };

                history.replaceState = function(...args) {
                    originalReplaceState.apply(this, args);
                    setTimeout(() => ExporterUI.updateButtonVisibility(), 300);
                };
            }
        },

        setLoading(loading) {
            if (!this.btn) return;
            this.btn.disabled = loading;
            this.btn.textContent = loading ? '获取中...' : '批量导出视频链接';
        }
    };

    const DataFetcher = {
        async fetchAcFun(albumId) {
            const links = [];
            let page = 1;

            while (true) {
                const params = new URLSearchParams({
                    page: page.toString(),
                    size: '30',
                    arubamuId: albumId
                });

                let data = null;
                for (const apiUrl of ExporterConfig.acfun.apiUrls) {
                    try {
                        const response = await fetch(`${apiUrl}?${params}`, {
                            headers: { 'accept': 'application/json', 'referer': location.origin }
                        });

                        if (response.ok) {
                            const json = await response.json();
                            const list = json?.data?.contents || json?.contents || [];

                            if (list.length === 0) return links;

                            list.forEach(item => {
                                let resourceId = item.resourceId || item.contentId;
                                if (resourceId) {
                                    const cleanId = String(resourceId).replace(/^ac/, '');
                                    links.push(`https://www.acfun.cn/v/ac${cleanId}`);
                                }
                            });

                            data = json;
                            break;
                        }
                    } catch (e) {
                        console.warn(`API ${apiUrl} failed:`, e);
                    }
                }

                if (!data) break;
                if (page > 100) break;
                page++;
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            return [...new Set(links)];
        },

        async fetchBilibili(mid, seasonId) {
            const links = [];
            let page = 1;
            const pageSize = 30;

            while (true) {
                const params = new URLSearchParams({
                    mid, season_id: seasonId,
                    sort_reverse: 'false',
                    page_size: pageSize.toString(),
                    page_num: page.toString(),
                    web_location: '333.1387'
                });

                try {
                    const response = await fetch(`${ExporterConfig.bilibili.apiUrl}?${params}`, {
                        headers: { 'accept': 'application/json', 'referer': location.origin }
                    });

                    if (!response.ok) break;

                    const json = await response.json();
                    if (json.code !== 0) break;

                    const archives = json.data?.archives || [];
                    const pageInfo = json.data?.page;

                    archives.forEach(item => {
                        if (item.bvid) {
                            links.push(`https://www.bilibili.com/video/${item.bvid}`);
                        } else if (item.aid) {
                            links.push(`https://www.bilibili.com/video/av${item.aid}`);
                        }
                    });

                    if (!pageInfo || page * pageSize >= pageInfo.total) break;
                    if (page > 100) break;

                    page++;
                    await new Promise(resolve => setTimeout(resolve, 300));
                } catch (e) {
                    console.error('Bilibili fetch error:', e);
                    break;
                }
            }

            return [...new Set(links)];
        }
    };

    const InfoExtractor = {
        getCollectionInfo(site) {
            if (site === 'acfun') {
                const match = location.pathname.match(/aa(\d+)/);
                return match ? { id: match[1] } : null;
            }

            if (site === 'bilibili') {
                const match = location.href.match(/(\d+)\/(?:lists|channel|collection|series)\/(\d+)/);
                return match ? { mid: match[1], seasonId: match[2] } : null;
            }

            return null;
        },

        getTitle(site) {
            const selectors = {
                acfun: ['.album-title', '.title', 'h1'],
                bilibili: ['.album-title', '.title', '.channel-name', 'h1']
            };

            for (const selector of selectors[site] || []) {
                const el = document.querySelector(selector);
                if (el?.textContent?.trim()) {
                    return ExporterUtils.cleanFilename(el.textContent.trim());
                }
            }

            return ExporterUtils.cleanFilename(document.title);
        }
    };

    async function handleExport() {
        const site = ExporterUI.site;

        if (!isCollectionPage(site)) {
            console.error('请在合辑页面使用此功能');
            return;
        }

        ExporterUI.setLoading(true);

        try {
            const info = InfoExtractor.getCollectionInfo(site);
            if (!info) {
                console.error('无法识别合辑信息');
                return;
            }

            let links = [];
            if (site === 'acfun') {
                links = await DataFetcher.fetchAcFun(info.id);
            } else if (site === 'bilibili') {
                links = await DataFetcher.fetchBilibili(info.mid, info.seasonId);
            }

            if (links.length === 0) {
                console.error('未找到任何视频链接');
                return;
            }

            const title = InfoExtractor.getTitle(site);
            const filename = [
                site,
                'collection',
                site === 'acfun' ? info.id : `${info.mid}_${info.seasonId}`,
                title,
                `（共 ${links.length} 期）.txt`
            ].filter(Boolean).join('_');

            const content = links.join('\n');

            ExporterUtils.safeDownload(filename, content);

        } catch (error) {
            console.error('Export error:', error);
        } finally {
            ExporterUI.setLoading(false);
        }
    }

    // =====================
    // Initialization
    // =====================

    function init() {
        HeaderSimplifier.init();
        ExporterUI.init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Multiple retries for header simplification
    setTimeout(init, 0);
    setTimeout(init, 500);
    setTimeout(init, 1000);
    setTimeout(init, 2000);

})();
