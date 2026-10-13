// AI Comic Studio — 前端主逻辑
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);

  const state = {
    themes: [],
    presets: [],
    cfg: {},
    running: false,
    currentCanvas: null,
    currentTheme: ''
  };

  // ---------- 存储 ----------
  function loadConfig() {
    try { state.cfg = JSON.parse(localStorage.getItem('acs_config')) || {}; }
    catch { state.cfg = {}; }
  }
  function saveConfig() {
    state.cfg = {
      llmBase: $('#cfgLlmBase').value.trim(),
      llmKey: $('#cfgLlmKey').value.trim(),
      llmModel: $('#cfgLlmModel').value.trim(),
      imgBase: $('#cfgImgBase').value.trim(),
      imgKey: $('#cfgImgKey').value.trim(),
      imgModel: $('#cfgImgModel').value.trim(),
      imgEndpoint: $('#cfgImgEndpoint').value.trim()
    };
    localStorage.setItem('acs_config', JSON.stringify(state.cfg));
  }
  function fillConfig() {
    $('#cfgLlmBase').value = state.cfg.llmBase || '';
    $('#cfgLlmKey').value = state.cfg.llmKey || '';
    $('#cfgLlmModel').value = state.cfg.llmModel || '';
    $('#cfgImgBase').value = state.cfg.imgBase || '';
    $('#cfgImgKey').value = state.cfg.imgKey || '';
    $('#cfgImgModel').value = state.cfg.imgModel || '';
    $('#cfgImgEndpoint').value = state.cfg.imgEndpoint || '/v1/images/generations';
  }
  function loadPresets() {
    try {
      const p = JSON.parse(localStorage.getItem('acs_presets'));
      if (Array.isArray(p) && p.length) { state.presets = p; return; }
    } catch {}
    state.presets = (window.DEFAULT_PRESETS || []).map((x) => ({ ...x }));
  }
  function savePresets() { localStorage.setItem('acs_presets', JSON.stringify(state.presets)); }

  // ---------- 工具 ----------
  function parseJSON(text) {
    if (typeof text !== 'string') return text;
    let t = text.trim();
    const m = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (m) t = m[1].trim();
    const a = t.indexOf('{'); const b = t.lastIndexOf('}');
    if (a >= 0 && b > a) t = t.slice(a, b + 1);
    return JSON.parse(t);
  }
  function fmtDialogue(d) {
    if (!d) return '';
    if (typeof d === 'string') return d;
    const who = d.speaker ? d.speaker + '：' : '';
    return who + (d.text || '');
  }
  function loadImage(src) {
    return new Promise((res, rej) => {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => res(im);
      im.onerror = () => rej(new Error('图片加载失败'));
      im.src = src;
    });
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  function cssEsc(s) {
    return (window.CSS && window.CSS.escape) ? window.CSS.escape(s) : s.replace(/"/g, '\\"');
  }

  // ---------- 分镜扩写 ----------
  async function storyboard(theme, preset, n) {
    const sys = `你是漫画分镜师。${preset.story_prompt} ${preset.bubble_prompt}\n只输出 JSON，格式：{"panels":[{"scene":"画面描述","dialogue":{"speaker":"说话人","text":"对白文字","position":"气泡位置"}}]}。不要额外解释。`;
    const user = `主题：${theme}\n请生成 ${n} 格分镜，前后要连贯成一个完整故事。`;
    const text = await window.API.chat(state.cfg, [
      { role: 'system', content: sys },
      { role: 'user', content: user }
    ]);
    return parseJSON(text);
  }

  // ---------- 拼图 ----------
  function wrapText(ctx, text, maxW) {
    const lines = [];
    let line = '';
    for (const ch of (text || '')) {
      if (ctx.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch; }
      else line += ch;
    }
    if (line) lines.push(line);
    return lines;
  }
  function stitch(imgs, captions) {
    const TW = 900;
    const capH = 56;
    const canvas = document.createElement('canvas');
    const dims = imgs.map((im) => ({ w: TW, h: Math.round(TW * im.height / im.width) }));
    let totalH = 0;
    for (let i = 0; i < imgs.length; i++) {
      totalH += dims[i].h;
      if (captions[i]) totalH += capH;
    }
    canvas.width = TW;
    canvas.height = totalH;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, TW, totalH);
    let y = 0;
    for (let i = 0; i < imgs.length; i++) {
      ctx.drawImage(imgs[i], 0, y, dims[i].w, dims[i].h);
      y += dims[i].h;
      if (captions[i]) {
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, y, TW, capH);
        ctx.fillStyle = '#111827';
        ctx.font = '20px "PingFang SC","Microsoft YaHei",sans-serif';
        ctx.textBaseline = 'middle';
        const lines = wrapText(ctx, captions[i], TW - 24);
        lines.slice(0, 2).forEach((ln, k) => {
          ctx.fillText(ln, 12, y + capH / 2 + (k - (lines.length - 1) / 2) * 26);
        });
        ctx.strokeStyle = '#e5e7eb';
        ctx.strokeRect(0, y, TW, capH);
        y += capH;
      }
    }
    return canvas;
  }

  // ---------- 任务 UI ----------
  function addTask(theme) {
    const el = document.createElement('div');
    el.className = 'task';
    el.dataset.theme = theme;
    el.innerHTML = `<span>${escapeHtml(theme)}</span><span class="status">队列中</span>`;
    $('#tasks').appendChild(el);
  }
  function setStatus(theme, s) {
    const el = $(`.task[data-theme="${cssEsc(theme)}"]`);
    if (el) el.querySelector('.status').textContent = s;
  }
  function markDone(theme) {
    const el = $(`.task[data-theme="${cssEsc(theme)}"]`);
    if (el) { el.classList.add('done'); el.querySelector('.status').textContent = '完成'; }
  }
  function markErr(theme, msg) {
    const el = $(`.task[data-theme="${cssEsc(theme)}"]`);
    if (el) { el.classList.add('err'); el.querySelector('.status').textContent = '失败：' + msg; }
  }

  // ---------- 预览 ----------
  function showPreview(canvas, theme) {
    state.currentCanvas = canvas;
    state.currentTheme = theme;
    canvas.id = 'canvas';
    const old = $('#canvas');
    if (old) old.replaceWith(canvas);
    $('#preview').hidden = false;
    $('#preview').scrollIntoView({ behavior: 'smooth' });
  }

  // ---------- 运行 ----------
  async function run() {
    if (!state.themes.length) { alert('请先导入 Excel 主题表'); return; }
    if (!state.cfg.llmBase || !state.cfg.llmKey) { alert('请先在「配置」页填写 LLM 的 Base URL 与 API Key'); return; }
    if (!state.cfg.imgBase || !state.cfg.imgKey) { alert('请先在「配置」页填写生图的 Base URL 与 API Key'); return; }
    const type = $('#formType').value;
    const n = type === 'one_image' ? 1 : Math.max(2, Math.min(20, parseInt($('#panels').value, 10) || 4));
    const ratio = $('#ratio').value;
    const preset = state.presets.find((p) => p.name === $('#preset').value) || state.presets[0];
    if (!preset) { alert('请先在配置页添加画风方案'); return; }

    state.running = true;
    $('#startBtn').disabled = true;
    $('#stopBtn').disabled = false;
    $('#tasks').innerHTML = '';

    for (const theme of state.themes) {
      if (!state.running) break;
      addTask(theme);
      try {
        let panels = [];
        if (type === 'one_image') {
          setStatus(theme, '生图中…');
          const url = await window.API.image(state.cfg, `${theme}。画风：${preset.style_prompt}`, ratio);
          panels = [{ src: url, caption: theme }];
        } else {
          setStatus(theme, '设计分镜…');
          const sb = await storyboard(theme, preset, n);
          const list = (sb && sb.panels) || [];
          for (let i = 0; i < list.length; i++) {
            if (!state.running) break;
            setStatus(theme, `生图 ${i + 1}/${list.length}…`);
            const url = await window.API.image(state.cfg, `${list[i].scene}。画风：${preset.style_prompt}`, ratio);
            panels.push({ src: url, caption: fmtDialogue(list[i].dialogue) });
          }
        }
        if (!state.running) break;
        setStatus(theme, '拼接中…');
        const imgs = [];
        for (const p of panels) imgs.push(await loadImage(p.src));
        const cv = stitch(imgs, panels.map((p) => p.caption));
        showPreview(cv, theme);
        markDone(theme);
      } catch (e) {
        markErr(theme, e.message || String(e));
      }
    }
    state.running = false;
    $('#startBtn').disabled = false;
    $('#stopBtn').disabled = true;
  }

  // ---------- 画风方案 UI ----------
  function renderPresets() {
    const sel = $('#preset');
    sel.innerHTML = state.presets.map((p) => `<option>${escapeHtml(p.name)}</option>`).join('');
    const list = $('#presetList');
    list.innerHTML = state.presets.map((p, i) =>
      `<div class="preset-item"><span>${escapeHtml(p.name)}</span>
        <span>
          <button data-edit="${i}">编辑</button>
          <button data-del="${i}">删除</button>
        </span></div>`).join('');
    list.querySelectorAll('[data-edit]').forEach((b) => {
      b.onclick = () => {
        const p = state.presets[+b.dataset.edit];
        $('#pName').value = p.name;
        $('#pStyle').value = p.style_prompt;
        $('#pStory').value = p.story_prompt;
        $('#pBubble').value = p.bubble_prompt;
      };
    });
    list.querySelectorAll('[data-del]').forEach((b) => {
      b.onclick = () => {
        state.presets.splice(+b.dataset.del, 1);
        savePresets();
        renderPresets();
      };
    });
  }
  function addPreset() {
    const name = $('#pName').value.trim();
    if (!name) { alert('请填方案名'); return; }
    const p = {
      name,
      style_prompt: $('#pStyle').value.trim(),
      story_prompt: $('#pStory').value.trim(),
      bubble_prompt: $('#pBubble').value.trim()
    };
    const idx = state.presets.findIndex((x) => x.name === name);
    if (idx >= 0) state.presets[idx] = p; else state.presets.push(p);
    savePresets();
    renderPresets();
    $('#pName').value = ''; $('#pStyle').value = ''; $('#pStory').value = ''; $('#pBubble').value = '';
  }

  // ---------- Excel ----------
  function handleXlsx(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const themes = [];
        for (const r of rows) {
          const v = r && r[0];
          if (v != null && String(v).trim() !== '') themes.push(String(v).trim());
        }
        state.themes = themes;
        $('#themeCount').textContent = `已读取 ${themes.length} 个主题`;
      } catch (err) {
        alert('Excel 解析失败：' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // ---------- 事件绑定 ----------
  function bind() {
    document.querySelectorAll('.tab').forEach((t) => {
      t.onclick = () => {
        document.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'));
        t.classList.add('active');
        const tab = t.dataset.tab;
        $('#tab-create').hidden = tab !== 'create';
        $('#tab-config').hidden = tab !== 'config';
      };
    });
    $('#formType').onchange = () => {
      $('#panelCountWrap').style.display = $('#formType').value === 'one_image' ? 'none' : 'flex';
    };
    $('#xlsx').onchange = (e) => { if (e.target.files[0]) handleXlsx(e.target.files[0]); };
    $('#startBtn').onclick = run;
    $('#stopBtn').onclick = () => { state.running = false; };
    $('#downloadBtn').onclick = () => {
      if (!state.currentCanvas) return;
      state.currentCanvas.toBlob((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (state.currentTheme || 'comic') + '.png';
        a.click();
        URL.revokeObjectURL(a.href);
      });
    };
    $('#saveTrackBtn').onclick = () => {
      const track = $('#track').value.trim();
      if (!track) { alert('请填赛道名'); return; }
      const works = JSON.parse(localStorage.getItem('acs_works') || '[]');
      works.push({ theme: state.currentTheme, track, time: new Date().toISOString() });
      localStorage.setItem('acs_works', JSON.stringify(works));
      alert('已转存到赛道：' + track);
    };
    $('#saveCfg').onclick = () => { saveConfig(); alert('配置已保存'); };
    $('#addPreset').onclick = addPreset;
  }

  function init() {
    loadConfig();
    fillConfig();
    loadPresets();
    renderPresets();
    bind();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
