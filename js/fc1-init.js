// ===== FC1 初始设定：预设加载 + 七分区可视化编辑器 + 右侧抽屉 + 棋盘 =====
// 依赖（由 app.js / core.js 提供）：tabsDataMap, mtH, fc1EscapeHtml, fc1EscapeAttr,
//   showCustomAlert, showCustomConfirm, setLorebookEntries, fetchCharEntries,
//   FC1_REGIONS, FC1_IDENTITIES, fc1BuildVariablePreset, LOREBOOK_NAME, __cachedEntries

var FC1_PRESETS = { regions: [], items: [], inventory: [], characters: [], identities: [], estates: [], ships: [] };

// 身份组选项卡（key 用于 region 字段，label 也是预设文件夹名）
var FC1IS_IDENTITY_TABS = [
    { key: 'base', label: '通用' },
    { key: 'europe', label: '欧洲' },
    { key: 'west_africa', label: '西非' },
    { key: 'south_america', label: '南美' },
    { key: 'sea', label: '海洋' }
];

// ---- 预设文件读取 ----
async function fc1isFetchJson(rel) {
    try {
        var res = await fetch('data/fc1-presets/' + rel);
        if (res.ok) return await res.json();
    } catch (e) {}
    return null;
}
// 平铺：index.json 为字符串数组（文件名），文件在分类根目录
async function fc1isLoadFlat(category) {
    var idx = await fc1isFetchJson(category + '/index.json');
    var names = Array.isArray(idx) ? idx : [];
    var out = [];
    for (var i = 0; i < names.length; i++) {
        var it = await fc1isFetchJson(category + '/' + names[i]);
        if (it) out.push(it);
    }
    return out;
}
// 身份组：index.json 为 { 文件夹名: [文件名...] }，region 由文件夹对应的选项卡 key 推导
async function fc1isLoadIdentities() {
    var idx = await fc1isFetchJson('identities/index.json');
    var out = [];
    if (idx && typeof idx === 'object' && !Array.isArray(idx)) {
        for (var i = 0; i < FC1IS_IDENTITY_TABS.length; i++) {
            var t = FC1IS_IDENTITY_TABS[i];
            var names = idx[t.label] || [];
            for (var j = 0; j < names.length; j++) {
                var it = await fc1isFetchJson('identities/' + t.label + '/' + names[j]);
                if (it) { it.region = t.key; out.push(it); }
            }
        }
    }
    return out;
}
// 地区：index.json 为 { 文件夹名: { 区域:[...], 地点:[...] } }
async function fc1isLoadRegions() {
    var idx = await fc1isFetchJson('regions/index.json');
    var out = [];
    if (idx && typeof idx === 'object' && !Array.isArray(idx)) {
        for (var i = 0; i < FC1IS_IDENTITY_TABS.length; i++) {
            var t = FC1IS_IDENTITY_TABS[i];
            var sub = idx[t.label] || {};
            var kinds = ['区域', '地点'];
            for (var k = 0; k < kinds.length; k++) {
                var names = sub[kinds[k]] || [];
                for (var j = 0; j < names.length; j++) {
                    var it = await fc1isFetchJson('regions/' + t.label + '/' + kinds[k] + '/' + names[j]);
                    if (it) { it.region = t.key; it.kind = kinds[k]; out.push(it); }
                }
            }
        }
    }
    return out;
}
// 人物：index.json 为 { 类别: [文件名...] }
async function fc1isLoadCharacters() {
    var idx = await fc1isFetchJson('characters/index.json');
    var out = [];
    if (idx && typeof idx === 'object' && !Array.isArray(idx)) {
        for (var cat in idx) {
            var names = idx[cat] || [];
            for (var i = 0; i < names.length; i++) {
                var it = await fc1isFetchJson('characters/' + cat + '/' + names[i]);
                if (it) { it.category = cat; out.push(it); }
            }
        }
    }
    return out;
}

window.loadFc1Presets = async function() {
    FC1_PRESETS.identities = await fc1isLoadIdentities();
    FC1_PRESETS.regions = await fc1isLoadRegions();
    FC1_PRESETS.characters = await fc1isLoadCharacters();
    FC1_PRESETS.estates = await fc1isLoadFlat('estates');
    FC1_PRESETS.ships = await fc1isLoadFlat('ships');
    FC1_PRESETS.items = await fc1isLoadFlat('items');
    FC1_PRESETS.inventory = await fc1isLoadFlat('inventory');
};

// ---- 通用工具 ----
function fc1isAttrJs(s) {
    return JSON.stringify(s == null ? '' : String(s)).replace(/"/g, '&quot;');
}
// 纯 HTML 属性转义（用于 value="..." 等属性值，不额外加引号）
function fc1isAttr(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function fc1isEsc(s) { return fc1EscapeHtml(s); }

// ---- 变量访问 ----
function fc1isGetVar() {
    var dm = tabsDataMap['FC1'];
    return (dm && dm.data && dm.data.variable) ? dm.data.variable : null;
}
function fc1isEnsureVar() {
    var dm = tabsDataMap['FC1'];
    if (!dm) return null;
    var v = dm.data.variable = dm.data.variable || {};
    v.world = v.world || {};
    v.user = v.user || {};
    v.user.inventory = v.user.inventory || {};
    v['背景信息'] = v['背景信息'] || {};
    v['背景信息']['地区'] = v['背景信息']['地区'] || {};
    v.relationship = v.relationship || {};
    v.estate = v.estate || {};
    v.ships = v.ships || {};
    v.warehouse = v.warehouse || {};
    v.employment = v.employment || {};
    return v;
}

// 身份组预设 → 变量种子（仅在字段为空时写入，避免覆盖玩家已改内容）
function fc1isSyncPreset() {
    if (typeof __fc1Identity !== 'string' || !__fc1Identity) return;
    if (typeof fc1BuildVariablePreset !== 'function') return;
    var preset = fc1BuildVariablePreset(__fc1Identity, __fc1Region);
    window.__fc1Variables = preset;
    var v = fc1isEnsureVar(); if (!v) return;
    if (!v.user.wealth) v.user.wealth = preset.wealth;
    if (!v.user.body_state) v.user.body_state = preset.body_state;
    if (!v.world.position) v.world.position = preset.position;
    if (Object.keys(v.ships).length === 0 && preset.ships) v.ships = JSON.parse(JSON.stringify(preset.ships));
    if (Object.keys(v.estate).length === 0 && preset.estate) v.estate = JSON.parse(JSON.stringify(preset.estate));
    Object.keys(preset.relationship || {}).forEach(function(name) {
        if (!v.relationship[name]) v.relationship[name] = JSON.parse(JSON.stringify(preset.relationship[name]));
    });
}

// ---- 分区标题 ----
function fc1isSection(title, body) {
    return '<div class="fc1is-section">' +
        '<div class="fc1is-title">\u2756 ' + title + ' \u2756</div>' +
        '<div class="fc1is-body">' + body + '</div>' +
    '</div>';
}

// ==================== ① 世界信息 ====================
var __fc1isWorldDraft = { y: '', mo: '', dd: '', wd: '' };

function fc1isWeekday(y, mo, dd) {
    var d = new Date(parseInt(y, 10), parseInt(mo, 10) - 1, parseInt(dd, 10));
    if (isNaN(d.getTime())) return '';
    return ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][d.getDay()];
}
function fc1isInitWorldDraft() {
    if (__fc1isWorldDraft.y || __fc1isWorldDraft.mo || __fc1isWorldDraft.dd || __fc1isWorldDraft.wd) return;
    var v = fc1isEnsureVar();
    var d = (v && v.world && v.world.date) || '';
    var m = d.match(/(\d{1,4})年(\d{1,2})月(\d{1,2})日(?:\s*星期(.+))?/);
    __fc1isWorldDraft = {
        y: m ? m[1] : '',
        mo: m ? m[2] : '',
        dd: m ? m[3] : '',
        wd: m ? (m[4] ? m[4].replace(/^星期/, '') : '') : ''
    };
}
function fc1isRenderWorld() {
    return fc1isSection('世界信息', '<div class="fc1is-world">' +
        '<span class="fc1is-world-text">如今是</span>' +
        '<input class="fc1is-date-input" id="fc1is-year" value="' + fc1isAttr(__fc1isWorldDraft.y) + '" placeholder="1689" oninput="fc1isOnWorldDate()">' +
        '<span class="fc1is-world-text">年，</span>' +
        '<input class="fc1is-date-input" id="fc1is-month" value="' + fc1isAttr(__fc1isWorldDraft.mo) + '" placeholder="5" oninput="fc1isOnWorldDate()">' +
        '<span class="fc1is-world-text">月，约莫是</span>' +
        '<input class="fc1is-date-input" id="fc1is-day" value="' + fc1isAttr(__fc1isWorldDraft.dd) + '" placeholder="12" oninput="fc1isOnWorldDate()">' +
        '<span class="fc1is-world-text">日，星期</span>' +
        '<input class="fc1is-date-input" id="fc1is-weekday-input" value="' + fc1isAttr(__fc1isWorldDraft.wd) + '" placeholder="三" oninput="fc1isOnWeekday()">' +
        '<button class="fc1is-random-btn" onclick="fc1isRandomDate()">随机</button>' +
    '</div>');
}
function fc1isCommitWorldDate() {
    var yEl = document.getElementById('fc1is-year');
    var moEl = document.getElementById('fc1is-month');
    var ddEl = document.getElementById('fc1is-day');
    var wdEl = document.getElementById('fc1is-weekday-input');
    var y = yEl ? yEl.value.trim() : '';
    var mo = moEl ? moEl.value.trim() : '';
    var dd = ddEl ? ddEl.value.trim() : '';
    var wd = wdEl ? wdEl.value.trim() : '';
    __fc1isWorldDraft = { y: y, mo: mo, dd: dd, wd: wd };
    var v = fc1isEnsureVar();
    if (v) v.world.date = (y && mo && dd && wd) ? (y + '年' + mo + '月' + dd + '日 星期' + wd) : '';
    fc1isUpdateNav();
}
window.fc1isOnWorldDate = function() {
    var yEl = document.getElementById('fc1is-year');
    var moEl = document.getElementById('fc1is-month');
    var ddEl = document.getElementById('fc1is-day');
    var wdEl = document.getElementById('fc1is-weekday-input');
    var y = yEl ? yEl.value.trim() : '';
    var mo = moEl ? moEl.value.trim() : '';
    var dd = ddEl ? ddEl.value.trim() : '';
    var wd = fc1isWeekday(y, mo, dd);
    if (wdEl && wd) wdEl.value = wd.replace(/^星期/, '');
    fc1isCommitWorldDate();
};
window.fc1isOnWeekday = function() {
    fc1isCommitWorldDate();
};
window.fc1isRandomDate = function() {
    var v = fc1isEnsureVar(); if (!v) return;
    var y = 1600 + Math.floor(Math.random() * 101);
    var mo = 1 + Math.floor(Math.random() * 12);
    var days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mo - 1];
    var dd = 1 + Math.floor(Math.random() * days);
    var wd = fc1isWeekday(y, mo, dd);
    document.getElementById('fc1is-year').value = y;
    document.getElementById('fc1is-month').value = mo;
    document.getElementById('fc1is-day').value = dd;
    var wdEl = document.getElementById('fc1is-weekday-input');
    if (wdEl) wdEl.value = wd.replace(/^星期/, '');
    __fc1isWorldDraft = { y: String(y), mo: String(mo), dd: String(dd), wd: wd.replace(/^星期/, '') };
    v.world.date = y + '年' + mo + '月' + dd + '日 ' + wd;
    fc1isUpdateNav();
};

// ==================== ② 角色信息 ====================
function fc1isInvRowsHTML() {
    var v = fc1isEnsureVar();
    var inv = v.user.inventory || {};
    var rows = '';
    Object.keys(inv).forEach(function(k) {
        rows += '<div class="fc1is-inv-row">' +
            '<input class="fc1is-inv-key" value="' + fc1isAttr(k) + '" oninput="fc1isCollectInventory()">' +
            '<input class="fc1is-inv-val" value="' + fc1isAttr(inv[k]) + '" oninput="fc1isCollectInventory()">' +
            '<span class="fc1is-del" onclick="fc1isDelInv(this)">\u2715</span>' +
        '</div>';
    });
    rows += '<div class="fc1is-add" onclick="fc1isAddInv()">+ 添加物品</div>';
    return rows;
}
function fc1isRenderInvList() {
    var box = document.getElementById('fc1is-inv');
    if (box) box.innerHTML = fc1isInvRowsHTML();
}
function fc1isRenderChar(v) {
    var u = v.user;
    var genderOpts = ['', '男性', '伊芙', '伊菈'].map(function(g) {
        return '<option value="' + g + '"' + ((u.gender || '') === g ? ' selected' : '') + '>' + (g || '请选择') + '</option>';
    }).join('');
    return fc1isSection('角色信息',
        '<div class="fc1is-row"><span class="fc1is-label">性别</span><select id="fc1is-gender" onchange="fc1isOnUser(\'gender\')">' + genderOpts + '</select></div>' +
        '<div class="fc1is-row"><span class="fc1is-label">用户身份</span><input id="fc1is-identity" value="' + fc1isAttr(u.identity) + '" oninput="fc1isOnUser(\'identity\')"></div>' +
        '<div class="fc1is-row"><span class="fc1is-label"></span><button class="fc1is-idp-btn" onclick="fc1isOpenIdentityPicker()">\u2756 预设身份组 \u2756</button></div>' +
        '<div class="fc1is-row"><span class="fc1is-label">身体状态</span><input id="fc1is-body" value="' + fc1isAttr(u.body_state) + '" oninput="fc1isOnUser(\'body_state\')"></div>' +
        '<div class="fc1is-row"><span class="fc1is-label">财富</span><input id="fc1is-wealth" value="' + fc1isAttr(u.wealth) + '" oninput="fc1isOnUser(\'wealth\')"></div>' +
        '<div class="fc1is-sub">' +
            '<div class="fc1is-label">物品栏</div>' +
            '<div class="fc1is-inv-actions"><button class="fc1is-idp-btn" onclick="fc1isOpenInventoryDrawer()">预设物品</button></div>' +
            '<div class="fc1is-inv" id="fc1is-inv">' + fc1isInvRowsHTML() + '</div>' +
        '</div>');
}
window.fc1isOpenInventoryDrawer = function() {
    var cards = FC1_PRESETS.inventory.map(function(it, i) {
        return '<div class="fc1-drawer-item" onclick="fc1isAddInventoryItem(' + i + ')"><b>' + mtH(it.name) + '</b><span>' + mtH(it.value) + '</span></div>';
    }).join('');
    fc1isOpenDrawer('预设物品', cards || '<div class="fc1is-empty">暂无预设物品</div>');
};
window.fc1isAddInventoryItem = function(idx) {
    var it = FC1_PRESETS.inventory[idx]; if (!it) return;
    var v = fc1isEnsureVar(); if (!v) return;
    v.user.inventory = v.user.inventory || {};
    if (!v.user.inventory[it.name]) v.user.inventory[it.name] = it.value || '';
    fc1isCloseDrawer();
    fc1isRenderInvList();
    fc1isUpdateNav();
};
window.fc1isOnUser = function(field) {
    var v = fc1isEnsureVar(); if (!v) return;
    var el = document.getElementById('fc1is-' + field);
    if (el) v.user[field] = el.value.trim();
    fc1isUpdateNav();
};
window.fc1isAddInv = function() {
    var box = document.getElementById('fc1is-inv');
    if (!box) return;
    var row = document.createElement('div');
    row.className = 'fc1is-inv-row';
    row.innerHTML = '<input class="fc1is-inv-key" placeholder="物品名" oninput="fc1isCollectInventory()">' +
        '<input class="fc1is-inv-val" placeholder="描述" oninput="fc1isCollectInventory()">' +
        '<span class="fc1is-del" onclick="fc1isDelInv(this)">\u2715</span>';
    box.insertBefore(row, box.querySelector('.fc1is-add'));
};
window.fc1isDelInv = function(el) {
    var row = el.closest('.fc1is-inv-row');
    if (row) row.remove();
    fc1isCollectInventory();
};
window.fc1isCollectInventory = function() {
    var v = fc1isEnsureVar(); if (!v) return;
    var box = document.getElementById('fc1is-inv');
    if (!box) return;
    var inv = {};
    box.querySelectorAll('.fc1is-inv-row').forEach(function(row) {
        var k = row.querySelector('.fc1is-inv-key').value.trim();
        var val = row.querySelector('.fc1is-inv-val').value.trim();
        if (k) inv[k] = val;
    });
    v.user.inventory = inv;
    fc1isUpdateNav();
};

// ==================== ③ 地区信息（重点） ====================
var __fc1isRegion = null;
var __fc1isRegionCustom = false;

function fc1isRegionList() {
    if (FC1_PRESETS.regions.length) return FC1_PRESETS.regions;
    return (FC1_REGIONS || []).map(function(r) { return { name: r.name, img: r.img, 描述: r.desc, 民俗风情: {} }; });
}
function fc1isRegionObj(name) {
    var v = fc1isEnsureVar();
    if (!v || !name) return null;
    var regions = v['背景信息']['地区'];
    if (!regions[name]) {
        var pres = fc1isRegionList().find(function(r) { return r.name === name; }) || {};
        regions[name] = { 描述: pres.描述 || '', 民俗风情: JSON.parse(JSON.stringify(pres.民俗风情 || {})) };
    }
    return regions[name];
}
function fc1isEnsureStartRegion() {
    if (__fc1isRegionCustom || !__fc1Region) return;
    var r = (FC1_REGIONS || []).find(function(x) { return x.id === __fc1Region; });
    if (!r) return;
    fc1isRegionObj(r.name);
    if (!__fc1isRegion) __fc1isRegion = r.name;
}
function fc1isRenderRegion(v) {
    return fc1isSection('地区信息',
        '<div class="fc1is-region-head">' +
            '<button class="fc1is-region-custom" onclick="fc1isOpenRegionPicker()">\u2756 预设地区 \u2756</button>' +
            '<button class="fc1is-region-custom" onclick="fc1isCustomRegion()">+ 自定义地区</button>' +
        '</div>' +
        '<div class="fc1is-region-chips" id="fc1is-region-chips"></div>' +
        '<div class="fc1is-region-display" id="fc1is-region-display"></div>');
}
function fc1isRenderRegionChips() {
    var box = document.getElementById('fc1is-region-chips');
    if (!box) return;
    var v = fc1isEnsureVar();
    var regions = v['背景信息']['地区'] || {};
    var chips = '';
    Object.keys(regions).forEach(function(name) {
        chips += '<button class="fc1is-region-chip' + (name === __fc1isRegion ? ' active' : '') + '" onclick="fc1isSelectRegionChip(' + fc1isAttrJs(name) + ')">' + mtH(name) + '</button>';
    });
    box.innerHTML = chips;
}
window.fc1isSelectRegionChip = function(name) {
    __fc1isRegion = name;
    __fc1isRegionCustom = false;
    fc1isRenderRegionChips();
    fc1isRenderRegionDisplay();
    fc1isUpdateNav();
};
function fc1isRenderRegionDisplay() {
    var box = document.getElementById('fc1is-region-display');
    if (!box) return;
    if (!__fc1isRegion) {
        box.innerHTML = '<div class="fc1is-region-empty">请先前往「区域选择」选择你的起始之地，或点击上方「预设地区」添加。</div>';
        return;
    }
    var v = fc1isEnsureVar();
    var rd = v['背景信息']['地区'][__fc1isRegion] || { 描述: '', 民俗风情: {} };
    var customs = rd.民俗风情 || {};
    var rows = '';
    Object.keys(customs).forEach(function(k) {
        rows += '<div class="fc1is-custom-row">' +
            '<input class="fc1is-custom-key" value="' + fc1isAttr(k) + '" onchange="fc1isRenameCustom(' + fc1isAttrJs(k) + ', this.value)">' +
            '<textarea class="fc1is-custom-val" oninput="fc1isSetCustomVal(' + fc1isAttrJs(k) + ', this.value)">' + fc1isEsc(customs[k] || '') + '</textarea>' +
            '<span class="fc1is-del" onclick="fc1isDelCustom(' + fc1isAttrJs(k) + ')">\u2715</span>' +
        '</div>';
    });
    rows += '<div class="fc1is-add" onclick="fc1isAddCustom()">+ 添加风情词条</div>';
    box.innerHTML = '<div class="fc1is-region-editor">' +
        (__fc1isRegionCustom ? '<div class="fc1is-row"><span class="fc1is-label">地区名</span><input id="fc1is-region-name" value="' + fc1isAttr(__fc1isRegion) + '" onchange="fc1isRenameRegion(' + fc1isAttrJs(__fc1isRegion) + ', this.value)"></div>' : '') +
        '<div class="fc1is-row-col"><span class="fc1is-label">描述</span><textarea id="fc1is-region-desc" oninput="fc1isSetRegionDesc(this.value)">' + fc1isEsc(rd.描述 || '') + '</textarea></div>' +
        '<div class="fc1is-sub"><div class="fc1is-label">民俗风情</div><div class="fc1is-customs" id="fc1is-customs">' + rows + '</div></div>' +
    '</div>';
}
window.fc1isCustomRegion = function() {
    __fc1isRegionCustom = true;
    __fc1isRegion = '新地区';
    var v = fc1isEnsureVar();
    if (!v['背景信息']['地区']['新地区']) v['背景信息']['地区']['新地区'] = { 描述: '', 民俗风情: {} };
    fc1isRenderRegionChips();
    fc1isRenderRegionDisplay();
    fc1isUpdateNav();
};
window.fc1isRenameRegion = function(oldName, newName) {
    var v = fc1isEnsureVar(); if (!v) return;
    newName = newName.trim();
    var regions = v['背景信息']['地区'];
    if (!regions[oldName] || !newName || oldName === newName) return;
    regions[newName] = regions[oldName];
    delete regions[oldName];
    __fc1isRegion = newName;
    fc1isRenderRegionDisplay();
};
window.fc1isSetRegionDesc = function(val) {
    var v = fc1isEnsureVar(); if (!v || !__fc1isRegion) return;
    var rd = v['背景信息']['地区'][__fc1isRegion];
    if (rd) rd.描述 = val;
};
window.fc1isRenameCustom = function(oldKey, newKey) {
    var v = fc1isEnsureVar(); if (!v || !__fc1isRegion) return;
    newKey = newKey.trim();
    var c = v['背景信息']['地区'][__fc1isRegion].民俗风情;
    if (!c[oldKey] || !newKey || oldKey === newKey) return;
    c[newKey] = c[oldKey];
    delete c[oldKey];
    fc1isRenderCustoms();
};
window.fc1isSetCustomVal = function(key, val) {
    var v = fc1isEnsureVar(); if (!v || !__fc1isRegion) return;
    var c = v['背景信息']['地区'][__fc1isRegion].民俗风情;
    c[key] = val;
};
window.fc1isAddCustom = function() {
    var v = fc1isEnsureVar(); if (!v || !__fc1isRegion) return;
    var c = v['背景信息']['地区'][__fc1isRegion].民俗风情;
    c['新风情'] = '';
    fc1isRenderCustoms();
};
window.fc1isDelCustom = function(key) {
    var v = fc1isEnsureVar(); if (!v || !__fc1isRegion) return;
    delete v['背景信息']['地区'][__fc1isRegion].民俗风情[key];
    fc1isRenderCustoms();
};
function fc1isRenderCustoms() {
    var box = document.getElementById('fc1is-customs');
    if (!box || !__fc1isRegion) return;
    var v = fc1isEnsureVar();
    var customs = v['背景信息']['地区'][__fc1isRegion].民俗风情 || {};
    var rows = '';
    Object.keys(customs).forEach(function(k) {
        rows += '<div class="fc1is-custom-row">' +
            '<input class="fc1is-custom-key" value="' + fc1isAttr(k) + '" onchange="fc1isRenameCustom(' + fc1isAttrJs(k) + ', this.value)">' +
            '<textarea class="fc1is-custom-val" oninput="fc1isSetCustomVal(' + fc1isAttrJs(k) + ', this.value)">' + fc1isEsc(customs[k] || '') + '</textarea>' +
            '<span class="fc1is-del" onclick="fc1isDelCustom(' + fc1isAttrJs(k) + ')">\u2715</span>' +
        '</div>';
    });
    rows += '<div class="fc1is-add" onclick="fc1isAddCustom()">+ 添加风情词条</div>';
    box.innerHTML = rows;
}

// ==================== ④ 关系（重点） ====================
var FC1IS_REL_CATS = [
    { key: 'family', label: '家人' },
    { key: 'friends', label: '朋友' },
    { key: 'hands', label: '手下' },
    { key: 'slaves', label: '奴隶' }
];
var FC1IS_TAG_OPTIONS = ['宠物', '性奴', '情人'];
var FC1IS_REL_FIELDS = ['gender', 'location', 'expense'];

function fc1isRelLabel(key) {
    var c = FC1IS_REL_CATS.find(function(x) { return x.key === key; });
    return c ? c.label : key;
}
function fc1isRenderRel(v) {
    var rel = v.relationship || {};
    var html = '';
    FC1IS_REL_CATS.forEach(function(c) {
        var names = Object.keys(rel).filter(function(n) {
            var t = rel[n] && rel[n].tags;
            return t && t[0] === c.label;
        });
        var rows = '';
        names.forEach(function(n) {
            var r = rel[n] || {};
            var brief = r.desc || r.location || '';
            rows += '<div class="fc1is-rel-row">' +
                '<span class="fc1is-rel-name">' + mtH(n) + '</span>' +
                '<span class="fc1is-rel-brief">' + mtH(brief) + '</span>' +
                '<span class="fc1is-del" onclick="fc1isRemoveRelation(' + fc1isAttrJs(n) + ')">\u2715</span>' +
            '</div>';
        });
        html += '<div class="fc1is-rel-table">' +
            '<div class="fc1is-rel-head"><span class="fc1is-rel-title">' + c.label + '</span>' +
                '<span class="fc1is-rel-count">' + names.length + ' 人</span>' +
                '<button class="fc1is-rel-add" onclick="fc1isOpenRelation(\'' + c.key + '\')">+</button>' +
            '</div>' +
            '<div class="fc1is-rel-body">' + (rows || '<div class="fc1is-empty">暂无</div>') + '</div>' +
        '</div>';
    });
    return fc1isSection('关系', '<div class="fc1is-rel-wrap" id="fc1is-rel">' + html + '</div>');
}
function fc1isRenderRelSection() {
    var v = fc1isEnsureVar(); if (!v) return;
    var box = document.getElementById('fc1is-rel');
    if (!box) return;
    var wrap = box.closest('.fc1is-section');
    if (!wrap) return;
    wrap.outerHTML = fc1isRenderRel(v);
}
window.fc1isRemoveRelation = function(name) {
    var v = fc1isEnsureVar(); if (!v) return;
    delete v.relationship[name];
    fc1isRenderRelSection();
};
window.fc1isOpenRelation = async function(category) {
    window.__fc1isRelCat = category;
    var list = FC1_PRESETS.characters.filter(function(c) { return c.category === category; });
    var cards = '';
    list.forEach(function(c, i) {
        cards += '<div class="fc1-drawer-item" onclick="fc1isPickChar(' + i + ')"><b>' + mtH(c.name) + '</b><span>' + mtH(c.location || c.desc || '') + '</span></div>';
    });
    if (!cards) cards = '<div class="fc1is-empty">该类别暂无预设人物</div>';
    window.__fc1isCharList = list;
    var entries = [];
    if (typeof fetchCharEntries === 'function') { try { entries = await fetchCharEntries(); } catch(e) {} }
    window.__fc1isEntries = entries;
    fc1isOpenDrawer('添加' + fc1isRelLabel(category), cards + '<div class="fc1-drawer-pick" id="fc1-drawer-pick"></div>');
};
window.fc1isPickChar = function(idx) {
    var c = (window.__fc1isCharList || [])[idx];
    if (!c) return;
    window.__fc1isPickedChar = c;
    var opts = '<option value="">请选择目标条目</option>';
    (window.__fc1isEntries || []).forEach(function(e) {
        opts += '<option value="' + e.uid + '">' + mtH(e.comment || ('#' + e.uid)) + '</option>';
    });
    var tagOpts = FC1IS_TAG_OPTIONS.map(function(t) {
        return '<label class="fc1is-tag-opt"><input type="checkbox" class="fc1is-tag-chk" value="' + t + '">' + t + '</label>';
    }).join('');
    var pick = document.getElementById('fc1-drawer-pick');
    if (pick) pick.innerHTML =
        '<div class="fc1is-row-col"><span class="fc1is-label">角色描述（可编辑）</span><textarea id="fc1is-char-desc">' + fc1isEsc(c.desc || '') + '</textarea></div>' +
        '<div class="fc1is-row-col"><span class="fc1is-label">附加标签（可选）</span><div class="fc1is-tag-opts">' + tagOpts + '</div></div>' +
        '<div class="fc1is-row"><span class="fc1is-label">写入目标条目</span><select id="fc1is-char-entry">' + opts + '</select></div>' +
        '<button class="fc1-drawer-confirm" onclick="fc1isInsertRelation()">\u2727 确认塞入 \u2727</button>';
};
window.fc1isInsertRelation = async function() {
    var uidEl = document.getElementById('fc1is-char-entry');
    var uid = uidEl ? parseInt(uidEl.value, 10) : 0;
    var descEl = document.getElementById('fc1is-char-desc');
    var c = window.__fc1isPickedChar;
    if (!c) return;
    if (!uid) { showCustomAlert('请先选择目标条目'); return; }
    var desc = descEl ? descEl.value.trim() : (c.desc || '');
    if (typeof setLorebookEntries === 'function') {
        try { await setLorebookEntries(LOREBOOK_NAME, [{ uid: uid, content: desc }]); } catch(e) { showCustomAlert('写入失败'); return; }
    }
    var v = fc1isEnsureVar(); if (!v) return;
    var rel = v.relationship[c.name] || {};
    FC1IS_REL_FIELDS.forEach(function(k) {
        var val = (c[k] !== undefined && c[k] !== '') ? c[k] : '';
        rel[k] = (val === '') ? '待更新' : val;
    });
    rel.desc = (desc === '') ? '待更新' : desc;
    var tags = [fc1isRelLabel(window.__fc1isRelCat)];
    document.querySelectorAll('.fc1is-tag-chk:checked').forEach(function(chk) {
        if (tags.indexOf(chk.value) === -1) tags.push(chk.value);
    });
    rel.tags = tags;
    v.relationship[c.name] = rel;
    fc1isCloseDrawer();
    fc1isRenderRelSection();
    showCustomAlert('\u2728 已塞入角色');
};

// ==================== 棋盘与家产/船只 ====================
function fc1isWH(scale) {
    if (scale === '小型') return { w: 2, h: 1 };
    if (scale === '中型') return { w: 3, h: 1 };
    if (scale === '大型') return { w: 4, h: 2 };
    var m = String(scale || '').match(/(\d+)\s*[×x*]\s*(\d+)/);
    if (m) return { w: parseInt(m[1], 10) || 1, h: parseInt(m[2], 10) || 1 };
    return { w: 4, h: 1 };
}
var FC1IS_SHIP_SIZE = {
    '小艇': { w: 1, h: 1 },
    '渔船': { w: 1, h: 1 },
    '双桅帆船': { w: 2, h: 1 },
    '商船': { w: 2, h: 1 },
    '盖伦船': { w: 2, h: 2 },
    '大型商船': { w: 2, h: 2 },
    '护卫舰': { w: 2, h: 2 },
    '战列舰': { w: 4, h: 2 }
};
function fc1isShipWH(type) {
    return FC1IS_SHIP_SIZE[type] || { w: 2, h: 1 };
}
// 地块颜色（与状态栏一致：灰=待分配、黄=已就职、蓝=无需就职、红=荒废/重损）
function fc1isEstateTileClass(estate, staffed) {
    var needsStaff = estate.type === '商业' || estate.type === '农事' || estate.type === '手工业';
    if (!needsStaff) return 'tile-neutral';
    if (estate.status === '荒废' || estate.status === '歇业') return 'tile-derelict';
    return staffed ? 'tile-staffed' : 'tile-vacant';
}
function fc1isShipTileClass(ship, staffed) {
    var cond = ship.status && ship.status.condition;
    if (cond !== undefined && cond !== null && cond !== '' && cond <= 30) return 'tile-derelict';
    return staffed ? 'tile-staffed' : 'tile-vacant';
}
// 就职：employment 独立变量 { 人名: { type:'estate'|'ship', name:目标名 } }
function fc1isAllPersons() {
    var v = fc1isEnsureVar();
    return Object.keys(v.relationship || {});
}
function fc1isUnassignedPersons() {
    var v = fc1isEnsureVar();
    var emp = v.employment || {};
    return fc1isAllPersons().filter(function(name) { return !emp[name]; });
}
function fc1isStaffList(type, name) {
    var v = fc1isEnsureVar();
    var emp = v.employment || {};
    var out = [];
    Object.keys(emp).forEach(function(person) {
        if (emp[person] && emp[person].type === type && emp[person].name === name) out.push(person);
    });
    return out;
}
function fc1isLayoutTiles(items) {
    var grid = [], result = [];
    function fits(row, col, w, h) {
        for (var r = row; r < row + h; r++) {
            for (var c = col; c < col + w; c++) {
                if (c >= 4) return false;
                if (grid[r] && grid[r][c]) return false;
            }
        }
        return true;
    }
    function mark(row, col, w, h, name) {
        for (var r = row; r < row + h; r++) {
            if (!grid[r]) grid[r] = {};
            for (var c = col; c < col + w; c++) grid[r][c] = name;
        }
    }
    items.forEach(function(it) {
        var placed = false;
        for (var row = 0; !placed; row++) {
            for (var col = 0; col < 4; col++) {
                if (fits(row, col, it.w, it.h)) {
                    mark(row, col, it.w, it.h, it.name);
                    result.push({ name: it.name, w: it.w, h: it.h, row: row, col: col });
                    placed = true;
                    break;
                }
            }
        }
    });
    return result;
}
function fc1isBoard(type, items) {
    var layout = fc1isLayoutTiles(items);
    var v = fc1isEnsureVar();
    var cells = '';
    layout.forEach(function(it) {
        var asset = (type === 'estate' ? v.estate : v.ships)[it.name] || {};
        var staffed = fc1isStaffList(type, it.name).length > 0;
        var cls = type === 'estate' ? fc1isEstateTileClass(asset, staffed) : fc1isShipTileClass(asset, staffed);
        cells += '<div class="fc1-board-tile ' + cls + '" style="grid-column:' + (it.col + 1) + ' / span ' + it.w + '; grid-row:' + (it.row + 1) + ' / span ' + it.h + ';" onclick="fc1isEditAsset(\'' + type + '\', ' + fc1isAttrJs(it.name) + ')">' + mtH(it.name) + '</div>';
    });
    return '<div class="fc1-board"><div class="fc1-board-grid">' + cells + '</div></div>';
}
function fc1isRenderEstate(v) {
    var names = Object.keys(v.estate);
    var body = names.length ? fc1isBoard('estate', names.map(function(n) {
        var e = v.estate[n] || {};
        var wh = fc1isWH(e.scale);
        return { name: n, w: wh.w, h: wh.h };
    })) : '<div class="fc1is-empty">暂无家产，点击添加</div>';
    body += '<button class="fc1is-add-btn" onclick="fc1isOpenEstateDrawer()">+ 添加家产</button>';
    return fc1isSection('家产', '<div class="fc1is-asset-wrap" id="fc1is-estate">' + body + '</div>');
}
function fc1isRenderShip(v) {
    var names = Object.keys(v.ships);
    var body = names.length ? fc1isBoard('ship', names.map(function(n) {
        var s = v.ships[n] || {};
        var wh = fc1isShipWH(s.type);
        return { name: n, w: wh.w, h: wh.h };
    })) : '<div class="fc1is-empty">暂无船只，点击添加</div>';
    body += '<button class="fc1is-add-btn" onclick="fc1isOpenShipDrawer()">+ 添加船只</button>';
    return fc1isSection('船只', '<div class="fc1is-asset-wrap" id="fc1is-ship">' + body + '</div>');
}
function fc1isRenderEstateSection() {
    var v = fc1isEnsureVar(); if (!v) return;
    var box = document.getElementById('fc1is-estate');
    if (box) box.closest('.fc1is-section').outerHTML = fc1isRenderEstate(v);
}
function fc1isRenderShipSection() {
    var v = fc1isEnsureVar(); if (!v) return;
    var box = document.getElementById('fc1is-ship');
    if (box) box.closest('.fc1is-section').outerHTML = fc1isRenderShip(v);
}
window.fc1isOpenEstateDrawer = function() {
    var cards = FC1_PRESETS.estates.map(function(e, i) {
        return '<div class="fc1-drawer-item" onclick="fc1isAddEstate(' + i + ')"><b>' + mtH(e.name) + '</b><span>' + mtH(e.type) + ' · ' + mtH(e.scale) + '</span></div>';
    }).join('');
    cards += '<div class="fc1-drawer-item custom" onclick="fc1isAddEstateCustom()"><b>+ 自定义地块</b><span>自定义类型/大小/描述</span></div>';
    fc1isOpenDrawer('添加家产', cards);
};
window.fc1isAddEstate = function(idx) {
    var e = FC1_PRESETS.estates[idx]; if (!e) return;
    var v = fc1isEnsureVar(); if (!v) return;
    var key = e.name, n = 2;
    while (v.estate[key]) { key = e.name + n; n++; }
    v.estate[key] = { type: e.type, location: '', scale: e.scale, status: e.status || '营业中', product: e.product || '', description: e.desc || '' };
    fc1isCloseDrawer();
    fc1isRenderEstateSection();
};
window.fc1isAddEstateCustom = function() {
    fc1isOpenDrawer('自定义地块',
        '<div class="fc1is-col">' +
            '<div class="fc1is-row"><span class="fc1is-label">名称</span><input id="fc1is-c-ename"></div>' +
            '<div class="fc1is-row"><span class="fc1is-label">类型</span><input id="fc1is-c-etype" placeholder="居所/商铺/农事/手工业/其它"></div>' +
            '<div class="fc1is-row"><span class="fc1is-label">大小(宽×高)</span><input id="fc1is-c-esize" placeholder="如 2×3"></div>' +
            '<div class="fc1is-row-col"><span class="fc1is-label">描述</span><textarea id="fc1is-c-edesc"></textarea></div>' +
            '<button class="fc1-drawer-confirm" onclick="fc1isCommitEstateCustom()">\u2727 确认添加 \u2727</button>' +
        '</div>');
};
window.fc1isCommitEstateCustom = function() {
    var v = fc1isEnsureVar(); if (!v) return;
    var name = document.getElementById('fc1is-c-ename').value.trim();
    if (!name) { showCustomAlert('请填写地块名称'); return; }
    v.estate[name] = {
        type: document.getElementById('fc1is-c-etype').value.trim(),
        location: '',
        scale: document.getElementById('fc1is-c-esize').value.trim(),
        status: '营业中',
        product: '',
        description: document.getElementById('fc1is-c-edesc').value
    };
    fc1isCloseDrawer();
    fc1isRenderEstateSection();
};
window.fc1isOpenShipDrawer = function() {
    var cards = FC1_PRESETS.ships.map(function(s, i) {
        return '<div class="fc1-drawer-item" onclick="fc1isAddShip(' + i + ')"><b>' + mtH(s.name) + '</b><span>' + mtH(s.type) + ' · 造价 ' + mtH(s.cost) + '</span></div>';
    }).join('');
    cards += '<div class="fc1-drawer-item custom" onclick="fc1isAddShipCustom()"><b>+ 自定义船只</b><span>自定义船名/类型</span></div>';
    fc1isOpenDrawer('添加船只', cards);
};
window.fc1isAddShip = function(idx) {
    var s = FC1_PRESETS.ships[idx]; if (!s) return;
    var v = fc1isEnsureVar(); if (!v) return;
    var key = s.name, n = 2;
    while (v.ships[key]) { key = s.name + n; n++; }
    v.ships[key] = {
        type: s.type,
        crew: { count: s.crewCount || 0, morale: '平稳' },
        status: { condition: s.condition != null ? s.condition : 90, damage: '', speed: '停泊', cargo: {} },
        value: { cost: s.cost || '', cargo_value: '' },
        armament: { crew_weapons: {}, ship_guns: {} },
        combat_power: 0
    };
    fc1isCloseDrawer();
    fc1isRenderShipSection();
};
window.fc1isAddShipCustom = function() {
    fc1isOpenDrawer('自定义船只',
        '<div class="fc1is-col">' +
            '<div class="fc1is-row"><span class="fc1is-label">船名</span><input id="fc1is-c-sname"></div>' +
            '<div class="fc1is-row"><span class="fc1is-label">类型</span><input id="fc1is-c-stype" placeholder="小艇/渔船/双桅帆船/商船/盖伦船..."></div>' +
            '<div class="fc1is-row"><span class="fc1is-label">船员数</span><input id="fc1is-c-screw" placeholder="30"></div>' +
            '<div class="fc1is-row"><span class="fc1is-label">造价</span><input id="fc1is-c-scost" placeholder="4000 银币"></div>' +
            '<button class="fc1-drawer-confirm" onclick="fc1isCommitShipCustom()">\u2727 确认添加 \u2727</button>' +
        '</div>');
};
window.fc1isCommitShipCustom = function() {
    var v = fc1isEnsureVar(); if (!v) return;
    var name = document.getElementById('fc1is-c-sname').value.trim();
    if (!name) { showCustomAlert('请填写船名'); return; }
    var crewCount = parseInt(document.getElementById('fc1is-c-screw').value, 10) || 0;
    v.ships[name] = {
        type: document.getElementById('fc1is-c-stype').value.trim(),
        crew: { count: crewCount, morale: '平稳' },
        status: { condition: 90, damage: '', speed: '停泊', cargo: {} },
        value: { cost: document.getElementById('fc1is-c-scost').value.trim(), cargo_value: '' },
        armament: { crew_weapons: {}, ship_guns: {} },
        combat_power: 0
    };
    fc1isCloseDrawer();
    fc1isRenderShipSection();
};

// 编辑地块/船只（简单字段编辑 + 就职安排）
function fc1isRenderEmploymentHTML(type, name) {
    var staff = fc1isStaffList(type, name);
    var staffHtml = '';
    staff.forEach(function(p) {
        staffHtml += '<span class="fc1is-emp-chip">' + mtH(p) + ' <span class="fc1is-del" onclick="fc1isUnassignPerson(\'' + type + '\', ' + fc1isAttrJs(name) + ', ' + fc1isAttrJs(p) + ')">\u2715</span></span>';
    });
    var unassigned = fc1isUnassignedPersons();
    var opts = '<option value="">请选择角色</option>';
    unassigned.forEach(function(p) { opts += '<option value="' + fc1isAttr(p) + '">' + mtH(p) + '</option>'; });
    return '<div class="fc1is-sub fc1is-emp">' +
        '<span class="fc1is-label">就职</span>' +
        '<div class="fc1is-emp-list">' + (staffHtml || '<span class="fc1is-empty-inline">无人就职</span>') + '</div>' +
        '<div class="fc1is-row"><select id="fc1is-emp-select">' + opts + '</select><button class="fc1-drawer-confirm" onclick="fc1isAssignPerson(\'' + type + '\', ' + fc1isAttrJs(name) + ')">就职</button></div>' +
    '</div>';
}
window.fc1isAssignPerson = function(type, name) {
    var v = fc1isEnsureVar(); if (!v) return;
    var sel = document.getElementById('fc1is-emp-select');
    var person = sel ? sel.value : '';
    if (!person) { showCustomAlert('请先选择角色'); return; }
    v.employment[person] = { type: type, name: name };
    if (type === 'estate') fc1isRenderEstateSection(); else fc1isRenderShipSection();
    fc1isEditAsset(type, name);
};
window.fc1isUnassignPerson = function(type, name, person) {
    var v = fc1isEnsureVar(); if (!v) return;
    delete v.employment[person];
    if (type === 'estate') fc1isRenderEstateSection(); else fc1isRenderShipSection();
    fc1isEditAsset(type, name);
};
window.fc1isEditAsset = function(type, name) {
    var v = fc1isEnsureVar(); if (!v) return;
    var map = type === 'estate' ? v.estate : v.ships;
    var asset = map[name]; if (!asset) return;
    if (type === 'estate') {
        fc1isOpenDrawer('家产 · ' + name,
            '<div class="fc1is-col">' +
                '<div class="fc1is-row"><span class="fc1is-label">类型</span><input id="fc1is-e-type" value="' + fc1isAttr(asset.type) + '"></div>' +
                '<div class="fc1is-row"><span class="fc1is-label">大小</span><input id="fc1is-e-scale" value="' + fc1isAttr(asset.scale) + '"></div>' +
                '<div class="fc1is-row"><span class="fc1is-label">状态</span><input id="fc1is-e-status" value="' + fc1isAttr(asset.status) + '"></div>' +
                '<div class="fc1is-row"><span class="fc1is-label">产物</span><input id="fc1is-e-product" value="' + fc1isAttr(asset.product) + '"></div>' +
                '<div class="fc1is-row-col"><span class="fc1is-label">描述</span><textarea id="fc1is-e-desc">' + fc1isEsc(asset.description || '') + '</textarea></div>' +
                fc1isRenderEmploymentHTML('estate', name) +
                '<button class="fc1-drawer-confirm" onclick="fc1isCommitAssetEdit(\'estate\', ' + fc1isAttrJs(name) + ')">\u2727 保存 \u2727</button>' +
            '</div>');
    } else {
        var cargo = asset.status && asset.status.cargo ? asset.status.cargo : {};
        fc1isOpenDrawer('船只 · ' + name,
            '<div class="fc1is-col">' +
                '<div class="fc1is-row"><span class="fc1is-label">类型</span><input id="fc1is-s-type" value="' + fc1isAttr(asset.type) + '"></div>' +
                '<div class="fc1is-row"><span class="fc1is-label">船员数</span><input id="fc1is-s-crew" value="' + fc1isAttr((asset.crew && asset.crew.count) || 0) + '"></div>' +
                '<div class="fc1is-row"><span class="fc1is-label">船况</span><input id="fc1is-s-cond" value="' + fc1isAttr((asset.status && asset.status.condition) || '') + '"></div>' +
                '<div class="fc1is-row"><span class="fc1is-label">造价</span><input id="fc1is-s-cost" value="' + fc1isAttr((asset.value && asset.value.cost) || '') + '"></div>' +
                '<div class="fc1is-sub"><span class="fc1is-label">货物（' + Object.keys(cargo).length + '）</span><button class="fc1is-add-btn" onclick="fc1isOpenCargo(\'ship\', ' + fc1isAttrJs(name) + ')">+ 添加货物</button></div>' +
                fc1isRenderEmploymentHTML('ship', name) +
                '<button class="fc1-drawer-confirm" onclick="fc1isCommitAssetEdit(\'ship\', ' + fc1isAttrJs(name) + ')">\u2727 保存 \u2727</button>' +
            '</div>');
    }
};
window.fc1isCommitAssetEdit = function(type, name) {
    var v = fc1isEnsureVar(); if (!v) return;
    var asset = (type === 'estate' ? v.estate : v.ships)[name];
    if (!asset) return;
    if (type === 'estate') {
        asset.type = document.getElementById('fc1is-e-type').value.trim();
        asset.scale = document.getElementById('fc1is-e-scale').value.trim();
        asset.status = document.getElementById('fc1is-e-status').value.trim();
        asset.product = document.getElementById('fc1is-e-product').value.trim();
        asset.description = document.getElementById('fc1is-e-desc').value;
    } else {
        asset.type = document.getElementById('fc1is-s-type').value.trim();
        asset.crew = asset.crew || { count: 0, morale: '平稳' };
        asset.crew.count = parseInt(document.getElementById('fc1is-s-crew').value, 10) || 0;
        asset.status = asset.status || { condition: 90, damage: '', speed: '停泊', cargo: {} };
        asset.status.condition = document.getElementById('fc1is-s-cond').value.trim();
        asset.value = asset.value || { cost: '', cargo_value: '' };
        asset.value.cost = document.getElementById('fc1is-s-cost').value.trim();
    }
    fc1isCloseDrawer();
    if (type === 'estate') fc1isRenderEstateSection(); else fc1isRenderShipSection();
};

// ==================== 货物（船只 / 仓库共用） ====================
window.fc1isOpenCargo = function(kind, key) {
    window.__fc1isCargoKind = kind;
    window.__fc1isCargoKey = key;
    var cards = FC1_PRESETS.items.map(function(it, i) {
        return '<div class="fc1-drawer-item" onclick="fc1isAddCargoItem(' + i + ')"><b>' + mtH(it.name) + '</b><span>' + mtH(it.category) + ' · ' + mtH(it.quality) + '</span></div>';
    }).join('');
    cards += '<div class="fc1-drawer-item custom" onclick="fc1isAddCargoCustom()"><b>+ 自定义货物</b><span>自定义名称/数量</span></div>';
    fc1isOpenDrawer('添加货物', cards);
};
window.fc1isAddCargoItem = function(idx) {
    var it = FC1_PRESETS.items[idx]; if (!it) return;
    var v = fc1isEnsureVar(); if (!v) return;
    if (window.__fc1isCargoKind === 'ship') {
        var ship = v.ships[window.__fc1isCargoKey]; if (!ship) return;
        ship.status = ship.status || { condition: 90, damage: '', speed: '停泊', cargo: {} };
        ship.status.cargo = ship.status.cargo || {};
        ship.status.cargo[it.name] = { count: '1 ' + (it.unit || '件'), quality: it.quality || '良', category: it.category || '杂货' };
        fc1isCloseDrawer();
        fc1isRenderShipSection();
    } else {
        var wh = v.warehouse[window.__fc1isCargoKey] = v.warehouse[window.__fc1isCargoKey] || {};
        wh[it.name] = '1 ' + (it.unit || '件');
        fc1isCloseDrawer();
        fc1isRenderWarehouseSection();
    }
};
window.fc1isAddCargoCustom = function() {
    fc1isOpenDrawer('自定义货物',
        '<div class="fc1is-col">' +
            '<div class="fc1is-row"><span class="fc1is-label">名称</span><input id="fc1is-cg-name"></div>' +
            '<div class="fc1is-row"><span class="fc1is-label">数量</span><input id="fc1is-cg-count" placeholder="如 20桶 / 300加仑"></div>' +
            '<div class="fc1is-row"><span class="fc1is-label">品质</span><input id="fc1is-cg-quality" placeholder="良"></div>' +
            '<div class="fc1is-row"><span class="fc1is-label">类别</span><input id="fc1is-cg-category" placeholder="军火"></div>' +
            '<button class="fc1-drawer-confirm" onclick="fc1isCommitCargoCustom()">\u2727 确认添加 \u2727</button>' +
        '</div>');
};
window.fc1isCommitCargoCustom = function() {
    var v = fc1isEnsureVar(); if (!v) return;
    var name = document.getElementById('fc1is-cg-name').value.trim();
    if (!name) { showCustomAlert('请填写货物名称'); return; }
    var count = document.getElementById('fc1is-cg-count').value.trim();
    if (window.__fc1isCargoKind === 'ship') {
        var ship = v.ships[window.__fc1isCargoKey]; if (!ship) return;
        ship.status = ship.status || { condition: 90, damage: '', speed: '停泊', cargo: {} };
        ship.status.cargo = ship.status.cargo || {};
        ship.status.cargo[name] = { count: count, quality: document.getElementById('fc1is-cg-quality').value.trim(), category: document.getElementById('fc1is-cg-category').value.trim() };
        fc1isCloseDrawer();
        fc1isRenderShipSection();
    } else {
        v.warehouse[window.__fc1isCargoKey] = v.warehouse[window.__fc1isCargoKey] || {};
        v.warehouse[window.__fc1isCargoKey][name] = count;
        fc1isCloseDrawer();
        fc1isRenderWarehouseSection();
    }
};

// ==================== ⑦ 仓库 ====================
var FC1IS_CONTINENTS = ['南美', '欧洲', '西非'];
var __fc1isContinent = '欧洲';
function fc1isRenderWarehouse(v) {
    var tabs = FC1IS_CONTINENTS.map(function(c) {
        return '<button class="fc1is-continent' + (__fc1isContinent === c ? ' active' : '') + '" onclick="fc1isSetContinent(' + fc1isAttrJs(c) + ')">' + c + '</button>';
    }).join('');
    var wh = v.warehouse[__fc1isContinent] || {};
    var rows = '';
    Object.keys(wh).forEach(function(item) {
        rows += '<tr><td>' + mtH(item) + '</td><td>' + mtH(wh[item]) + '</td><td><span class="fc1is-del" onclick="fc1isDelWare(' + fc1isAttrJs(item) + ')">\u2715</span></td></tr>';
    });
    var table = rows ? '<table class="fc1-cargo-table"><thead><tr><th>物品</th><th>数量</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' : '<div class="fc1is-empty">该大洲暂无存货</div>';
    return fc1isSection('仓库', '<div class="fc1is-warehouse" id="fc1is-warehouse">' +
        '<div class="fc1is-continents">' + tabs + '</div>' +
        table +
        '<button class="fc1is-add-btn" onclick="fc1isOpenCargo(\'warehouse\', ' + fc1isAttrJs(__fc1isContinent) + ')">+ 添加货物</button>' +
    '</div>');
}
function fc1isRenderWarehouseSection() {
    var v = fc1isEnsureVar(); if (!v) return;
    var box = document.getElementById('fc1is-warehouse');
    if (box) box.closest('.fc1is-section').outerHTML = fc1isRenderWarehouse(v);
}
window.fc1isSetContinent = function(c) {
    __fc1isContinent = c;
    fc1isRenderWarehouseSection();
};
window.fc1isDelWare = function(item) {
    var v = fc1isEnsureVar(); if (!v) return;
    var wh = v.warehouse[__fc1isContinent];
    if (wh) delete wh[item];
    fc1isRenderWarehouseSection();
};

// ==================== 抽屉组件 ====================
(function() {
    var d = document.createElement('div');
    d.className = 'fc1-drawer';
    d.id = 'fc1-drawer';
    d.innerHTML = '<div class="fc1-drawer-backdrop" onclick="fc1isCloseDrawer()"></div>' +
        '<div class="fc1-drawer-card">' +
            '<div class="fc1-drawer-head"><span class="fc1-drawer-title" id="fc1-drawer-title"></span><button class="fc1-drawer-close" onclick="fc1isCloseDrawer()">\u2715</button></div>' +
            '<div class="fc1-drawer-body" id="fc1-drawer-body"></div>' +
        '</div>';
    document.body.appendChild(d);

    var m = document.createElement('div');
    m.className = 'fc1-modal';
    m.id = 'fc1-identity-picker';
    m.innerHTML = '<div class="fc1-modal-backdrop" onclick="fc1isCloseIdentityPicker()"></div>' +
        '<div class="fc1-modal-box">' +
            '<div class="fc1-modal-head"><span class="fc1-modal-title">\u2756 预设身份组 \u2756</span><button class="fc1-modal-close" onclick="fc1isCloseIdentityPicker()">\u2715</button></div>' +
            '<div class="fc1-modal-tabs" id="fc1is-idp-tabs"></div>' +
            '<div class="fc1-modal-body" id="fc1is-idp-body"></div>' +
        '</div>';
    document.body.appendChild(m);

    var rm = document.createElement('div');
    rm.className = 'fc1-modal';
    rm.id = 'fc1-region-picker';
    rm.innerHTML = '<div class="fc1-modal-backdrop" onclick="fc1isCloseRegionPicker()"></div>' +
        '<div class="fc1-modal-box">' +
            '<div class="fc1-modal-head"><span class="fc1-modal-title">\u2756 预设地区 \u2756</span><button class="fc1-modal-close" onclick="fc1isCloseRegionPicker()">\u2715</button></div>' +
            '<div class="fc1-modal-tabs" id="fc1is-rg-tabs"></div>' +
            '<div class="fc1-modal-body" id="fc1is-rg-body"></div>' +
        '</div>';
    document.body.appendChild(rm);
})();
window.fc1isOpenDrawer = function(title, html) {
    var d = document.getElementById('fc1-drawer');
    var t = document.getElementById('fc1-drawer-title');
    var b = document.getElementById('fc1-drawer-body');
    if (!d || !t || !b) return;
    t.textContent = title;
    b.innerHTML = html;
    d.classList.add('open');
};
window.fc1isCloseDrawer = function() {
    var d = document.getElementById('fc1-drawer');
    if (!d) return;
    d.classList.remove('open');
    var b = document.getElementById('fc1-drawer-body');
    if (b) b.innerHTML = '';
};

// ==================== 预设身份组弹窗 ====================
var __fc1isIdpTab = 'base';
window.fc1isOpenIdentityPicker = function() {
    var m = document.getElementById('fc1-identity-picker');
    if (!m) return;
    m.classList.add('open');
    fc1isRenderIdpTabs();
    fc1isRenderIdpBody();
};
window.fc1isCloseIdentityPicker = function() {
    var m = document.getElementById('fc1-identity-picker');
    if (m) m.classList.remove('open');
};
function fc1isRenderIdpTabs() {
    var box = document.getElementById('fc1is-idp-tabs');
    if (!box) return;
    box.innerHTML = FC1IS_IDENTITY_TABS.map(function(t) {
        return '<button class="fc1-modal-tab' + (__fc1isIdpTab === t.key ? ' active' : '') + '" onclick="fc1isSetIdpTab(\'' + t.key + '\')">' + t.label + '</button>';
    }).join('');
}
window.fc1isSetIdpTab = function(key) {
    __fc1isIdpTab = key;
    fc1isRenderIdpTabs();
    fc1isRenderIdpBody();
};
function fc1isRenderIdpBody() {
    var box = document.getElementById('fc1is-idp-body');
    if (!box) return;
    var list = (FC1_PRESETS.identities || []).filter(function(it) { return it.region === __fc1isIdpTab; });
    if (!list.length) list = (FC1_IDENTITIES || []).filter(function(it) { return it.region === __fc1isIdpTab; });
    var cards = list.map(function(it) {
        return '<div class="fc1-idp-card" onclick="fc1isPickIdentity(\'' + it.id + '\')">' +
            '<div class="fc1-idp-name">' + mtH(it.name) + '</div>' +
            '<div class="fc1-idp-desc">' + mtH(it.desc) + '</div>' +
            '<div class="fc1-idp-res">起始：' + mtH(it.res) + '</div>' +
        '</div>';
    }).join('');
    box.innerHTML = cards || '<div class="fc1is-empty">该类别暂无身份组</div>';
}
window.fc1isPickIdentity = function(id) {
    __fc1Identity = id;
    var pool = (FC1_PRESETS.identities && FC1_PRESETS.identities.length) ? FC1_PRESETS.identities : (FC1_IDENTITIES || []);
    var it = pool.find(function(x) { return x.id === id; });
    var v = fc1isEnsureVar();
    if (v && it) v.user.identity = it.name;
    var input = document.getElementById('fc1-identity-input');
    if (input) input.value = it ? it.name : '';
    fc1isCloseIdentityPicker();
    fc1InitRender();
};

// ==================== 预设地区弹窗（五个选项卡 + 区域/地点） ====================
var __fc1isRgTab = 'base';
window.fc1isOpenRegionPicker = function() {
    var m = document.getElementById('fc1-region-picker');
    if (!m) return;
    m.classList.add('open');
    fc1isRenderRgTabs();
    fc1isRenderRgBody();
};
window.fc1isCloseRegionPicker = function() {
    var m = document.getElementById('fc1-region-picker');
    if (m) m.classList.remove('open');
};
function fc1isRenderRgTabs() {
    var box = document.getElementById('fc1is-rg-tabs');
    if (!box) return;
    box.innerHTML = FC1IS_IDENTITY_TABS.map(function(t) {
        return '<button class="fc1-modal-tab' + (__fc1isRgTab === t.key ? ' active' : '') + '" onclick="fc1isSetRgTab(\'' + t.key + '\')">' + t.label + '</button>';
    }).join('');
}
window.fc1isSetRgTab = function(key) {
    __fc1isRgTab = key;
    fc1isRenderRgTabs();
    fc1isRenderRgBody();
};
function fc1isRenderRgBody() {
    var box = document.getElementById('fc1is-rg-body');
    if (!box) return;
    var html = '';
    ['区域', '地点'].forEach(function(kind) {
        var list = (FC1_PRESETS.regions || []).filter(function(r) { return r.region === __fc1isRgTab && r.kind === kind; });
        var cards = list.map(function(r) {
            return '<div class="fc1-idp-card" onclick="fc1isPickRegion(' + fc1isAttrJs(r.name) + ')">' +
                '<div class="fc1-idp-name">' + mtH(r.name) + '</div>' +
                '<div class="fc1-idp-desc">' + mtH(r.描述 || '') + '</div>' +
            '</div>';
        }).join('');
        html += '<div class="fc1-modal-subtitle">' + kind + '</div>' + (cards || '<div class="fc1is-empty">暂无' + kind + '</div>');
    });
    box.innerHTML = html;
}
window.fc1isPickRegion = function(name) {
    var v = fc1isEnsureVar(); if (!v) return;
    var pres = (FC1_PRESETS.regions || []).find(function(r) { return r.name === name; }) || {};
    if (!v['背景信息']['地区'][name]) {
        v['背景信息']['地区'][name] = { 描述: pres.描述 || '', 民俗风情: JSON.parse(JSON.stringify(pres.民俗风情 || {})) };
    }
    __fc1isRegion = name;
    __fc1isRegionCustom = false;
    fc1isCloseRegionPicker();
    fc1InitRender();
};

// ==================== 引导式步骤（世界信息 → 性别 → 身份 → 身体状态 → 财富 → 物品栏 → 决策 → 地区信息 → 完整编辑器） ====================
var __fc1isStep = 0;

function fc1isStepFilled() {
    var v = fc1isEnsureVar();
    if (!v) return false;
    if (__fc1isStep === 0) {
        return !!(__fc1isWorldDraft.y && __fc1isWorldDraft.mo && __fc1isWorldDraft.dd && __fc1isWorldDraft.wd);
    }
    if (__fc1isStep === 1) {
        return !!(v.user && v.user.gender);
    }
    if (__fc1isStep === 2) {
        return !!(v.user && v.user.identity);
    }
    if (__fc1isStep === 3) {
        return !!(v.user && v.user.body_state);
    }
    if (__fc1isStep === 4) {
        return !!(v.user && v.user.wealth);
    }
    if (__fc1isStep === 5) {
        return Object.keys((v.user && v.user.inventory) || {}).length > 0;
    }
    if (__fc1isStep === 7) {
        return !!__fc1isRegion;
    }
    return true;
}

function fc1isUpdateNav() {
    var btn = document.getElementById('fc1is-continue');
    if (!btn) return;
    btn.style.display = fc1isStepFilled() ? '' : 'none';
}

window.fc1isNext = function() {
    __fc1isStep++;
    fc1isRenderStep();
};

// 决策：跳过后续变量 → 直接进入「开始剧情」
window.fc1isSkipRemaining = function() {
    if (typeof fc1RenderStartPreview === 'function') fc1RenderStartPreview();
    if (typeof goToSubTab === 'function') goToSubTab('FC1', 'FC1-sub4');
};

// 决策：填写后续变量 → 进入地区信息
window.fc1isFillRemaining = function() {
    __fc1isStep = 7;
    fc1isRenderStep();
};

function fc1isNavHTML() {
    return '<div class="fc1is-nav">' +
        '<button class="fc1is-nav-btn fc1is-nav-skip" onclick="fc1isNext()">跳过</button>' +
        '<button class="fc1is-nav-btn fc1is-nav-continue" id="fc1is-continue" style="display:none;" onclick="fc1isNext()">继续</button>' +
    '</div>';
}

function fc1isDecisionHTML() {
    return fc1isSection('是否跳过后续变量填写',
            '<div class="fc1is-hint">（若你选择了预设身份组，推荐跳过）</div>') +
        '<div class="fc1is-nav">' +
            '<button class="fc1is-nav-btn fc1is-nav-skip" onclick="fc1isSkipRemaining()">跳过</button>' +
            '<button class="fc1is-nav-btn fc1is-nav-continue" onclick="fc1isFillRemaining()">填写</button>' +
        '</div>';
}

function fc1isGenderRow(v) {
    var u = v.user;
    var genderOpts = ['', '男性', '伊芙', '伊菈'].map(function(g) {
        return '<option value="' + g + '"' + ((u.gender || '') === g ? ' selected' : '') + '>' + (g || '请选择') + '</option>';
    }).join('');
    return '<div class="fc1is-row"><span class="fc1is-label">性别</span><select id="fc1is-gender" onchange="fc1isOnUser(\'gender\')">' + genderOpts + '</select></div>';
}

function fc1isIdentityRows(v) {
    var u = v.user;
    return '<div class="fc1is-row"><span class="fc1is-label">用户身份</span><input id="fc1is-identity" value="' + fc1isAttr(u.identity) + '" oninput="fc1isOnUser(\'identity\')"></div>' +
        '<div class="fc1is-row"><span class="fc1is-label"></span><button class="fc1is-idp-btn" onclick="fc1isOpenIdentityPicker()">\u2756 预设身份组 \u2756</button></div>';
}

function fc1isBodyRow(v) {
    return '<div class="fc1is-row"><span class="fc1is-label">身体状态</span><input id="fc1is-body" value="' + fc1isAttr(v.user.body_state) + '" oninput="fc1isOnUser(\'body_state\')"></div>';
}

function fc1isWealthRow(v) {
    return '<div class="fc1is-row"><span class="fc1is-label">财富</span><input id="fc1is-wealth" value="' + fc1isAttr(v.user.wealth) + '" oninput="fc1isOnUser(\'wealth\')"></div>';
}

function fc1isInventoryBlock(v) {
    return '<div class="fc1is-sub">' +
        '<div class="fc1is-label">物品栏</div>' +
        '<div class="fc1is-inv-actions"><button class="fc1is-idp-btn" onclick="fc1isOpenInventoryDrawer()">预设物品</button></div>' +
        '<div class="fc1is-inv" id="fc1is-inv">' + fc1isInvRowsHTML() + '</div>' +
    '</div>';
}

function fc1isRenderCharSection(v) {
    var rows = '';
    if (__fc1isStep >= 1) rows += fc1isGenderRow(v);
    if (__fc1isStep >= 2) rows += fc1isIdentityRows(v);
    if (__fc1isStep >= 3) rows += fc1isBodyRow(v);
    if (__fc1isStep >= 4) rows += fc1isWealthRow(v);
    if (__fc1isStep >= 5) rows += fc1isInventoryBlock(v);
    if (!rows) return '';
    return fc1isSection('角色信息', rows);
}

function fc1isRenderStep() {
    var root = document.getElementById('fc1-init-root');
    if (!root) return;
    var v = fc1isEnsureVar();
    if (!v) return;
    fc1isInitWorldDraft();

    var content = fc1isRenderWorld();
    if (__fc1isStep >= 1) content += fc1isRenderCharSection(v);
    if (__fc1isStep >= 7) content += fc1isRenderRegion(v);
    if (__fc1isStep >= 8) {
        content += fc1isRenderRel(v) +
            fc1isRenderEstate(v) +
            fc1isRenderShip(v) +
            fc1isRenderWarehouse(v);
    }

    var nav = '';
    if (__fc1isStep === 6) nav = fc1isDecisionHTML();
    else if (__fc1isStep < 6 || __fc1isStep === 7) nav = fc1isNavHTML();

    root.innerHTML = '<div class="fc1is-hint">所有未填写的项请留空，无需填写「无」。</div>' + content + nav;

    if (__fc1isStep >= 7) {
        fc1isRenderRegionChips();
        fc1isRenderRegionDisplay();
    }
    fc1isUpdateNav();
}

// ==================== 总渲染 ====================
window.fc1InitRender = function() {
    var root = document.getElementById('fc1-init-root');
    if (!root) return;
    fc1isSyncPreset();
    fc1isEnsureStartRegion();
    fc1isRenderStep();
};

// ==================== 收集变量（替代 fc1CollectVariable） ====================
window.fc1CollectInitialVars = function() {
    var v = fc1isEnsureVar();
    if (!v) return null;
    var idEl = document.getElementById('fc1-identity-input');
    if (idEl) v.user.identity = idEl.value.trim();
    v.user.gender = (typeof __fc1Gender !== 'undefined' && __fc1Gender) ? __fc1Gender : (v.user.gender || '');
    v.setting = v.setting || {};
    v.setting.mode = (typeof __currentMode !== 'undefined' && __currentMode) ? __currentMode : 'free';
    v.setting.worldview = (typeof __currentWorldviewId !== 'undefined' && __currentWorldviewId) ? __currentWorldviewId : 'colony';
    var out = {};
    Object.keys(v).forEach(function(k) { out[k] = v[k]; });
    delete out.write;
    delete out['剧情线'];
    return out;
};
