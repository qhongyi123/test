/* =====================================================================
 * FH1 · 本子世界（自由模式）界面逻辑
 * ---------------------------------------------------------------------
 * 前置条件
 *   1. index.html 引入顺序：core → presets → app → fc1-init → fh1-init → story-loader
 *   2. 预置数据：data/fh1-presets/worldviews.json
 *      （由 工具\生成世界观预置.ps1 从 状态栏\content\本子世界\世界观\ 生成，勿手改）
 *   3. 界面骨架由 story-loader.js 按 STORY_MANIFEST 的 headers 生成：
 *        FH1-sub1「世界观概览」 → 本文件 fh1InitOverview()
 *        FH1-sub2「开始剧情」   → 本文件 fh1InitStartPanel()
 *
 * 点「开始自由模式」时依次做三件事
 *   ① 把选中世界观的整套文本写入世界书 uid 54（<本子>…</本子> + <背景设定>…</背景设定>）
 *   ② 调用 applyWorldviewLorebook('hentai','free') 开关本子世界相关条目
 *   ③ 以 <VariableInsert> 投递 setting.mode / setting.worldview 并发送开局指令
 *
 * 世界书写入：优先 Tavern Helper 的 updateWorldbookWith（新 API 家族），
 *             退回 setLorebookEntries（项目既有做法，deprecated 兼容层）。
 * ===================================================================== */

var FH1_PRESETS = null;        // worldviews.json 内容
var FH1_SELECTED = '';         // 当前选中的世界观名（伊菈优待 / 少子化 / 大小之争 …）
var FH1_START_MODE = '';       // '' | 'auto' | 'manual'
var FH1_WORLDVIEW_UID = 54;    // 本子世界「世界观设定」条目 uid

/* ------------------------------ 小工具 ------------------------------ */

function fh1Esc(s) {
    return String(s === undefined || s === null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function fh1GetPreset(name) {
    if (!FH1_PRESETS || !FH1_PRESETS.worldviews) return null;
    return FH1_PRESETS.worldviews[name] || null;
}

function fh1CountItems(preset) {
    if (!preset) return 0;
    var n = 0;
    (preset.segments || []).forEach(function (s) { n += (s.items || []).length; });
    (preset.background || []).forEach(function (g) { n += (g.items || []).length; });
    return n;
}

// 在「本窗口 → 父窗口 → 顶层窗口」里找可用的世界书接口
function fh1WorldbookHost() {
    var cands = [];
    try { cands.push(window); } catch (e) {}
    try { if (window.parent && window.parent !== window) cands.push(window.parent); } catch (e) {}
    try { if (window.top && cands.indexOf(window.top) === -1) cands.push(window.top); } catch (e) {}
    for (var i = 0; i < cands.length; i++) {
        var w = cands[i];
        if (!w) continue;
        try {
            if (w.TavernHelper) return w.TavernHelper;
            if (typeof w.updateWorldbookWith === 'function') return w;
            if (typeof w.setLorebookEntries === 'function') return w;
        } catch (e) {}
    }
    return null;
}

// 定位要写的世界书名：优先角色卡绑定的 primary，退回 LOREBOOK_NAME
function fh1WorldbookName(host) {
    try {
        if (host && typeof host.getCharWorldbookNames === 'function') {
            var c = host.getCharWorldbookNames('current');
            if (c && c.primary) return c.primary;
        }
    } catch (e) {}
    try {
        if (typeof LOREBOOK_NAME !== 'undefined' && LOREBOOK_NAME) return LOREBOOK_NAME;
    } catch (e) {}
    return '千叶的睡前小故事';
}

// 写单条世界书条目（只改 content，不碰其它字段）
async function fh1WriteWorldbookEntry(uid, content) {
    var host = fh1WorldbookHost();
    if (!host) {
        return { ok: false, msg: '没找到世界书接口（Tavern Helper / 兼容脚本不可用）' };
    }
    var name = fh1WorldbookName(host);

    // ① 新 API 家族：updateWorldbookWith（收/返数组）
    if (typeof host.updateWorldbookWith === 'function') {
        try {
            await host.updateWorldbookWith(name, function (wb) {
                var arr = Array.isArray(wb) ? wb : [];
                var hit = false;
                var out = arr.map(function (e) {
                    if (String(e && e.uid) === String(uid)) {
                        hit = true;
                        var copy = {};
                        for (var k in e) { if (Object.prototype.hasOwnProperty.call(e, k)) copy[k] = e[k]; }
                        copy.content = content;
                        return copy;
                    }
                    return e;
                });
                if (!hit) throw new Error('世界书里没有 uid ' + uid);
                return out;
            }, { render: 'debounced' });
            return { ok: true, msg: 'updateWorldbookWith' };
        } catch (e) {
            console.warn('FH1: updateWorldbookWith 写入失败，尝试旧接口', e);
        }
    }

    // ② 旧接口：setLorebookEntries
    if (typeof host.setLorebookEntries === 'function') {
        try {
            await host.setLorebookEntries(name, [{ uid: uid, content: content }]);
            return { ok: true, msg: 'setLorebookEntries' };
        } catch (e) {
            return { ok: false, msg: 'setLorebookEntries 抛错：' + ((e && e.message) || e) };
        }
    }

    return { ok: false, msg: '可用接口不支持写入条目 content' };
}

/* ------------------------- 预置数据加载 ------------------------- */

window.loadFh1Presets = async function () {
    if (FH1_PRESETS) return FH1_PRESETS;
    try {
        var res = await fetch('data/fh1-presets/worldviews.json');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        FH1_PRESETS = await res.json();
    } catch (e) {
        console.warn('FH1: 世界观预置加载失败', e);
        FH1_PRESETS = null;
    }
    return FH1_PRESETS;
};

/* --------------------- sub1：世界观概览 --------------------- */

window.fh1InitOverview = function () {
    var grid = document.getElementById('fh1-wv-grid');
    if (!grid) return;

    var render = function () {
        if (!FH1_PRESETS || !FH1_PRESETS.order || !FH1_PRESETS.order.length) {
            grid.innerHTML = '<div class="fh1-hint">世界观数据加载失败：请确认 <code>data/fh1-presets/worldviews.json</code> 可访问（改完记得 Ctrl+Shift+R 强刷）</div>';
            return;
        }
        grid.innerHTML = FH1_PRESETS.order.map(function (n) {
            var p = fh1GetPreset(n) || {};
            return '<div class="fh1-wv-card' + (n === FH1_SELECTED ? ' active' : '') + '" data-wv="' + fh1Esc(n) + '" onclick="fh1SelectWorldview(this.getAttribute(\'data-wv\'))">' +
                '<div class="fh1-wv-name">' + fh1Esc(n) + '</div>' +
                '<div class="fh1-wv-era">' + fh1Esc(p.era || '') + '</div>' +
                '<div class="fh1-wv-count">' + fh1CountItems(p) + ' 条设定</div>' +
                '</div>';
        }).join('');
        if (FH1_SELECTED) fh1SelectWorldview(FH1_SELECTED);
    };

    if (FH1_PRESETS) {
        render();
    } else {
        grid.innerHTML = '<div class="fh1-hint">正在加载世界观…</div>';
        loadFh1Presets().then(render);
    }
};

window.fh1SelectWorldview = function (name) {
    if (!name) return;
    FH1_SELECTED = name;

    var grid = document.getElementById('fh1-wv-grid');
    if (grid) {
        grid.querySelectorAll('.fh1-wv-card').forEach(function (el) {
            el.classList.toggle('active', el.getAttribute('data-wv') === name);
        });
    }

    var p = fh1GetPreset(name);
    var pre = document.getElementById('fh1-wv-preview');
    if (pre) {
        pre.textContent = p ? p.assembled : '（未找到「' + name + '」的数据）';
        pre.scrollTop = 0;
    }
    var btn = document.getElementById('fh1-continue-btn');
    if (btn) btn.style.display = p ? '' : 'none';
};

/* --------------------- sub2：开始剧情 --------------------- */

window.fh1InitStartPanel = function () {
    var sum = document.getElementById('fh1-start-summary');
    var p = fh1GetPreset(FH1_SELECTED);
    if (sum) {
        if (FH1_SELECTED && p) {
            sum.innerHTML = '<div class="fh1-hint">已选世界观：<b>' + fh1Esc(FH1_SELECTED) + '</b>｜' +
                fh1CountItems(p) + ' 条设定（' + p.assembled.length + ' 字）将在开始时写入世界书 uid ' + FH1_WORLDVIEW_UID + '</div>';
        } else {
            sum.innerHTML = '<div class="fh1-hint">还没有选择世界观：请回到「世界观概览」选一套</div>';
        }
    }
    fh1SelectStartMode(FH1_START_MODE || '');
};

window.fh1SelectStartMode = function (mode) {
    FH1_START_MODE = mode || '';
    var autoBtn = document.getElementById('fh1-start-auto-btn');
    var manBtn = document.getElementById('fh1-start-manual-btn');
    var autoPanel = document.getElementById('fh1-start-auto-panel');
    var manPanel = document.getElementById('fh1-start-manual-panel');
    if (autoBtn) autoBtn.classList.toggle('active', mode === 'auto');
    if (manBtn) manBtn.classList.toggle('active', mode === 'manual');
    if (autoPanel) autoPanel.style.display = (mode === 'auto') ? '' : 'none';
    if (manPanel) manPanel.style.display = (mode === 'manual') ? '' : 'none';

    if (mode === 'auto') {
        var pre = document.getElementById('fh1-start-preview');
        if (pre) pre.textContent = fh1BuildAutoPrompt(fh1GetPreset(FH1_SELECTED));
    }
};

window.fh1BuildAutoPrompt = function (preset) {
    if (!preset) return '';
    return '【自由模式 · 本子世界｜世界观：' + preset.name + '】\n' +
        '请依据世界书中的世界观设定开场：先自然交代时间、地点与我的身份，随后进入场景。\n' +
        '不要把设定条目当成说明文复述出来，让设定随情节自然流露。';
};

// 收集开局变量（自由模式：剔除剧本专用的 write / 剧情线）
window.fh1CollectVars = function () {
    var v = {};
    try {
        if (typeof tabsDataMap !== 'undefined' && tabsDataMap['FH1']) {
            v = JSON.parse(JSON.stringify(tabsDataMap['FH1'].data.variable || {}));
        }
    } catch (e) { v = {}; }
    v.setting = v.setting || {};
    v.setting.mode = (typeof __currentMode !== 'undefined' && __currentMode) ? __currentMode : 'free';
    v.setting.worldview = 'hentai';
    delete v.write;
    delete v['剧情线'];
    if (v['背景信息'] && v['背景信息']['地区'] && Object.keys(v['背景信息']['地区']).length === 0) {
        delete v['背景信息'];
    }
    return v;
};

window.fh1StartGame = async function () {
    if (!FH1_SELECTED) { showCustomAlert('请先在「世界观概览」里选择一套世界观'); return; }
    var preset = fh1GetPreset(FH1_SELECTED);
    if (!preset) { showCustomAlert('世界观数据没加载好，请强刷（Ctrl+Shift+R）后重试'); return; }
    if (!FH1_START_MODE) { showCustomAlert('请先选择开局方式：方式一（自动生成开场白）或方式二（自定义开局）'); return; }

    var prompt = '';
    if (FH1_START_MODE === 'auto') {
        prompt = fh1BuildAutoPrompt(preset);
    } else {
        var ta = document.getElementById('fh1-start-manual-text');
        prompt = ta ? String(ta.value || '') : '';
    }
    prompt = prompt.trim();
    if (!prompt) { showCustomAlert('开局内容为空：请在方式二里填写，或改用方式一'); return; }

    // ① 写入世界书
    var res = await fh1WriteWorldbookEntry(FH1_WORLDVIEW_UID, preset.assembled);
    if (!res.ok) {
        showCustomAlert('世界观写入世界书失败：' + res.msg + '\n（请确认本环境加载了 Tavern Helper 或兼容脚本）');
        return;
    }

    // ② 开关本子世界相关条目（六槽 + 自由模式变量规则/思维链）
    try {
        if (typeof applyWorldviewLorebook === 'function') { await applyWorldviewLorebook('hentai', 'free'); }
    } catch (e) { console.warn('FH1: applyWorldviewLorebook 失败', e); }

    // ③ 确认并投递开局指令
    var agree = await showCustomConfirm('将以「' + preset.name + '」的世界观开始自由模式，并发送开局指令吗？');
    if (!agree) return;

    var v = fh1CollectVars();
    triggerSTSlashSend(prompt, v);
};
