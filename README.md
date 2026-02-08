# NARUTO-GAMES
Naruto themed games. Created mostly by AI like Copilot and DeepSeek.
# 🏃‍♂️ 木叶疾风传 - 火影忍者跑酷游戏

一款基于火影忍者主题的横版跑酷游戏，在木叶村的屋顶上疾驰，收集忍术卷轴，躲避障碍，解锁新角色！

## 🎮 在线游玩

访问：[https://WantWantMilk.github.io/NARUTO-GAMES/](https://WantWantMilk.github.io/NARUTO-GAMES/)

## ✨ 游戏特色

- **经典火影主题**：还原木叶村场景，火影忍者经典元素
- **多角色系统**：解锁鸣人、佐助、小樱等角色，每个角色有独特技能
- **丰富游戏机制**：跳跃、二段跳、特殊技能、连击系统
- **多样化道具**：忍术卷轴、兵粮丸、苦无、医疗包等
- **智能障碍系统**：多种障碍类型，难度随游戏进度增加
- **视觉效果**：多层视差背景、粒子特效、屏幕震动、光影效果
- **完整音效**：背景音乐、跳跃音效、收集音效、碰撞音效
- **进度保存**：自动保存最高分和解锁进度

## 🕹️ 操作方法

### 移动设备
- **点击屏幕**：跳跃（普通跳跃）
- **长按屏幕**：跳得更高
- **点击UI按钮**：菜单操作

### 电脑端
- **空格键 / ↑键**：跳跃
- **P键**：暂停/继续游戏
- **M键**：切换声音
- **R键**：重新开始
- **ESC键**：返回主菜单
- **1/2/3键**：快速选择角色

## 📁 项目结构

naruto-runner-game/
├── index.html              # 主HTML文件
├── css/
│   └── style.css          # 响应式样式表
├── js/
│   ├── utils.js           # 工具函数库
│   ├── background.js      # 背景管理系统
│   ├── player.js          # 角色控制系统
│   ├── obstacle.js        # 障碍物系统
│   ├── item.js            # 道具系统
│   └── game.js            # 游戏主引擎
├── assets/                # 资源文件（图片、音频）
│   ├── images/
│   └── audio/
└── README.md              # 项目说明

```

## 🚀 本地运行

1. 克隆项目到本地：
```bash
git clone https://github.com//
```

1. 进入项目目录：

```bash
cd 仓库名
```

1. 使用任意HTTP服务器运行：

· 使用Python：python -m http.server 8000
· 使用Node.js：npx http-server
· 或直接双击 index.html 在浏览器中打开

1. 在浏览器中访问：http://localhost:8000

🛠️ 技术栈

· HTML5 Canvas：游戏图形渲染
· ES6+ JavaScript：游戏逻辑
· CSS3：响应式布局和动画
· LocalStorage：数据持久化
· Web Audio API：声音管理
· ResizeObserver：响应式布局

🎯 游戏机制详解

角色系统

· 漩涡鸣人：默认角色，平衡型
· 宇智波佐助：需要100卷轴解锁，高速度高跳跃
· 春野樱：需要500卷轴解锁，治疗能力
· 旗木卡卡西：需要1000卷轴解锁，雷切技能

道具系统

· 忍术卷轴 📜：+50分，解锁角色所需
· 兵粮丸 💊：短暂提升移动速度
· 苦无 🗡️：一次性武器，可破坏障碍
· 医疗包 🏥：恢复生命值
· 查克拉球 💜：立即激活角色特殊能力

障碍系统

· 岩石 🪨：基础障碍，跳过即可
· 沟壑 🕳️：需要跳跃通过
· 移动障碍 🏃：左右或上下移动
· 尖刺 🌵：高伤害障碍
· 手里剑 ⭐：旋转飞行的远程攻击

连击系统

· 连续收集物品可建立连击
· 连击数越高，得分乘数越大
· 5连击开始有额外奖励

📱 兼容性

· ✅ Chrome 60+
· ✅ Firefox 55+
· ✅ Safari 11+
· ✅ Edge 79+
· ✅ iOS Safari 11+
· ✅ Android Chrome 60+

🔧 开发说明

添加新角色

1. 在 player.js 的 loadCharacterStats 方法中添加角色配置
2. 在 index.html 中添加角色选择卡片
3. 在 game.js 的 characterUnlockRequirements 中添加解锁条件

添加新道具

1. 在 item.js 的 itemTypes 中添加道具配置
2. 在 game.js 的 handleItemCollection 方法中添加道具效果

添加新障碍

1. 在 obstacle.js 的 types 中添加障碍配置
2. 添加对应的绘制和更新逻辑

性能优化

· 使用对象池管理游戏对象
· 使用离屏Canvas缓存静态元素
· 按需更新和渲染
· 使用防抖处理高频事件

📄 许可证

MIT License

🙏 致谢

· 火影忍者版权归岸本齐史/集英社所有
· 游戏仅供学习和娱乐目的
· 背景图片来自官方火影忍者壁纸库

🤝 贡献指南

1. Fork 本项目
2. 创建功能分支：git checkout -b feature/新功能
3. 提交更改：git commit -m '添加新功能'
4. 推送到分支：git push origin feature/新功能
5. 提交Pull Request

📞 支持

如有问题或建议，请提交Issue或通过GitHub讨论区联系。

---

愿火之意志与你同在！ 🔥

```

## 📦 现在你的游戏项目包含以下完整文件：

1. `index.html` - 主页面结构
2. `css/style.css` - 样式文件
3. `js/utils.js` - 工具函数
4. `js/background.js` - 背景系统
5. `js/player.js` - 角色系统
6. `js/obstacle.js` - 障碍物系统
7. `js/item.js` - 道具系统
8. `js/game.js` - 游戏主引擎
9. `README.md` - 项目说明

## 🚀 启用GitHub Pages的步骤：

1. 在GitHub仓库页面，点击 **Settings**
2. 左侧找到 **Pages**
3. 在 **Source** 部分：
   - 选择 **Branch: main** (或master)
   - 选择 **/(root)** 文件夹
4. 点击 **Save**
5. 等待1-2分钟，访问你的游戏链接

## 💡 注意事项：

1. **音频文件**：代码中引用了音频文件但实际不存在，你需要：
   - 创建 `assets/audio/` 文件夹
   - 添加音效文件（jump.mp3, collect.mp3等）
   - 或注释掉音频相关代码

2. **首次运行**：由于跨域限制，直接打开HTML文件可能无法加载背景图片
   - 建议通过HTTP服务器运行（如VS Code的Live Server）
   - 或上传到GitHub Pages后运行

3. **移动端适配**：游戏已适配移动端，但可能需要调整触摸灵敏度