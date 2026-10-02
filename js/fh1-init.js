/* =====================================================================
 * FH1 · 本子世界（自由模式）界面逻辑
 * ---------------------------------------------------------------------
 * 前置条件
 *   1. index.html 引入顺序：core → presets → app → fc1-init → fh1-init → story-loader
 *   2. 预置数据：data/fh1-presets/worldviews.json
 *      （由 工具\生成世界观预置.ps1 从 状态栏\content\本子世界\世界观\ 生成，勿手改）
 *   3. 界面骨架由 story-loader.js 按 STORY_MANIFEST 的 headers 生成（四页）：
 *        FH1-sub1「世界观概览」 → 介绍 + 「进入本子世界」（HTML 在 story-loader）
 *        FH1-sub2「世界观」     → 卡片列表 → 点选后展开（可开编辑模式改／删）
 *        FH1-sub3「特殊规则」   → 占位（待编写）
 *        FH1-sub4「开局选择」   → 占位（待编写）
 *
 * 关键规则
 *   · 编辑结果先落进内存草稿 FH1_DRAFT，**只有点「启用并继续」才写世界书**
 *   · 写入内容＝按骨架重新拼装的整套文本（含玩家的编辑与删除），写入世界书 uid 54
 *   · 点「隐藏」→ 右侧书签（以及本页两个侧边按钮）全隐藏，切换选项卡后恢复
 * ===================================================================== */

var FH1_PRESETS = null;        // worldviews.json 内容
var FH1_SELECTED = '';         // 当前选中的世界观名
var FH1_START_MODE = '';       // '' | 'auto' | 'manual'（开局页将来用）
var FH1_WORLDVIEW_UID = 54;    // 本子世界「世界观设定」条目 uid
var FH1_DRAFT = null;          // 当前世界观的可编辑草稿（含玩家的改与删）
var FH1_EDITING = false;       // 编辑模式开关状态
var FH1_SUBTAB = '';           // 当前 FH1 子页 id（如 FH1-sub2）

/* ------------------------------ 小工具 ------------------------------ */

function fh1Esc(s) {
    return String(s === undefined || s === null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function fh1DeepCopy(o) { return JSON.parse(JSON.stringify(o)); }

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

// 显示用：去掉条目开头的「- 」
function fh1ItemText(line) {
    return String(line === undefined || line === null ? '' : line).replace(/^-\s*/, '');
}

// 写回草稿用：保证条目以「- 」开头
function fh1NormItem(t) {
    var s = String(t === undefined || t === null ? '' : t).trim();
    return s.charAt(0) === '-' ? s : '- ' + s;
}

function fh1IsBlankItem(t) {
    return String(t === undefined || t === null ? '' : t).replace(/^-\s*/, '').trim() === '';
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

/* -------------------- 拼装：草稿 → uid 54 正文 -------------------- */
/* 与 工具\生成世界观预置.ps1 的组装规则逐字一致：
   时代锚点不包裹；世界风格/社会与法治/民俗风情 = --- + 标签：{世界观名} + 条目 + ---；
   背景设定 = # 大标题 + ## 小标题 + 条目。段落之间空一行。 */
function fh1Assemble(d) {
    if (!d) return '';
    var labels = { '世界风格': '风格', '社会与法治': '社会与法治', '民俗风情': '民俗风情' };
    var L = [];
    L.push('<本子>');
    L.push('# 世界观与基调设定');
    L.push('');
    (d.segments || []).forEach(function (s) {
        L.push('## ' + s.key);
        var items = (s.items || []).filter(function (t) { return !fh1IsBlankItem(t); });
        var label = labels[s.key] || null;
        if (items.length) {
            if (label) { L.push('---'); L.push(label + '：' + d.name); }
            items.forEach(function (t) { L.push(fh1NormItem(t)); });
            if (label) { L.push('---'); }
        }
        L.push('');
    });
    L.push('</本子>');
    L.push('');
    L.push('<背景设定>');
    var bgLines = [];
    (d.background || []).forEach(function (g) {
        var items = (g.items || []).filter(function (t) { return !fh1IsBlankItem(t); });
        if (!items.length) return;
        bgLines.push('## ' + g.title);
        items.forEach(function (t) { bgLines.push(fh1NormItem(t)); });
    });
    if (bgLines.length) {
        L.push('# ' + d.name);
        bgLines.forEach(function (l) { L.push(l); });
    }
    L.push('</背景设定>');
    return L.join('\n');
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

// 概览页＝世界介绍 + 「进入本子世界」按钮（HTML 在 story-loader），这里只重置选择状态
window.fh1InitOverview = function () {
    FH1_SELECTED = '';
    FH1_DRAFT = null;
    FH1_EDITING = false;
    FH1_START_MODE = '';
    var chk = document.getElementById('fh1-edit-chk');
    if (chk) chk.checked = false;
};

/* --------------------- sub2：世界观选择 --------------------- */

window.fh1InitWorldviewPage = function () {
    var box = document.getElementById('fh1-wv-list');
    if (!box) return;

    var render = function () {
        if (!FH1_PRESETS || !FH1_PRESETS.order || !FH1_PRESETS.order.length) {
            box.innerHTML = '<div class="fh1-hint">世界观数据加载失败：请确认 <code>data/fh1-presets/worldviews.json</code> 可访问（改完记得 Ctrl+Shift+R 强刷）</div>';
            return;
        }
        if (FH1_SELECTED && FH1_DRAFT) { fh1RenderOpenCard(); fh1SyncSideBookmarks(); return; }
        fh1SyncSideBookmarks();
        box.innerHTML = FH1_PRESETS.order.map(function (n) {
            var p = fh1GetPreset(n) || {};
            return '<div class="fh1-wv-card" data-wv="' + fh1Esc(n) + '" onclick="fh1SelectWorldview(this.getAttribute(\'data-wv\'))">' +
                '<div class="fh1-wv-card-top">' +
                    '<span class="fh1-wv-name">' + fh1Esc(n) + '</span>' +
                    '<span class="fh1-wv-era-tag">' + fh1Esc(p.eraShort || '') + '</span>' +
                '</div>' +
                '<div class="fh1-wv-sum">' + fh1Esc(p.summary || '') + '</div>' +
            '</div>';
        }).join('');
    };

    if (FH1_PRESETS) {
        render();
    } else {
        box.innerHTML = '<div class="fh1-hint">正在加载世界观…</div>';
        loadFh1Presets().then(render);
    }
};

// 选中：进入草稿 + 展开
window.fh1SelectWorldview = function (name) {
    var p = fh1GetPreset(name);
    if (!p) return;
    FH1_SELECTED = name;
    FH1_DRAFT = fh1DeepCopy(p);
    FH1_EDITING = false;
    var chk = document.getElementById('fh1-edit-chk');
    if (chk) chk.checked = false;
    fh1RenderOpenCard();
    fh1SyncSideBookmarks();
};

// 一行条目（编辑模式下带 ✕）
function fh1ItemRow(text, attrs) {
    return '<div class="fh1-wv-item-row"' + (attrs ? ' ' + attrs : '') + '>' +
        '<div class="fh1-wv-item"' + (FH1_EDITING ? ' contenteditable="true"' : '') + '>' + fh1Esc(text) + '</div>' +
        (FH1_EDITING ? '<button class="fh1-item-del" onclick="fh1DeleteItem(this)" title="删去这一项">\u2715</button>' : '') +
    '</div>';
}

window.fh1RenderOpenCard = function () {
    var box = document.getElementById('fh1-wv-list');
    if (!box || !FH1_DRAFT) return;
    var d = FH1_DRAFT;

    var segHTML = (d.segments || []).map(function (s, si) {
        var rows = (s.items || []).map(function (it, ii) {
            return fh1ItemRow(fh1ItemText(it), 'data-kind="seg" data-si="' + si + '" data-ii="' + ii + '"');
        }).join('');
        if (!rows) return '';
        return '<div class="fh1-wv-seg"><div class="fh1-wv-seg-title">' + fh1Esc(s.key) + '</div>' + rows + '</div>';
    }).join('');

    var bgHTML = '';
    (d.background || []).forEach(function (g, gi) {
        var rows = (g.items || []).map(function (it, ii) {
            return fh1ItemRow(fh1ItemText(it), 'data-kind="bg" data-gi="' + gi + '" data-ii="' + ii + '"');
        }).join('');
        if (!rows) return;
        bgHTML += '<div class="fh1-wv-sub">' + fh1Esc(g.title) + '</div>' + rows;
    });
    if (bgHTML) bgHTML = '<div class="fh1-wv-seg"><div class="fh1-wv-seg-title">背景设定</div>' + bgHTML + '</div>';

    box.innerHTML =
        '<div class="fh1-wv-card fh1-wv-card-open' + (FH1_EDITING ? ' fh1-editing' : '') + '">' +
            '<div class="fh1-wv-card-top">' +
                '<span class="fh1-wv-name">' + fh1Esc(d.name) + '</span>' +
                '<span class="fh1-wv-era-tag">' + fh1Esc(d.eraShort || '') + '</span>' +
            '</div>' +
            '<div class="fh1-wv-era-full">' + fh1Esc(d.era || '') + '</div>' +
            '<div class="fh1-wv-sum">' + fh1Esc(d.summary || '') + '</div>' +
            '<div class="fh1-wv-body">' + segHTML + bgHTML + '</div>' +
            '<button class="fh1-apply-btn" onclick="fh1EnableAndContinue()">\u25B6 启用并继续</button>' +
        '</div>';
};

/* ---------------------- 编辑模式（改／删） ---------------------- */

window.fh1ToggleEditMode = function (el) {
    FH1_EDITING = !!(el && el.checked);
    if (!FH1_DRAFT) return;
    if (!FH1_EDITING) { fh1SyncDraftFromDOM(); }
    fh1RenderOpenCard();
};

// 把 DOM 里的文字与结构同步回草稿
window.fh1SyncDraftFromDOM = function () {
    if (!FH1_DRAFT) return;
    var box = document.getElementById('fh1-wv-list');
    if (!box) return;
    var segMap = {}, bgMap = {};
    box.querySelectorAll('.fh1-wv-item-row').forEach(function (row) {
        var txt = row.querySelector('.fh1-wv-item');
        var text = txt ? fh1NormItem(txt.textContent) : '- ';
        if (row.getAttribute('data-kind') === 'seg') {
            var si = parseInt(row.getAttribute('data-si'), 10);
            if (!segMap[si]) segMap[si] = [];
            segMap[si].push(text);
        } else {
            var gi = parseInt(row.getAttribute('data-gi'), 10);
            if (!bgMap[gi]) bgMap[gi] = [];
            bgMap[gi].push(text);
        }
    });
    // 只要有行（哪怕为空）就按行覆盖；段落整体被删空时保留空数组
    Object.keys(segMap).forEach(function (k) {
        if (FH1_DRAFT.segments[k]) FH1_DRAFT.segments[k].items = segMap[k];
    });
    Object.keys(bgMap).forEach(function (k) {
        if (FH1_DRAFT.background[k]) FH1_DRAFT.background[k].items = bgMap[k];
    });
};

// 删去一项（先同步其余编辑，再按索引删）
window.fh1DeleteItem = function (btn) {
    var row = btn && btn.parentElement;
    if (!row || !FH1_DRAFT) return;
    fh1SyncDraftFromDOM();
    var kind = row.getAttribute('data-kind');
    var ii = parseInt(row.getAttribute('data-ii'), 10);
    if (kind === 'seg') {
        var si = parseInt(row.getAttribute('data-si'), 10);
        if (FH1_DRAFT.segments[si]) FH1_DRAFT.segments[si].items.splice(ii, 1);
    } else {
        var gi = parseInt(row.getAttribute('data-gi'), 10);
        if (FH1_DRAFT.background[gi]) FH1_DRAFT.background[gi].items.splice(ii, 1);
    }
    fh1RenderOpenCard();
};

/* ------------------- 重选 / 启用并继续 ------------------- */

window.fh1ReselectWorldview = function () {
    FH1_SELECTED = '';
    FH1_DRAFT = null;
    FH1_EDITING = false;
    var chk = document.getElementById('fh1-edit-chk');
    if (chk) chk.checked = false;
    var box = document.getElementById('fh1-wv-list');
    if (box) box.innerHTML = '';
    fh1InitWorldviewPage();
};

// 只有这个按钮会把当前内容写进世界书（含玩家的编辑与删除）
window.fh1EnableAndContinue = async function () {
    if (!FH1_DRAFT || !FH1_SELECTED) return;
    fh1SyncDraftFromDOM();

    var name = FH1_DRAFT.name;
    var agree = await showCustomConfirm('启用「' + name + '」并把当前内容写入世界书（uid ' + FH1_WORLDVIEW_UID + '）吗？\n（已包含你在编辑模式里的改动与删除）');
    if (!agree) return;

    var text = fh1Assemble(FH1_DRAFT);
    var res = await fh1WriteWorldbookEntry(FH1_WORLDVIEW_UID, text);
    if (!res.ok) {
        showCustomAlert('写入世界书失败：' + res.msg + '\n（请确认本环境加载了 Tavern Helper 或兼容脚本）');
        return;
    }
    console.log('FH1: 世界观已写入 uid ' + FH1_WORLDVIEW_UID + '（' + res.msg + '，' + text.length + ' 字）');

    // 切换选项卡 → 隐藏的书签由 switchSubTab 恢复
    fh1RestoreBookmarks();
    if (typeof goToSubTab === 'function') { goToSubTab('FH1', 'FH1-sub3'); }
};

/* ------------- 右侧书签：目录 / 封面 / 翻页 / 角色 / 隐藏 / 重选 ------------- */
/* 六个书签颜色各不相同（不含「返回」，它只在角色管理页出现）：
   目录·金 ｜ 封面·蓝 ｜ 翻页·红 ｜ 角色·绿 ｜ 隐藏·灰蓝 ｜ 重选·褐
   「隐藏」「重选」只在 FH1「世界观」子页、且已选中一套世界观时出现。 */

var FH1_BOOKMARK_SEL = '.bookmark-menu, .bookmark-back, .bookmark-next, .bookmark-role, .bookmark-hide, .bookmark-reselect';

// 两个新书签的 CSS 默认是 display:none，显示时必须显式设成 flex
function fh1ShowEl(el, on) { if (el) el.style.display = on ? 'flex' : 'none'; }

// 只同步「隐藏 / 重选」两个书签的显隐（要求：主选项卡停在 FH1 ＋ 子页是「世界观」＋ 已选中一套）
window.fh1SyncSideBookmarks = function () {
    var panel = document.getElementById('FH1');
    var onMainTab = !!(panel && panel.classList.contains('active'));
    var on = !!(FH1_SELECTED && FH1_SUBTAB === 'FH1-sub2' && onMainTab);
    fh1ShowEl(document.getElementById('fh1-bookmark-hide'), on);
    fh1ShowEl(document.getElementById('fh1-bookmark-reselect'), on);
};

// 「隐藏」：右侧书签全部消失（含它自己），直到切换选项卡
window.fh1HideBookmarks = function () {
    document.querySelectorAll(FH1_BOOKMARK_SEL).forEach(function (el) { el.style.display = 'none'; });
};

// 恢复：原有四个一律恢复；「隐藏 / 重选」只在世界观页且已选中时恢复
window.fh1RestoreBookmarks = function () {
    document.querySelectorAll(FH1_BOOKMARK_SEL).forEach(function (el) { el.style.display = ''; });
    fh1SyncSideBookmarks();
};

// 子页切换：记录当前子页；编辑模式开关只在「世界观」页显示；离开该页关闭编辑
window.fh1OnSubTabChange = function (subTabId) {
    FH1_SUBTAB = subTabId || '';
    var sw = document.getElementById('fh1-edit-switch');
    if (sw) sw.style.display = (subTabId === 'FH1-sub2') ? '' : 'none';
    if (subTabId !== 'FH1-sub2' && FH1_EDITING) {
        FH1_EDITING = false;
        var chk = document.getElementById('fh1-edit-chk');
        if (chk) chk.checked = false;
        fh1SyncDraftFromDOM();
    }
    fh1SyncSideBookmarks();
};

/* --------------------- 开局（开局选择页将来用） --------------------- */

window.fh1InitStartPanel = function () {
    var sum = document.getElementById('fh1-start-summary');
    var p = fh1GetPreset(FH1_SELECTED);
    if (sum) {
        if (FH1_SELECTED && p) {
            sum.innerHTML = '<div class="fh1-hint">已选世界观：<b>' + fh1Esc(FH1_SELECTED) + '</b>｜' +
                fh1CountItems(p) + ' 条设定</div>';
        } else {
            sum.innerHTML = '<div class="fh1-hint">还没有选择世界观：请回到「世界观」页选一套</div>';
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

// 开局只负责投递指令（世界书在「启用并继续」时已经写好）
window.fh1StartGame = async function () {
    if (!FH1_SELECTED) { showCustomAlert('请先在「世界观」页选择一套世界观并启用'); return; }
    if (!FH1_START_MODE) { showCustomAlert('请先选择开局方式：方式一（自动生成开场白）或方式二（自定义开局）'); return; }

    var preset = fh1GetPreset(FH1_SELECTED);
    var prompt = '';
    if (FH1_START_MODE === 'auto') {
        prompt = fh1BuildAutoPrompt(preset);
    } else {
        var ta = document.getElementById('fh1-start-manual-text');
        prompt = ta ? String(ta.value || '') : '';
    }
    prompt = prompt.trim();
    if (!prompt) { showCustomAlert('开局内容为空：请在方式二里填写，或改用方式一'); return; }

    var agree = await showCustomConfirm('将以「' + FH1_SELECTED + '」的世界观开始自由模式，并发送开局指令吗？');
    if (!agree) return;
    triggerSTSlashSend(prompt, fh1CollectVars());
};
