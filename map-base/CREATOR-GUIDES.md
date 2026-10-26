# 公开探店视频资料页

2026-10-25。入口 http://127.0.0.1:8791/videos.html；页面是独立静态HTML，禁用JavaScript仍可阅读。地图挑选弹窗底部、地图来源说明和地点资料页页脚均有入口。

第一份资料据杉田千紘_CHIICHAN于2026年6月发布的视频简介整理，提供六家店的文字地址和章节、原作者/发布/读取日期及原页链接。一条可回到现有同名来源候选，五条地图位置待补。页面没有播放器或虚构地图点；外链打开平台原页，不承诺按章节自动跳转。AI小面图只作页面配图，标为菜品示意，不代表这六家实拍。

数据在 data/creator-guides.json，生成器 scripts/build-creator-guides.mjs 与 src/creator-guides.css 生成 dist/videos.html 和样式。普通构建包含这一页，地图单文件不嵌入静态资料页；HTTP单文件的资料链接可访问同目录的静态页，file协议隐藏这些链接。

每份作者记录保留唯一ID、准确标题、作者、发布/原页读取日期、安全原链接和播放未验证状态；门店条目保留准确名称/文字地址、类别、章节文本/秒数及可选relatedCandidateId。relatedCandidateId仅关联已有同名、入口待核、不可导航的来源候选，不表示分店已核实。未定位内容只阅读，不进入地图卡片、清单或路由。

首次整理的可复现步骤：

~~~powershell
node scripts/prepare-creator-guides.mjs
node scripts/prepare-content-review.mjs
node scripts/review-creator-guides-data.mjs
node scripts/review-food-data.mjs
npm.cmd run build
~~~

prepare-creator-guides使用已冻结原页metadata，先核对HTML哈希，不发起网络请求；它还给已有小面候选增加2026原页链接、保留2020链接并更新对应整理文案。已有两个候选的坐标与资格不改变。内容基础版本改变后，工作台旧草稿保留为旧版待复核，不静默升级或覆盖用户填写。

来源与读取限制见 ../CREATOR-GUIDES-SOURCES.md。校验报告为 CREATOR-GUIDES-DATA-QA.json、FOOD-DATA-20261025-VERIFICATION.json；浏览器报告与截图见当前VERIFICATION.md。来源缓存不作为网页媒体，也不包含在生产dist中。
