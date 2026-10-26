# 全屏城市概念素材记录

2026-10-19。用途：讨论画面风格与交互空间，不作为真实城市数据、具体门店照片或导航依据。

两张素材均通过内置 `image_gen` 工具制作，未使用 CLI/API 备用模式。输入参考为用户认可的探索图，已保存至 `D:/codex/美食网站/design/references/approved-explore.png`。背景编辑前已查看参考图。

## 文件

| 内容 | 保存位置 | 用途 |
| --- | --- | --- |
| 无 UI 城市背景 | `D:/codex/美食网站/design/concepts/city-background-v2.png` | 保存生成原图；1586 × 992 |
| 背景网页版本 | `D:/codex/美食网站/design/concepts/city-background-v2.jpg` | 仅转换 JPEG 编码，供草图内嵌 |
| 三款食物素材 | `D:/codex/美食网站/design/concepts/food-thumbnails-v2.png` | 小面、火锅、冰粉三等宽照片概念；2172 × 724 |
| 食物网页版本 | `D:/codex/美食网站/design/concepts/food-thumbnails-v2.jpg` | 仅转换 JPEG 编码；用 CSS 选择各栏 |

背景原始输出：`C:/Users/31339/.codex/generated_images/01a14d6f-e53c-77f1-8820-de9fa0ea071c/exec-dd164f75-693e-4469-b8c5-102c701820fd.png`。

食物原始输出：`C:/Users/31339/.codex/generated_images/01a14d6f-e53c-77f1-8820-de9fa0ea071c/exec-a497722e-3cec-4d34-8335-5e41be2a60db.png`。

项目使用的原图和网页版本均已落在工作区。Sharp 仅用于 JPEG 编码，没有用于编辑画面。所有视觉内容的生成/编辑均由内置生图工具完成。两次调用均指定 `transparent_background: false`，参考图片路径为用户提供的探索图。

## 城市背景最终提示词

输入角色：探索参考图是编辑目标。要求去掉原图的界面，保留城市的美术风格；不要求生成可信的地理重建。

```text
Edit target: the attached beautiful food-travel UI concept. Create ONLY a clean full-bleed background plate for rebuilding its interface as real clickable controls. Preserve this exact high-end, densely detailed miniature Chongqing-inspired river city aesthetic, soft ivory and warm beige buildings, muted teal water, olive trees, layered terrain, terraces, warm Chinese traditional waterfront architecture, large suspension bridge lower right, soft midday sunlight, subtle atmospheric depth and extremely restrained miniature tilt-shift at far edges. Preserve camera angle and scenic composition from the reference as closely as possible. This is an artistic city concept, not a verified geographical reconstruction. Remove ALL interface elements completely: remove the entire top navigation strip, logo, all text, food-photo cards, buttons, speech bubbles, map pins, numbered markers, orange route line, distance badges, bottom route dock, corner disclaimer. Naturally reconstruct buildings/trees/roads/water behind the removed UI. Extend the city naturally into the removed top bar region. No text, no logos, no labels, no graphic overlay, no orange route line anywhere. Output landscape around 16:10. Keep maximum visual sophistication, realistic miniature materials, detailed windows and trees; do not simplify to flat block map, cartoon, or low-poly toy city. The sole required change is clean removal of UI and seamless scenic reconstruction.
```

## 食物素材最终提示词

输入角色：探索图只提供食物摄影风格参考，三款菜品为新生成的通用示意素材。

```text
Use the attached UI concept only as the food-photography style reference. Generate a clean 3-column photographic contact sheet for UI concept thumbnails: exactly three equally wide panels side by side, zero margins and no gaps, on a wide landscape canvas with total aspect ratio about 3:1. Left panel: close-up Chongqing spicy thin noodles in a white bowl, scallions, chopped peanuts, appetizing red oil, warm wooden table. Center panel: close-up bubbling red Sichuan hotpot with slices of beef held by chopsticks, steam, warm dark restaurant backdrop. Right panel: close-up crystal-clear bingfen jelly in a glass bowl, amber brown-sugar syrup, hawthorn/fruit/nuts garnish, bright soft light. Each food centered fully within its own third with natural photographic edge-to-edge cropping. Match the warmth and food realism of the reference; premium appetizing food editorial photography. This is generic concept imagery, not a depiction of verified restaurants. No words, no brands, no numbers, no UI, no frames, no icons, no map, no people. Maintain all three dish identities distinct, equal 1/3 panel widths.
```

## 交互草图里的使用边界

- 城市底图只用于这一轮视觉/浮层验证，没有可旋转的模型或真实地理拓扑。
- 巷口小面、山城老火锅、街角冰粉是示例名称，未绑定已核实的真实门店。
- 线路根据示意锚点绘制，没有实际道路、距离或时间；修改顺序只演示界面响应。
- 视频窗口是静态布局示意，没有冒充真实可播放视频。
- 下一阶段的三维小样需要单独的数据来源记录、模型文件和旋转检查；不能用这两张素材代替验收。
