// AI 调用封装：LLM 扩写分镜 + 生图。全部走用户自己配置的 OpenAI 兼容接口。
window.API = {
  async chat(cfg, messages) {
    const url = (cfg.llmBase || '').replace(/\/$/, '') + '/chat/completions';
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (cfg.llmKey || '') },
      body: JSON.stringify({ model: cfg.llmModel, messages, response_format: { type: 'json_object' }, temperature: 0.8 })
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error('LLM ' + res.status + ' ' + t.slice(0, 200));
    }
    const j = await res.json();
    return j.choices && j.choices[0] && j.choices[0].message.content;
  },

  async image(cfg, prompt, ratio) {
    const url = (cfg.imgBase || '').replace(/\/$/, '') + (cfg.imgEndpoint || '/v1/images/generations');
    const [w, h] = String(ratio || '1:1').split(':').map(Number);
    const body = {
      model: cfg.imgModel,
      prompt,
      n: 1,
      size: pickSize(w / h),
      response_format: 'b64_json'
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (cfg.imgKey || '') },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error('IMG ' + res.status + ' ' + t.slice(0, 200));
    }
    const j = await res.json();
    const d = j.data && j.data[0];
    if (!d) throw new Error('生图返回为空');
    return d.b64_json ? 'data:image/png;base64,' + d.b64_json : d.url;
  }
};

function pickSize(aspect) {
  if (!aspect || isNaN(aspect)) return '1024x1024';
  if (aspect <= 0.8) return '1024x1536';
  if (aspect >= 1.2) return '1536x1024';
  return '1024x1024';
}
