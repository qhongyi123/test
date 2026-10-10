var LOREBOOK_NAME = "千叶的睡前小故事";

var __currentWorldviewId = "";
var __currentMode = "";
var __selectionConfirmed = false;

// FC1 自由模式-贩奴贸易 背景音乐链接（待填）
var FC1_MUSIC_URL = "";

// 已有内容的「模式+世界观」组合；其余组合在对应模式下列为「敬请期待」
var AVAILABLE_COMBOS = [["script", "medieval"], ["free", "colony"], ["free", "hentai"]];

function isWorldviewComingSoon(mode, worldview) {
    if (!mode || !worldview) return true;
    return !AVAILABLE_COMBOS.some(function(c) { return c[0] === mode && c[1] === worldview; });
}

// 注意：hentai = 本子世界。2026-10-02 由旧「西部拓荒 / western」改名而来，uid 序号 W=2 不变。
var WORLDVIEW_IDS = ["medieval", "colony", "hentai", "xianxia", "magic"];
var WORLDVIEW_NAMES = ["中世纪童话", "开拓新大陆与殖民贸易", "本子世界", "东方修仙", "西方魔法"];

// 世界观槽位公式（世界书重排后）
// 七槽（2026-10-08 世界书重构后的新基数）：内化协议 152+W / 世界观设定 4+W / 婚恋结构 20+W / 种族·势力 10+W / 伊菈称呼 158+W / 社会生态 15+W / 文风 195+W
// 变量规则：214+W（自由）/ 219+W（剧情）
// 思维链：251+W（自由）/ 256+W（剧情）
function worldviewCoreUids(W) {
    return [152 + W, 4 + W, 10 + W, 20 + W, 158 + W, 15 + W, 195 + W];
}

var WORLDVIEWS = [];
for (var __wi = 0; __wi < WORLDVIEW_IDS.length; __wi++) {
    WORLDVIEWS.push({
        id: WORLDVIEW_IDS[__wi],
        name: WORLDVIEW_NAMES[__wi]
    });
}

// 根据世界观 + 模式开关世界书条目：七槽随世界观（含按世界分条的婚恋结构）；变量规则/思维链随世界观+模式
window.applyWorldviewLorebook = async function(worldviewId, mode) {
    if (!mode) mode = __currentMode;
    var updates = [];
    WORLDVIEW_IDS.forEach(function(id, W) {
        var isCurrent = (id === worldviewId);
        worldviewCoreUids(W).forEach(function(uid) { updates.push({ uid: uid, enabled: isCurrent }); });
        // 最新状态·{世界观}（本子世界的「变量信息展示」＝ uid 227 ＝ 225 + W）：跟着世界观一起启停
        updates.push({ uid: 225 + W, enabled: isCurrent });
        updates.push({ uid: 214 + W, enabled: isCurrent && mode === 'free' });
        updates.push({ uid: 219 + W, enabled: isCurrent && mode === 'script' });
        updates.push({ uid: 251 + W, enabled: isCurrent && mode === 'free' });
        updates.push({ uid: 256 + W, enabled: isCurrent && mode === 'script' });
    });
    // 开拓新大陆（colony）额外附带的两条：uid 26〈参考〉、uid 27（大洲/地理），随该世界观一起启停
    var COLONY_EXTRA_UIDS = [26, 27];
    WORLDVIEW_IDS.forEach(function (id, W) {
        if (id !== 'colony') return;
        COLONY_EXTRA_UIDS.forEach(function (uid) { updates.push({ uid: uid, enabled: id === worldviewId }); });
    });
    // 剧情阶段（uid 249）是全局条目，不按世界观分条：跟着模式启停（剧本模式开、自由模式关）。
    // 它的正文是 EJS，会自己按 setting.mode 决定输出什么；但条目本身必须先开着，才轮得到它输出。
    updates.push({ uid: 249, enabled: mode === 'script' });
    if (updates.length > 0 && typeof setLorebookEntries === 'function') {
        try { await setLorebookEntries(LOREBOOK_NAME, updates); } catch(e) { console.warn("开关世界书条目失败：", e); }
    }
};

var CH_NUMS = ["", "一","二","三","四","五","六","七","八","九","十",
    "十一","十二","十三","十四","十五","十六","十七","十八","十九","二十",
    "二十一","二十二","二十三","二十四","二十五","二十六","二十七","二十八","二十九","三十"];

var CONTROL_PANEL_CONFIG = {
    "tab3-sub1": {
        title: "初始设置",
        defaultSingle: true,
        items: [
            { id: "cps1-1", name: "正文美化", desc: "启用正文的美化排版与装饰效果。", enableUids: [ 201 ], disableUids: [], defaultChecked: true },
            { id: "cps1-2", name: "纯文字", desc: "使用简洁的纯文字模式，关闭所有美化效果。", enableUids: [ 202 ], disableUids: [] }
        ]
    }
};

var emptyTemplateInfo = {
    "story": { "name": "", "alias": "", "background": "", "startContent": "", "coverImg": "" },
    "variable": {
        "world": { "date": "", "position": "", "time": "" },
        "write": { "stage": "阶段0", "next_stage": "阶段1", "next_next_stage": "阶段2" },
        "setting": { "mode": "script", "worldview": "medieval" },
        "user": { "identity": "", "gender": "", "body_state": "", "inventory": {}, "surroundings": "", "psychological_description": "" },
        "剧情线": {},
        "用户偏好": {},
        "背景信息": { "地区": {} }
    }
};

function mtH(str) {
    if(typeof str !== 'string' || !str) return "";
    var s = str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    s = s.replace(/\*\*(.*?)\*\*/g, '<strong class="md-bold">$1</strong>');
    s = s.replace(/~~(.*?)~~/g, '<del class="md-del">$1</del>');
    s = s.replace(/\|\|(.*?)\|\|/g, '<span class="md-spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>');
    s = s.replace(/(?:^|\n)######\s+(.*)/g, '\n<h6 class="md-h md-h6">$1</h6>');
    s = s.replace(/(?:^|\n)#####\s+(.*)/g, '\n<h5 class="md-h md-h5">$1</h5>');
    s = s.replace(/(?:^|\n)####\s+(.*)/g, '\n<h4 class="md-h md-h4">$1</h4>');
    s = s.replace(/(?:^|\n)###\s+(.*)/g, '\n<h3 class="md-h md-h3">$1</h3>');
    s = s.replace(/(?:^|\n)##\s+(.*)/g, '\n<h2 class="md-h md-h2">$1</h2>');
    s = s.replace(/(?:^|\n)#\s+(.*)/g, '\n<h1 class="md-h md-h1">$1</h1>');
    return s;
}

window.safeRenderMdOnNodes = function(rootElement) {
    if (!rootElement) return;
    var walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT, null, false);
    var textNodes = [];
    var node;
    while (node = walker.nextNode()) { textNodes.push(node); }
    textNodes.forEach(function(node) {
        var val = node.nodeValue;
        if(!val.trim()) return;
        var s = val;
        var hasMd = s.indexOf('**') !== -1 || s.indexOf('~~') !== -1 || s.indexOf('||') !== -1 || s.indexOf('#') !== -1;
        if(!hasMd) return;
        s = s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        s = s.replace(/\*\*(.*?)\*\*/g, '<strong class="md-bold">$1</strong>');
        s = s.replace(/~~(.*?)~~/g, '<del class="md-del">$1</del>');
        s = s.replace(/\|\|(.*?)\|\|/g, '<span class="md-spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>');
        s = s.replace(/(?:^|\n)######\s+(.*)/g, '\n<h6 class="md-h md-h6">$1</h6>');
        s = s.replace(/(?:^|\n)#####\s+(.*)/g, '\n<h5 class="md-h md-h5">$1</h5>');
        s = s.replace(/(?:^|\n)####\s+(.*)/g, '\n<h4 class="md-h md-h4">$1</h4>');
        s = s.replace(/(?:^|\n)###\s+(.*)/g, '\n<h3 class="md-h md-h3">$1</h3>');
        s = s.replace(/(?:^|\n)##\s+(.*)/g, '\n<h2 class="md-h md-h2">$1</h2>');
        s = s.replace(/(?:^|\n)#\s+(.*)/g, '\n<h1 class="md-h md-h1">$1</h1>');
        var modified = s !== val;
        if(modified) {
            var temp = document.createElement('span');
            temp.innerHTML = s;
            while(temp.firstChild) {
                node.parentNode.insertBefore(temp.firstChild, node);
            }
            node.parentNode.removeChild(node);
        }
    });
};

window.extractMdFromNode = function(origNode) {
    if(!origNode) return "";
    var helper = document.getElementById('md-extractor-helper');
    if(!helper) {
        helper = document.createElement('div');
        helper.id = 'md-extractor-helper';
        helper.style.position = 'absolute';
        helper.style.left = '-9999px';
        helper.style.whiteSpace = 'pre-wrap';
        document.body.appendChild(helper);
    }
    helper.innerHTML = origNode.innerHTML;
    var elementsToConvert = helper.querySelectorAll('.md-bold, strong, b, .md-del, del, s, strike, span.md-spoiler, h1, h2, h3, h4, h5, h6, .md-h');
    var arr = Array.from(elementsToConvert).reverse();
    for(var i = 0; i < arr.length; i++) {
        var el = arr[i];
        var tag = el.tagName.toLowerCase();
        var cls = el.className || "";
        var mdStart = "", mdEnd = "";
        var bPrefix = "", bSuffix = "";
        if (cls.indexOf('md-bold') !== -1 || tag === 'strong' || tag === 'b') { mdStart = mdEnd = "**"; }
        else if (cls.indexOf('md-del') !== -1 || tag === 'del' || tag === 's' || tag === 'strike') { mdStart = mdEnd = "~~"; }
        else if (cls.indexOf('md-spoiler') !== -1) { mdStart = mdEnd = "||"; }
        else if (tag.match(/^h[1-6]$/)) { mdStart = '#'.repeat(parseInt(tag[1])) + ' '; bSuffix = '\n'; }
        else if (cls.indexOf('md-h1') !== -1) { mdStart = '# '; bSuffix = '\n'; }
        else if (cls.indexOf('md-h2') !== -1) { mdStart = '## '; bSuffix = '\n'; }
        else if (cls.indexOf('md-h3') !== -1) { mdStart = '### '; bSuffix = '\n'; }
        else if (cls.indexOf('md-h4') !== -1) { mdStart = '#### '; bSuffix = '\n'; }
        else if (cls.indexOf('md-h5') !== -1) { mdStart = '##### '; bSuffix = '\n'; }
        else if (cls.indexOf('md-h6') !== -1) { mdStart = '###### '; bSuffix = '\n'; }
        var internalText = el.innerText || el.textContent || "";
        var finalOutput = bPrefix + mdStart + internalText + mdEnd + bSuffix;
        var textNode = document.createTextNode(finalOutput);
        if(el.parentNode) el.parentNode.replaceChild(textNode, el);
    }
    var finalStr = helper.innerText;
    if (!finalStr) finalStr = helper.textContent;
    helper.innerHTML = "";
    return finalStr;
};


// ===== 任务指导书第 101 条：基础态与童话角色分组 =====
// 常开的基础条目（只留这 15 条，其余全关）
var LOREBOOK_BASE_UIDS = [0, 1, 2, 3, 9, 25, 75, 149, 150, 151, 157, 200, 201, 213, 250];
// 童话五张故事卡 → 人物区条目 uid（用户给定）
var STORY_CHARACTERS = {
    '卖火柴的小女孩': [76],
    '小红帽': [77, 78, 79, 80, 88],
    '白雪公主': [81, 82, 83],
    '灰姑娘': [84, 85, 86],
    '小裁缝一次干七个！': [87]
};
var STORY_CHARACTER_UIDS_ALL = [76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88];

// 点目录书签 / 进入「模式选择与世界观调整」时调用：条目恢复"什么都没开、只留基础"的状态
window.resetLorebookToBase = async function () {
    var updates = [], seen = {};
    var push = function (uid, enabled) { if (seen[uid]) return; seen[uid] = 1; updates.push({ uid: uid, enabled: enabled }); };
    // 按世界观分条的各类槽位全关
    [[4, 8], [10, 14], [15, 19], [20, 24], [152, 156], [158, 162], [195, 199], [214, 223], [225, 229], [251, 260]]
        .forEach(function (r) { for (var u = r[0]; u <= r[1]; u++) push(u, false); });
    // 全局条目：最新状态说明 224、剧情阶段 249、开拓新大陆附带的 26/27
    push(224, false); push(249, false);
    COLONY_EXTRA_UIDS.forEach(function (u) { push(u, false); });
    // 人物区所有角色
    STORY_CHARACTER_UIDS_ALL.forEach(function (u) { push(u, false); });
    // 基础条目一律打开
    LOREBOOK_BASE_UIDS.forEach(function (u) { push(u, true); });
    if (typeof setLorebookEntries === 'function') {
        try { await setLorebookEntries(LOREBOOK_NAME, updates); } catch (e) { console.warn('恢复基础条目失败：', e); }
    }
};

// 点童话卡片的「开启童话物语」时调用：点亮该卡角色，关掉其他卡的
window.enableStoryCharacters = async function (storyName) {
    if (!storyName) return;
    var mine = STORY_CHARACTERS[storyName];
    if (!mine) { console.warn('没有「' + storyName + '」的角色分组，跳过'); return; }
    var updates = STORY_CHARACTER_UIDS_ALL.map(function (u) {
        return { uid: u, enabled: mine.indexOf(u) !== -1 };
    });
    if (typeof setLorebookEntries === 'function') {
        try { await setLorebookEntries(LOREBOOK_NAME, updates); } catch (e) { console.warn('切换故事角色失败：', e); }
    }
};
