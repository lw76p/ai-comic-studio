// 默认画风方案（用户可在「配置」页增删改，存 localStorage）
window.DEFAULT_PRESETS = [
  {
    name: '日系治愈',
    style_prompt: '日系扁平漫画风，粗黑描边，柔和水彩上色，温暖治愈色调，4k，高清',
    story_prompt: '把主题拆成多格分镜，每格输出 JSON：{scene: 画面描述(人物动作/所处环境/镜头角度), transition: 与上一格的衔接}。整篇保持统一画风。',
    bubble_prompt: '每格设计 1-2 句简短对白，注明说话人、气泡位置、文字内容，让画面像在讲故事。'
  },
  {
    name: '美式卡通',
    style_prompt: '美式卡通漫画风，饱满色块，粗轮廓线，动态夸张，4k',
    story_prompt: '把主题拆成多格分镜，强调动作张力与镜头变化，每格输出 JSON：{scene, transition}。',
    bubble_prompt: '对白简短有力，符合美式幽默节奏。'
  },
  {
    name: '写实插画',
    style_prompt: '写实数字插画风，电影感打光，细腻质感，8k',
    story_prompt: '把主题拆成电影分镜，每格输出 JSON：{scene, transition}，注重光影与氛围。',
    bubble_prompt: '对白用简洁字幕风格，克制不抢画面。'
  }
];
