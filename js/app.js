// ===== 控制面板 =====
function renderControlPanelDynamicArea() {
    Object.keys(CONTROL_PANEL_CONFIG).forEach(function(panelId) {
        var conf = CONTROL_PANEL_CONFIG[panelId];
        var panelEl = document.getElementById(panelId);
        if(!panelEl) return;
        var itemsHtml = "";
        conf.items.forEach(function(it) {
            var checkedAttr = it.defaultChecked ? "checked" : "";
            itemsHtml +=
                '<div class="control-item-row">' +
                    '<div style="flex:1;">' +
                        '<div style="font-weight:bold; color:var(--color-primary-dark); font-size:1.05rem; margin-bottom:4px;">' + mtH(it.name) + '</div>' +
                        '<div style="font-size:0.85em; color:var(--color-text-dark); opacity:0.9;">' + mtH(it.desc) + '</div>' +
                    '</div>' +
                    '<div style="display:flex; align-items:center; margin-left:15px; flex-shrink:0;">' +
                        '<label class="switch-ui" style="transform:scale(1.1);">' +
                            '<input type="checkbox" id="' + it.id + '" class="cp-checkbox" onchange="handleControlPanelItemChange(\'' + panelId + '\', \'' + it.id + '\')" ' + checkedAttr + '>' +
                            '<span class="slider"></span>' +
                        '</label>' +
                    '</div>' +
                '</div>';
        });
        panelEl.innerHTML =
            '<div class="cp-header-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px dashed rgba(212,175,55,0.4); padding-bottom:10px;">' +
                '<div style="font-style:italic; font-size:0.95em; color:#8b5a2b; font-weight:bold;">' +
                    '\u2756 ' + conf.title + ' \u2756 <br>' +
                    '<span style="font-weight:normal; font-size:0.8em; opacity:0.9; color:var(--color-text-dark);">部分界面只能单选，请注意</span>' +
                '</div>' +
            '</div>' +
            '<div style="flex:1; overflow-y:auto; padding-right:5px; margin-bottom:10px;" class="sub-panels-wrapper">' +
                itemsHtml +
            '</div>';
    });
}

var COMING_SOON_WORLDVIEWS = ["western", "xianxia", "magic"];

function renderModeAndWorldviewPanel() {
    var panelEl = document.getElementById('tab4-sub1');
    if (!panelEl) return;

    var modeItemsHtml = "";
    [["script", "剧情模式"], ["free", "自由模式"]].forEach(function(m) {
        var isActive = (__currentMode === m[0]);
        modeItemsHtml +=
            '<div class="worldview-item' + (isActive ? ' active' : '') + '" data-mode-id="' + m[0] + '" onclick="selectMode(\'' + m[0] + '\')">' +
                '<span class="worldview-radio"></span>' +
                '<span class="worldview-name">' + m[1] + '</span>' +
            '</div>';
    });

    var wvItemsHtml = "";
    WORLDVIEWS.forEach(function(wv) {
        var isComingSoon = (COMING_SOON_WORLDVIEWS.indexOf(wv.id) !== -1);
        var isCurrent = (wv.id === __currentWorldviewId) && !isComingSoon;
        var nameText = mtH(wv.name) + (isComingSoon ? '（敬请期待）' : '');
        var clickAttr = isComingSoon ? '' : ' onclick="selectWorldview(\'' + wv.id + '\')"';
        var itemCls = 'worldview-item' + (isCurrent ? ' active' : '') + (isComingSoon ? ' disabled' : '');
        wvItemsHtml +=
            '<div class="' + itemCls + '" data-wv-id="' + wv.id + '"' + clickAttr + '>' +
                '<span class="worldview-radio"></span>' +
                '<span class="worldview-name">' + nameText + '</span>' +
            '</div>';
    });

    panelEl.innerHTML =
        '<div class="cp-header-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px dashed rgba(212,175,55,0.4); padding-bottom:10px;">' +
            '<div style="font-style:italic; font-size:0.95em; color:#8b5a2b; font-weight:bold;">' +
                '\u2756 模式与世界观 \u2756 <br>' +
                '<span style="font-weight:normal; font-size:0.8em; opacity:0.9; color:var(--color-text-dark);">先选模式，再选世界观，按选择开关对应条目</span>' +
            '</div>' +
        '</div>' +
        '<div style="font-weight:bold; color:var(--color-primary-dark); margin:5px 0 8px; font-size:0.95rem;">\u2756 模式</div>' +
        '<div class="worldview-list" style="margin-bottom:15px;">' + modeItemsHtml + '</div>' +
        '<div style="font-weight:bold; color:var(--color-primary-dark); margin:5px 0 8px; font-size:0.95rem;">\u2756 世界观</div>' +
        '<div class="worldview-list">' + wvItemsHtml + '</div>';
}

function renderTocModeWorldview() {
    var el = document.getElementById('toc-mode-worldview');
    if (!el) return;
    var modeHtml = "";
    [["script", "剧情模式"], ["free", "自由模式"]].forEach(function(m) {
        var isActive = (__currentMode === m[0]);
        modeHtml += '<span class="toc-mw-item' + (isActive ? ' active' : '') + '" data-mode-id="' + m[0] + '" onclick="selectMode(\'' + m[0] + '\')">' + m[1] + '</span>';
    });
    var wvHtml = "";
    WORLDVIEWS.forEach(function(wv) {
        var isComingSoon = (COMING_SOON_WORLDVIEWS.indexOf(wv.id) !== -1);
        var isActive = (wv.id === __currentWorldviewId) && !isComingSoon;
        var nameText = mtH(wv.name) + (isComingSoon ? '（敬请期待）' : '');
        var clickAttr = isComingSoon ? '' : ' onclick="selectWorldview(\'' + wv.id + '\')"';
        var itemCls = 'toc-mw-item' + (isActive ? ' active' : '') + (isComingSoon ? ' disabled' : '');
        wvHtml += '<span class="' + itemCls + '" data-wv-id="' + wv.id + '"' + clickAttr + '>' + nameText + '</span>';
    });
    el.innerHTML =
        '<div class="toc-mw-label">\u2756 模式</div>' +
        '<div class="toc-mw-row">' + modeHtml + '</div>' +
        '<div class="toc-mw-label">\u2756 世界观</div>' +
        '<div class="toc-mw-row">' + wvHtml + '</div>';
}

window.selectWorldview = function(worldviewId) {
    if (COMING_SOON_WORLDVIEWS.indexOf(worldviewId) !== -1) return;
    __currentWorldviewId = worldviewId;
    __selectionConfirmed = true;
    renderModeAndWorldviewPanel();
    renderTocModeWorldview();
    if (typeof refreshConditionalStoryTabs === 'function') refreshConditionalStoryTabs();
    applyWorldviewLorebook(worldviewId, __currentMode);
};

window.selectMode = function(mode) {
    __currentMode = mode;
    __selectionConfirmed = true;
    renderModeAndWorldviewPanel();
    renderTocModeWorldview();
    if (typeof refreshConditionalStoryTabs === 'function') refreshConditionalStoryTabs();
    applyWorldviewLorebook(__currentWorldviewId, mode);
};

window.handleControlPanelItemChange = async function(panelId, currentItemId) {
    var panelConf = CONTROL_PANEL_CONFIG[panelId];
    var isSingleMode = !!(panelConf && panelConf.defaultSingle);
    var cbNode = document.getElementById(currentItemId);
    if (isSingleMode && cbNode && cbNode.checked) {
        panelConf.items.forEach(function(it) {
            if (it.id !== currentItemId) {
                var otherCb = document.getElementById(it.id);
                if (otherCb && otherCb.checked) { otherCb.checked = false; }
            }
        });
    }
    var updatesMap = {};
    panelConf.items.forEach(function(it) {
        var checkEl = document.getElementById(it.id);
        if (checkEl && !checkEl.checked) {
            if (it.enableUids) it.enableUids.forEach(function(uid) { updatesMap[uid] = { uid: uid, enabled: false }; });
        }
    });
    panelConf.items.forEach(function(it) {
        var checkEl = document.getElementById(it.id);
        if (checkEl && checkEl.checked) {
            if (it.enableUids) it.enableUids.forEach(function(uid) { updatesMap[uid] = { uid: uid, enabled: true }; });
            if (it.disableUids) it.disableUids.forEach(function(uid) { updatesMap[uid] = { uid: uid, enabled: false }; });
        }
    });
    if (typeof setLorebookEntries === 'function') {
        var updatePayload = Object.values(updatesMap);
        if(updatePayload.length > 0) {
            try { await setLorebookEntries(LOREBOOK_NAME, updatePayload); } catch(e) { showCustomAlert("试图写入世界书属性时遭拒。"); }
        }
    }
};

// ===== 弹窗系统 =====
window.showCustomConfirm = function(msg, isAlertOnly) {
    if (isAlertOnly === undefined) isAlertOnly = false;
    return new Promise(function(resolve) {
        document.getElementById('customAlertMsg').innerText = msg;
        var overlay = document.getElementById('customAlertOverlay');
        var cancelBtn = document.getElementById('customAlertCancelBtn');
        cancelBtn.style.display = isAlertOnly ? 'none' : 'inline-block';
        window.__alertConfirmResolve = resolve;
        overlay.classList.add('active');
    });
};

window.handleAlertAction = function(result) {
    document.getElementById('customAlertOverlay').classList.remove('active');
    if (typeof window.__alertConfirmResolve === 'function') {
        window.__alertConfirmResolve(result);
        window.__alertConfirmResolve = null;
    }
};

window.showCustomAlert = function(msg) { showCustomConfirm(msg, true); };

// ===== 界面底层操作 =====
function openBook() {
    var coverScene = document.getElementById('scene-cover');
    var innerScene = document.getElementById('scene-inner');
    coverScene.classList.add('is-fading-out');
    setTimeout(function() { innerScene.classList.add('is-fading-in'); }, 150);
}

function goBackCover() {
    var coverScene = document.getElementById('scene-cover');
    var innerScene = document.getElementById('scene-inner');
    document.getElementById('tocMenu').classList.remove('active');
    innerScene.classList.remove('is-fading-in');
    setTimeout(function() { coverScene.classList.remove('is-fading-out'); }, 150);
}

function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-btn').forEach(function(btn) { btn.classList.remove('active'); });
    if(btnElement) btnElement.classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(function(panel) { panel.classList.remove('active'); });
    document.getElementById(tabId).classList.add('active');
}

function switchSubTab(btnElement, subTabId) {
    var headerContainer = btnElement.parentElement;
    headerContainer.querySelectorAll('.sub-tab-btn').forEach(function(btn) { btn.classList.remove('active'); });
    btnElement.classList.add('active');
    var mainPanelContainer = headerContainer.parentElement;
    mainPanelContainer.querySelectorAll('.sub-panel').forEach(function(panel) { panel.classList.remove('active'); });
    mainPanelContainer.querySelector('#' + subTabId).classList.add('active');
}

function nextPage() {
    var btns = Array.from(document.querySelectorAll('.tab-btn')).filter(function(btn) { return btn.style.display !== 'none'; });
    var currentIndex = btns.findIndex(function(btn) { return btn.classList.contains('active'); });
    if (currentIndex !== -1) {
        var nextIndex = (currentIndex + 1) % btns.length;
        var gateIndex = btns.findIndex(function(btn) { return btn.getAttribute('data-target') === 'tab4'; });
        if (!__selectionConfirmed && gateIndex !== -1 && nextIndex > gateIndex) {
            nextIndex = gateIndex;
            showCustomAlert("请先在「模式选择与世界观调整」中完成选择");
        }
        switchTab(btns[nextIndex].getAttribute('data-target'), btns[nextIndex]);
    }
}

function toggleToc() { document.getElementById('tocMenu').classList.toggle('active'); }

function selectFromToc(tabId) {
    var btn = document.querySelector('.tab-btn[data-target="' + tabId + '"]');
    if (btn) {
        switchTab(tabId, btn);
    } else {
        showCustomAlert("该内容需先选择对应的模式与世界观");
    }
    toggleToc();
}

function goToRoleTab() {
    var targetBtn = document.querySelector('.tab-btn[data-target="tab7"]');
    if(targetBtn) { switchTab('tab7', targetBtn); }
}

// ===== 导入功能 =====
var __currentImportTabId = "";

window.openImportModal = function(sourceTabId) {
    __currentImportTabId = sourceTabId;
    var domInput = document.getElementById('importDataInput');
    if(domInput) domInput.value = "";
    document.getElementById('importModalOverlay').classList.add('active');
};

window.closeImportModal = function() {
    document.getElementById('importModalOverlay').classList.remove('active');
};

window.commitImportData = async function() {
    var rawData = document.getElementById('importDataInput').value.trim();
    if(!rawData) { showCustomAlert("输入为空！"); return; }
    var parsed;
    try { parsed = JSON.parse(rawData); }
    catch(e) { showCustomAlert("导入失败！请确保输入的内容是正常格式。"); return; }
    var container = document.getElementById(__currentImportTabId);
    if(!container) return;
    closeImportModal();

    function _safeAssignPath(pathStr, fallbackVal) {
        if (fallbackVal === undefined) return;
        var tg = container.querySelector('[data-path="' + pathStr + '"]');
        if(tg) tg.innerHTML = mtH(typeof fallbackVal === 'string' ? fallbackVal : String(fallbackVal));
    }

    if(parsed.story) {
        _safeAssignPath("story.name", parsed.story.name);
        _safeAssignPath("story.alias", parsed.story.alias);
        _safeAssignPath("story.background", parsed.story.background);
        _safeAssignPath("story.startContent", parsed.story.startContent);
    }

    if(parsed.variable) {
        if(parsed.variable.world) {
            _safeAssignPath("variable.world.date", parsed.variable.world.date);
            _safeAssignPath("variable.world.time", parsed.variable.world.time);
            _safeAssignPath("variable.world.position", parsed.variable.world.position);
        }
        if(parsed.variable.user) {
            var u = parsed.variable.user;
            _safeAssignPath("variable.user.identity", u.identity);
            _safeAssignPath("variable.user.gender", u.gender);
            _safeAssignPath("variable.user.body_state", u.body_state);
            _safeAssignPath("variable.user.surroundings", u.surroundings);
            _safeAssignPath("variable.user.Psychological_description", u.Psychological_description);
            if(u.Inventory && typeof u.Inventory === 'object') {
                var invUl = container.querySelector('[data-dict="variable.user.Inventory"]');
                if(invUl) invUl.innerHTML = generateInventoryList(u.Inventory);
            }
        }
        if(parsed.variable["剧情线"] !== undefined) {
            var stUl = container.querySelector('[data-complex-dict="variable.剧情线"]');
            if(!stUl) {
                stUl = container.querySelector('[data-dict="variable.剧情线"]');
                if(stUl) stUl.setAttribute('data-complex-dict', 'variable.剧情线');
            }
            if(stUl) { stUl.innerHTML = generateComplexStorylines(parsed.variable["剧情线"]); }
        }
        if(parsed.variable["描写指导"] !== undefined) {
            var gdUl = container.querySelector('[data-dict="variable.描写指导"]');
            if(gdUl) gdUl.innerHTML = generateStorylines(parsed.variable["描写指导"]);
        }
        if(parsed.variable["背景信息"] && parsed.variable["背景信息"]["地区"]) {
            var targetRC = container.querySelector('#regions-' + __currentImportTabId);
            if(targetRC) {
                var rgDatas = parsed.variable["背景信息"]["地区"];
                var htmlStr = "";
                var editAttr = container.classList.contains('is-edit-mode') ? "contenteditable='true'" : "";
                Object.keys(rgDatas).forEach(function(rk) {
                    var rt = rgDatas[rk];
                    var cuSt = "";
                    if(rt["民俗风情"] && typeof rt["民俗风情"] === 'object') {
                        Object.keys(rt["民俗风情"]).forEach(function(ck) {
                            cuSt += '<div class="custom-row custom-item" data-ditem>' +
                                '<span class="editable-key editable-field" style="color:#8b5a2b;" data-dkey ' + editAttr + '>' + mtH(ck) + '</span>: ' +
                                '<span class="editable-field" data-dval ' + editAttr + '>' + mtH(rt["民俗风情"][ck]) + '</span>' +
                            '</div>';
                        });
                    }
                    cuSt += '<div class="add-custom-btn" onclick="addNewCustom(this)">+ 添加风情词条</div>';
                    htmlStr +=
                        '<div class="area-box area-item">' +
                            '<div style="font-weight:bold; color:var(--color-primary-dark); margin-bottom:5px; border-bottom:1px dashed rgba(184,134,11,0.3); padding-bottom:5px;">' +
                                '\u27A4 <span class="editable-field editable-key region-name" style="color:var(--color-accent);" ' + editAttr + '>' + mtH(rk) + '</span>' +
                            '</div>' +
                            '<div class="custom-row" style="margin-bottom:8px;">' +
                                '<span class="param-label" style="flex-shrink:0;">描述:</span>' +
                                '<div class="editable-field editable-textarea region-desc" style="flex:1;" ' + editAttr + '>' + mtH(rt["描述"] || '') + '</div>' +
                            '</div>' +
                            '<div class="customs-box">' +
                                '<div class="param-label" style="display:block; margin-bottom:4px;">\u2756 民俗风情:</div>' + cuSt +
                            '</div>' +
                        '</div>';
                });
                targetRC.innerHTML = htmlStr;
            }
        }
    }

    if (container.classList.contains('is-edit-mode')) {
        container.querySelectorAll('.editable-field').forEach(function(el) { el.setAttribute('contenteditable', 'true'); });
    }
    showCustomAlert("导入成功！");
};

// ===== 图片缩放 =====
window.zoomTabImage = function(tabId, dir) {
    var wrapper = document.getElementById('img-wrapper-' + tabId);
    if(wrapper) {
        var currentWidth = parseInt(wrapper.style.width || "200", 10);
        var newWidth = currentWidth + dir * 100;
        if (newWidth < 60) newWidth = 60;
        if (newWidth > 600) newWidth = 600;
        wrapper.style.width = newWidth + "px";
    }
};

// ===== 编辑模式 =====
window.toggleEditMode = function(chkboxEl, tabId) {
    var panel = document.getElementById(tabId);
    if(chkboxEl.checked) {
        panel.classList.add('is-edit-mode');
        panel.querySelectorAll('.editable-field').forEach(function(el) { el.setAttribute('contenteditable', 'true'); });
    } else {
        panel.classList.remove('is-edit-mode');
        panel.querySelectorAll('.editable-field').forEach(function(el) { el.removeAttribute('contenteditable'); });
    }

    // 同步脉络式覆盖层中的编辑开关
    var tlChk = document.getElementById('timeline-edit-chk');
    if (tlChk && tlChk.checked !== chkboxEl.checked) {
        tlChk.checked = chkboxEl.checked;
    }

    // 同步脉络式保存按钮
    var saveBtn = document.getElementById('timeline-save-btn');
    if (saveBtn) saveBtn.style.display = chkboxEl.checked ? '' : 'none';

    // 刷新已打开卡片的编辑状态（保持变暗/亮起不变）
    if (typeof _refreshAllCardsEditMode === 'function') {
        _refreshAllCardsEditMode(chkboxEl.checked);
    }
};

// ===== 地域 / 民俗 / 道具管理 =====
window.addNewRegion = function(tabId) {
    var container = document.getElementById('regions-' + tabId);
    if (!container) return;
    var newAreaBox = document.createElement('div');
    newAreaBox.className = "area-box area-item";
    newAreaBox.innerHTML =
        '<div style="font-weight:bold; color:var(--color-primary-dark); margin-bottom:5px; border-bottom:1px dashed rgba(184,134,11,0.3); padding-bottom:5px;">' +
            '\u27A4 <span class="editable-field editable-key region-name" style="color:var(--color-accent);">新的地域</span>' +
        '</div>' +
        '<div class="custom-row" style="margin-bottom:8px;">' +
            '<span class="param-label" style="flex-shrink:0;">描述:</span>' +
            '<div class="editable-field editable-textarea region-desc" style="flex:1;">关于此地的相关描述...</div>' +
        '</div>' +
        '<div class="customs-box">' +
            '<div class="param-label" style="display:block; margin-bottom:4px;">\u2756 民俗风情:</div>' +
            '<div class="custom-row custom-item" data-ditem>' +
                '<span class="editable-key editable-field" style="color:#8b5a2b;" data-dkey>新增民俗风情</span>:' +
                '<span class="editable-field" data-dval>相关描述。</span>' +
            '</div>' +
            '<div class="add-custom-btn" onclick="addNewCustom(this)">+ 添加风情词条</div>' +
        '</div>';
    container.appendChild(newAreaBox);
    var tabEl = document.getElementById(tabId);
    if (tabEl.classList.contains('is-edit-mode')) {
        newAreaBox.querySelectorAll('.editable-field').forEach(function(el) { el.setAttribute('contenteditable', 'true'); });
    }
};

window.addNewCustom = function(btnElem) {
    var box = btnElem.parentElement;
    var newRow = document.createElement('div');
    newRow.className = "custom-row custom-item";
    newRow.setAttribute('data-ditem', '');
    newRow.innerHTML = '<span class="editable-key editable-field" style="color:#8b5a2b;" data-dkey>新的民俗风情</span>:<span class="editable-field" data-dval>相关描述。</span>';
    box.insertBefore(newRow, btnElem);
    if (btnElem.closest('.tab-panel').classList.contains('is-edit-mode')) {
        newRow.querySelectorAll('.editable-field').forEach(function(el) { el.setAttribute('contenteditable', 'true'); });
    }
};

window.addNewInventoryItem = function(btnElem) {
    var list = btnElem.previousElementSibling;
    var newRow = document.createElement('li');
    newRow.className = "custom-row";
    newRow.setAttribute('data-ditem', '');
    newRow.innerHTML = '<span class="editable-key editable-field" data-dkey style="color:#8b5a2b;">新增物品</span>:<span class="editable-field" data-dval>物品描述</span>';
    list.appendChild(newRow);
    if (btnElem.closest('.tab-panel').classList.contains('is-edit-mode')) {
        newRow.querySelectorAll('.editable-field').forEach(function(el) { el.setAttribute('contenteditable', 'true'); });
    }
};

window.addNewStoryline = function(btnElem, type) {
    var list = btnElem.previousElementSibling;
    var emptyHint = list.querySelector('.empty-hint');
    if(emptyHint) list.removeChild(emptyHint);
    if(type === 'stage') {
        var items = list.querySelectorAll(':scope > [data-citem]');
        var count = items.length;
        if(count >= 30) { showCustomAlert("剧情阶段至多添加三十个！"); return; }
        var idx = count + 1;
        var titleStr = '阶段' + idx;
        var newRow = document.createElement('li');
        newRow.className = "complex-stage-block";
        newRow.style.cssText = "margin-bottom:12px; border:1px solid rgba(184,134,11,0.2); padding:8px; border-radius:6px; background:rgba(255,255,255,0.3);";
        newRow.setAttribute('data-citem', '');
        newRow.innerHTML =
            '<div style="font-weight:bold; color:var(--color-primary-dark); margin-bottom:5px; border-bottom:1px dashed rgba(184,134,11,0.3); padding-bottom:5px;" class="editable-key editable-field" data-ckey>' + titleStr + '</div>' +
            '<div style="display:flex; flex-direction:column; gap:6px;">' +
                '<div class="custom-row" style="margin:0;"><span class="param-label" style="font-size:0.9em; flex-shrink:0;" data-skey>描述</span>: <div class="editable-field editable-textarea" data-sval style="flex:1;">设定此处的发展...</div></div>' +
                '<div class="custom-row" style="margin:0;"><span class="param-label" style="font-size:0.9em; flex-shrink:0;" data-skey>触发条件</span>: <div class="editable-field editable-textarea" data-sval style="flex:1;">抵达此阶段之条件...</div></div>' +
                '<div class="custom-row" style="margin:0;"><span class="param-label" style="font-size:0.9em; flex-shrink:0;" data-skey>阶段指导</span>: <div class="editable-field editable-textarea" data-sval style="flex:1;">相关演绎准则...</div></div>' +
            '</div>';
        list.appendChild(newRow);
        if (btnElem.closest('.tab-panel').classList.contains('is-edit-mode')) {
            newRow.querySelectorAll('.editable-field').forEach(function(el) { el.setAttribute('contenteditable', 'true'); });
        }
    } else {
        var items2 = list.querySelectorAll(':scope > [data-ditem]');
        var count2 = items2.length;
        if(count2 >= 30) { showCustomAlert("描写指导至多添加三十个！"); return; }
        var idx2 = count2 + 1;
        var titleStr2 = '指导' + idx2;
        var newRow2 = document.createElement('li');
        newRow2.className = "custom-row";
        newRow2.style.marginBottom = "8px";
        newRow2.setAttribute('data-ditem', '');
        newRow2.innerHTML = '<div class="editable-key editable-field" data-dkey style="color:var(--color-primary-dark); flex-shrink:0;">' + titleStr2 + '</div><div class="editable-field" data-dval style="flex:1;">在此刻画相应的命运轨迹...</div>';
        list.appendChild(newRow2);
        if (btnElem.closest('.tab-panel').classList.contains('is-edit-mode')) {
            newRow2.querySelectorAll('.editable-field').forEach(function(el) { el.setAttribute('contenteditable', 'true'); });
        }
    }
};

// ===== 预设弹窗 =====
var __currentPresetTabId = "";
var __presetStageData = [];
var __presetMode = "loc";
var __tempAddingCustom = null;

window.openPresetModal = function(sourceTabId) {
    __currentPresetTabId = sourceTabId;
    __presetStageData = [];
    __tempAddingCustom = null;
    document.getElementById('presetModalOverlay').classList.add('active');
    switchPresetType('loc');
};

window.closePresetModal = function() {
    document.getElementById('presetModalOverlay').classList.remove('active');
    __presetStageData = [];
};

window.switchPresetType = function(type) {
    __presetMode = type;
    __tempAddingCustom = null;
    document.querySelectorAll('.preset-list-btn').forEach(function(b){b.classList.remove('active');});
    var btns = document.getElementById('presetMenuArea').children;
    if(type==='loc') btns[0].classList.add('active');
    else if(type==='custom') btns[1].classList.add('active');
    else if(type==='combo') btns[2].classList.add('active');
    renderPresetMidPanel();
    renderPresetRightPanel();
};

function toggleDescView(el) {
    var d = el.nextElementSibling;
    d.style.display = d.style.display === 'block' ? 'none' : 'block';
}

window.actionAddLocation = function(idx) {
    var locConf = PRESET_DATA_CONFIG.locations[idx];
    __presetStageData.push({ name: locConf.name, desc: locConf.desc, customs:[] });
    renderPresetRightPanel();
};

window.actionTriggerCustomBind = function(idx, btnElem) {
    var cusConf = PRESET_DATA_CONFIG.customs[idx];
    __tempAddingCustom = { name: cusConf.name, desc: cusConf.desc };
    document.querySelectorAll('.preset-btn-small').forEach(function(e){e.classList.remove('highlight-add');});
    btnElem.classList.add('highlight-add');
    renderPresetRightPanel();
};

window.actionInjectCustomToLoc = function(locIndex) {
    if(__tempAddingCustom) {
        __presetStageData[locIndex].customs.push(__tempAddingCustom);
        __tempAddingCustom = null;
        document.querySelectorAll('.preset-btn-small').forEach(function(e){e.classList.remove('highlight-add');});
        renderPresetRightPanel();
    }
};

window.actionAddCombo = function(idx) {
    var cbConf = PRESET_DATA_CONFIG.combos[idx];
    cbConf.data.forEach(function(item) {
        var pureCustoms = [];
        if(item.customs) item.customs.forEach(function(c) { pureCustoms.push({name: c.name, desc: c.desc}); });
        __presetStageData.push({name: item.name, desc: item.desc, customs: pureCustoms});
    });
    renderPresetRightPanel();
};

window.actionRemoveStageItem = function(locIdx) {
    __presetStageData.splice(locIdx, 1);
    renderPresetRightPanel();
};

window.actionRemoveStageCustom = function(locIdx, cusIdx) {
    __presetStageData[locIdx].customs.splice(cusIdx, 1);
    renderPresetRightPanel();
};

function renderPresetMidPanel() {
    var midTitle = document.getElementById('presetMidTitle');
    var midC = document.getElementById('presetMidContent');
    var htmlStr = "";
    if(__presetMode === 'loc') {
        midTitle.innerText = "预设地点记录列册";
        PRESET_DATA_CONFIG.locations.forEach(function(l, idx) {
            htmlStr +=
                '<div class="preset-item-card">' +
                    '<div class="preset-item-head" onclick="toggleDescView(this)">' +
                        '<span>\u27A4 ' + mtH(l.name) + '</span>' +
                        '<button class="preset-btn-small" onclick="event.stopPropagation(); actionAddLocation(' + idx + ')">\u2795 独建区域</button>' +
                    '</div>' +
                    '<div class="preset-item-desc">' + mtH(l.desc) + '</div>' +
                '</div>';
        });
    }
    else if(__presetMode === 'custom') {
        midTitle.innerText = "民俗风情独立志";
        PRESET_DATA_CONFIG.customs.forEach(function(c, idx) {
            htmlStr +=
                '<div class="preset-item-card">' +
                    '<div class="preset-item-head" onclick="toggleDescView(this)">' +
                        '<span>\u2756 ' + mtH(c.name) + '</span>' +
                        '<button class="preset-btn-small" onclick="event.stopPropagation(); actionTriggerCustomBind(' + idx + ', this)">绑定选中</button>' +
                    '</div>' +
                    '<div class="preset-item-desc">' + mtH(c.desc) + '</div>' +
                '</div>';
        });
    }
    else if(__presetMode === 'combo') {
        midTitle.innerText = "预设套件连携法";
        PRESET_DATA_CONFIG.combos.forEach(function(c, idx) {
            htmlStr +=
                '<div class="preset-item-card">' +
                    '<div class="preset-item-head" onclick="toggleDescView(this)">' +
                        '<span>\uD83D\uDCDA ' + mtH(c.name) + '</span>' +
                        '<button class="preset-btn-small" onclick="event.stopPropagation(); actionAddCombo(' + idx + ')">一键并拢装载</button>' +
                    '</div>' +
                    '<div class="preset-item-desc">' + mtH(c.desc) + '</div>' +
                '</div>';
        });
    }
    midC.innerHTML = htmlStr || "<div style='opacity:0.6; text-align:center; padding:10px;'>尚未设定内容</div>";
}

function renderPresetRightPanel() {
    var rigC = document.getElementById('presetRightContent');
    if(__presetStageData.length === 0) {
        rigC.innerHTML = '<div style="opacity:0.6; text-align:center; padding:20px; font-style:italic;">右侧仍为空寂的沙丘。<br><br>你可以直接将【地点】加入此域界。若是加入【民俗组合】请进入附加装配绑定状态。</div>';
        return;
    }
    var htmlStr = "";
    __presetStageData.forEach(function(sd, idx) {
        var cusLines = "";
        sd.customs.forEach(function(cu, cid){
            cusLines += '<li style="display:flex; justify-content:space-between; margin-bottom:4px;">' +
                '<span><b>' + mtH(cu.name) + '</b></span>' +
                '<span style="color:var(--color-primary-dark); cursor:pointer;" onclick="actionRemoveStageCustom(' + idx + ', ' + cid + ')" title="卸除该风情">\u2716</span>' +
            '</li>';
        });
        var showInjectBtn = (__presetMode === 'custom' && __tempAddingCustom) ? "display:block;" : "display:none;";
        htmlStr +=
            '<div class="staged-loc-card">' +
                '<div class="staged-loc-title">' +
                    '<span>' + mtH(sd.name) + '</span>' +
                    '<span style="color:red; cursor:pointer;" onclick="actionRemoveStageItem(' + idx + ')" title="根除此项">\u2716</span>' +
                '</div>' +
                '<div style="font-size:0.85em; color:#666; margin-bottom:5px;">附辖属民俗 (共' + sd.customs.length + '类)：</div>' +
                '<ul class="staged-custom-list">' + cusLines + '</ul>' +
                '<div class="target-drop-btn" style="' + showInjectBtn + '" onclick="actionInjectCustomToLoc(' + idx + ')">\u2795 确立投聚于此处</div>' +
            '</div>';
    });
    rigC.innerHTML = htmlStr;
}

window.commitPresetData = function() {
    if(__presetStageData.length === 0) { showCustomAlert("请至少选择一项预设内容。"); return; }
    var regionSuperBox = document.getElementById('regions-' + __currentPresetTabId);
    if(!regionSuperBox) return;
    var mainTabEl = document.getElementById(__currentPresetTabId);
    var forceEditorProp = mainTabEl.classList.contains('is-edit-mode') ? "contenteditable='true'" : "";
    __presetStageData.forEach(function(loc) {
        var wrapBox = document.createElement('div');
        wrapBox.className = "area-box area-item";
        var customHtmlFlow = "";
        loc.customs.forEach(function(cus) {
            customHtmlFlow +=
                '<div class="custom-row custom-item" data-ditem>' +
                    '<span class="editable-key editable-field" style="color:#8b5a2b;" data-dkey ' + forceEditorProp + '>' + mtH(cus.name) + '</span>: ' +
                    '<span class="editable-field" data-dval ' + forceEditorProp + '>' + mtH(cus.desc) + '</span>' +
                '</div>';
        });
        wrapBox.innerHTML =
            '<div style="font-weight:bold; color:var(--color-primary-dark); margin-bottom:5px; border-bottom:1px dashed rgba(184,134,11,0.3); padding-bottom:5px;">' +
                '\u27A4 <span class="editable-field editable-key region-name" style="color:var(--color-accent);" ' + forceEditorProp + '>' + mtH(loc.name) + '</span>' +
            '</div>' +
            '<div class="custom-row" style="margin-bottom:8px;">' +
                '<span class="param-label" style="flex-shrink:0;">描述:</span>' +
                '<div class="editable-field editable-textarea region-desc" style="flex:1;" ' + forceEditorProp + '>' + mtH(loc.desc) + '</div>' +
            '</div>' +
            '<div class="customs-box">' +
                '<div class="param-label" style="display:block; margin-bottom:4px;">\u2756 民俗风情:</div>' +
                customHtmlFlow +
                '<div class="add-custom-btn" onclick="addNewCustom(this)">+ 添加风情词条</div>' +
            '</div>';
        regionSuperBox.appendChild(wrapBox);
    });
    showCustomAlert("预设已加载");
    closePresetModal();
    setTimeout(function() { regionSuperBox.scrollIntoView({behavior: "smooth", block: "end"}); }, 300);
};

// ===== 角色管理 =====
var __cachedEntries = [];

async function fetchCharEntries() {
    try {
        if(typeof getLorebookEntries === 'function') {
            var entries = await getLorebookEntries(LOREBOOK_NAME, {fields:['uid','comment','content','enabled','order']});
            return entries.filter(function(e) { return e.order >= 100 && e.order <= 124; });
        }
    } catch(e) { console.warn("未能读取世界书记录：", e); }
    return [];
}

window.populateCharSelectors = async function() {
    var chars = await fetchCharEntries();
    __cachedEntries = chars;
    document.querySelectorAll('select[id^="char-select-"]').forEach(function(sel) {
        var html = '<option value="">- 请从下列条目中选择一个 -</option>';
        chars.forEach(function(c) {
            var displayMark = c.comment && c.comment.trim() !== '' ? c.comment : '未命名条目';
            html += '<option value="' + c.uid + '">' + mtH(displayMark) + '</option>';
        });
        sel.innerHTML = html;
    });
};

window.ifConfirmThenPopulate = async function() {
    if(await showCustomConfirm("是否重新加载世界书？")) {
        populateCharSelectors();
        refreshCharManager();
    }
};

window.loadCharEntry = function(selElem, tabId) {
    var uid = parseInt(selElem.value, 10);
    var entry = __cachedEntries.find(function(e) { return e.uid === uid; });
    var nameInput = document.getElementById('char-name-' + tabId);
    var contentArea = document.getElementById('char-content-' + tabId);
    if (entry) {
        nameInput.value = entry.comment || "";
        contentArea.value = entry.content || "";
    } else {
        nameInput.value = ""; contentArea.value = "";
    }
};

window.saveCharEntry = async function(tabId) {
    if (typeof setLorebookEntries !== 'function') { showCustomAlert("提示：请确认正处于兼容脚本运行的次元环境节点！"); return; }
    var selElem = document.getElementById('char-select-' + tabId);
    if (!selElem.value) { showCustomAlert("写入失败，请先选择可用的条目"); return; }
    var isGranted = await showCustomConfirm("确认写入该角色吗");
    if (!isGranted) return;
    var uid = parseInt(selElem.value, 10);
    var nameVal = document.getElementById('char-name-' + tabId).value.trim();
    var contentVal = document.getElementById('char-content-' + tabId).value.trim();
    try {
        await setLorebookEntries(LOREBOOK_NAME, [{ uid: uid, comment: nameVal, content: contentVal }]);
        showCustomAlert("\u2728 已写入世界书");
        await populateCharSelectors();
        await refreshCharManager();
    } catch(e) { showCustomAlert("写入失败，请刷新或重新连接世界书"); }
};

window.refreshCharManager = async function() {
    var charListBox = document.getElementById('char-manage-list');
    if(!charListBox) return;
    charListBox.innerHTML = "<div style='text-align:center; padding:20px; opacity:0.7;'>寻找中...</div>";
    var chars = await fetchCharEntries();
    if(chars.length === 0) {
        charListBox.innerHTML = "<div style='text-align:center; padding:20px; opacity:0.7;'>找不到《千叶童话》的世界书。</div>";
        return;
    }
    var listHTML = "";
    chars.forEach(function(c) {
        var cname = c.comment && c.comment.trim() ? c.comment : '(空)';
        listHTML +=
            '<div style="background:rgba(212,175,55,0.05); border:1px solid rgba(212,175,55,0.2); margin-bottom:10px; border-radius:6px; overflow:hidden;">' +
                '<div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; cursor:pointer; background:rgba(255,255,255,0.7); border-bottom:1px solid rgba(212,175,55,0.15);" onclick="toggleCharDetail(' + c.uid + ')">' +
                    '<span style="font-weight:bold; color:var(--color-primary-dark);">' + mtH(cname) + '</span>' +
                    '<div style="display:flex; align-items:center; gap:8px;" onclick="event.stopPropagation();">' +
                        '<span style="font-size:0.85rem; color:' + (c.enabled ? 'var(--color-primary-dark)' : '#666') + '; font-weight:bold;">激活</span>' +
                        '<label class="switch-ui" style="transform:scale(0.8); margin-bottom:0;">' +
                            '<input type="checkbox" ' + (c.enabled ? 'checked' : '') + ' onchange="toggleCharStatus(' + c.uid + ', this)">' +
                            '<span class="slider"></span>' +
                        '</label>' +
                    '</div>' +
                '</div>' +
                '<div id="char-detail-body-' + c.uid + '" style="display:none; padding:10px; font-size:0.95em; white-space:pre-wrap; color:var(--color-text-dark); background:rgba(253,246,227,0.8);">' + mtH(c.content||'<em style="color:gray;">该条目为空..</em>') + '</div>' +
            '</div>';
    });
    charListBox.innerHTML = listHTML;
};

window.toggleCharDetail = function(uid) {
    var detailBox = document.getElementById('char-detail-body-' + uid);
    detailBox.style.display = detailBox.style.display === "none" ? "block" : "none";
};

window.toggleCharStatus = async function(uid, checkboxEl) {
    var isEnabled = checkboxEl.checked;
    var confirm = await showCustomConfirm(isEnabled ? "确认开启该人物？" : "确认关闭该人物？");
    if (!confirm) { checkboxEl.checked = !isEnabled; return; }
    if (typeof setLorebookEntries === 'function') {
        try { await setLorebookEntries(LOREBOOK_NAME, [{ uid: uid, enabled: isEnabled }]); } catch(e) {}
    } else { showCustomAlert("未侦察到界限执行API支持！"); }
};

// ===== 投递输出 =====
function triggerSTSlashSend(storyText, finalJsonObj) {
    var compactJSONStr = JSON.stringify(finalJsonObj, null, 0);
    var tokenTagOpen = "<VariableInsert>";
    var tokenTagClose = "</VariableInsert>";
    var finalMsg = storyText + '\n' + tokenTagOpen + '\n' + compactJSONStr + '\n' + tokenTagClose;
    console.log("即将投递出的世界讯息：\n", finalMsg);
    try {
        if (typeof triggerSlash === 'function') { triggerSlash('/sendas name="《千叶童话》" ' + finalMsg); }
        else if (typeof window.parent.triggerSlash === 'function') { window.parent.triggerSlash('/sendas name="Frontend Assistant" ' + finalMsg); }
        else { showCustomAlert("\u26A0 脚本检测未连接到主核心，讯息将仅留刻在网页虚空(控制台输出)。"); }
    } catch(e) { console.error(e); showCustomAlert("通讯投递受阻！"); }
}

// ===== 工具：生成列表 HTML =====
function generateInventoryList(invObj) {
    var str = "";
    var keys = Object.keys(invObj);
    if(keys.length === 0) {
        str = '<li class="custom-row" data-ditem><span class="editable-key editable-field" data-dkey style="color:#8b5a2b;">新增物品</span>:<span class="editable-field" data-dval>物品描述。</span></li>';
    } else {
        keys.forEach(function(k) { str += '<li class="custom-row" data-ditem><span class="editable-key editable-field" data-dkey style="color:#8b5a2b;">' + mtH(k) + '</span>:<span class="editable-field" data-dval>' + mtH(invObj[k]) + '</span></li>'; });
    }
    return str;
}

function generateStorylines(lineObj) {
    var str = "";
    var keys = Object.keys(lineObj);
    if(keys.length === 0) {
        str = '<li class="empty-hint" style="opacity:0.7;">- 前路尚未明晰 -</li>';
    } else {
        keys.forEach(function(k) { str += '<li class="custom-row" style="margin-bottom:8px;" data-ditem><div class="editable-key editable-field" data-dkey style="color:var(--color-primary-dark); flex-shrink:0;">' + mtH(k) + '</div> <div class="editable-field" data-dval style="flex:1;">' + mtH(lineObj[k]) + '</div></li>'; });
    }
    return str;
}

function generateComplexStorylines(lineObj) {
    var str = "";
    var keys = Object.keys(lineObj);
    if(keys.length === 0) {
        str = '<li class="empty-hint" style="opacity:0.7;">- 前路尚未明晰 -</li>';
    } else {
        keys.forEach(function(k) {
            var subObj = lineObj[k];
            var desc = "", cond = "", guide = "";
            if(typeof subObj === 'string') {
                desc = subObj;
            } else if(typeof subObj === 'object' && subObj !== null) {
                desc = subObj["描述"] || "";
                cond = subObj["触发条件"] || "";
                guide = subObj["阶段指导"] || "";
            }
            str += '<li class="complex-stage-block" style="margin-bottom:12px; border:1px solid rgba(184,134,11,0.2); padding:8px; border-radius:6px; background:rgba(255,255,255,0.3);" data-citem>' +
                '<div style="font-weight:bold; color:var(--color-primary-dark); margin-bottom:5px; border-bottom:1px dashed rgba(184,134,11,0.3); padding-bottom:5px;" class="editable-key editable-field" data-ckey>' + mtH(k) + '</div>' +
                '<div style="display:flex; flex-direction:column; gap:6px;">' +
                    '<div class="custom-row" style="margin:0;"><span class="param-label" style="font-size:0.9em; flex-shrink:0;" data-skey>描述</span>: <div class="editable-field editable-textarea" data-sval style="flex:1;">' + mtH(desc) + '</div></div>' +
                    '<div class="custom-row" style="margin:0;"><span class="param-label" style="font-size:0.9em; flex-shrink:0;" data-skey>触发条件</span>: <div class="editable-field editable-textarea" data-sval style="flex:1;">' + mtH(cond) + '</div></div>' +
                    '<div class="custom-row" style="margin:0;"><span class="param-label" style="font-size:0.9em; flex-shrink:0;" data-skey>阶段指导</span>: <div class="editable-field editable-textarea" data-sval style="flex:1;">' + mtH(guide) + '</div></div>' +
                '</div>' +
            '</li>';
        });
    }
    return str;
}
