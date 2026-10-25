# pi-like-claude

把 [pi coding agent](https://github.com/earendil-works/pi) 的底部状态栏和快捷键改成 Claude Code 的手感。

> **本项目 fork 自 [liao666brant/pi-hud-footer](https://github.com/liao666brant/pi-hud-footer)**（MIT 许可）。状态栏的渲染与配置体系来自原作者，在此之上增加了 Plan 模式等改造。原始版权声明保留在 [LICENSE](LICENSE) 中。

## 相比上游的改动

| 改动 | 说明 |
|---|---|
| **新增 Plan 模式** | `Shift+Tab` 在 Plan（只读）和 Edit（默认）之间切换，对齐 Claude Code 的权限模式循环键 |
| **状态栏显示当前模式** | 第二行开头显示绿色 `Plan` / 紫色 `Edit` |
| 上下文去掉进度条 | 由 `██████░░░░ 12%` 改为 `上下文: 12% (25k/200k)`，一条省 18 字符 |
| 词元改为 Token | 中文界面下更直观 |
| git 分支区分主干/分支 | 显示为 `⎇ main 主干` / `⎇ feat-x 分支`，`main`/`master`/`trunk`/`develop`/`dev` 判定为主干 |

## 安装

```bash
pi install git:github.com/lishiyu996/pi-like-claude
```

从本地目录临时运行（不安装）：

```bash
pi -e .
```

## 使用

### Plan / Edit 模式

| 操作 | 说明 |
|---|---|
| `Shift+Tab` | 切换 Plan / Edit |
| `/plan` | 不带参数时切换 |
| `/plan on` | 进入 Plan |
| `/plan off` | 退出 Plan |

Plan 模式下：

- `edit`、`write` 工具从活跃工具集中移除，agent 无法修改文件
- `bash` 中看起来会写入的命令会被拦截：`rm`、`mv`、`cp`、重定向 `>`、`git push`、`npm install` 等
- 状态栏显示绿色 `Plan`

> 这是软性保护，不是沙箱。真要隔离请使用容器。

### 状态栏

默认布局（`classic` 样式）：

```
 [deepseek-flash (xhigh)] 上下文: 12% (25k/200k) | my-project ⎇ main 主干 | ✓ 就绪
 Edit | Token: 128k | 缓存率 81% | 耗时 10分
```

| 命令 | 说明 |
|---|---|
| `/hud-footer` | 开关状态栏 |
| `/hud-footer-reload` | 重新读取配置 |
| `/hud-footer-theme` | 切换 `classic` / `border` 样式 |
| `/hud-footer-language` | 切换中文 / 英文 |
| `/hud-footer-currency` | 切换 USD / CNY |

## 配置

配置分层，项目配置覆盖全局配置：

| 层级 | 路径 |
|---|---|
| 全局 | `~/.pi/agent/hud-footer.json` |
| 项目 | `.pi/hud-footer.json`（仅在项目受信任时读取） |

示例：

```json
{
  "enabled": true,
  "language": "zh",
  "style": "classic",
  "currency": "CNY",
  "exchangeRate": 6.8,
  "cacheRateMode": "total",
  "usageScope": "branch",
  "barWidth": 18,
  "display": {
    "all": {
      "tokenBreakdown": false,
      "tokenRate": false,
      "cost": false,
      "toolsLine": false,
      "extensionStatus": false,
      "planMode": true,
      "turnDuration": true
    }
  }
}
```

### 配置项

| 配置项 | 默认 | 说明 |
|---|---|---|
| `enabled` | `true` | 是否启用状态栏 |
| `language` | `"auto"` | `auto` / `zh` / `en` |
| `style` | `"classic"` | `classic` 三行 footer / `border` 信息嵌入输入框边框 |
| `currency` | `"USD"` | `USD` / `CNY` |
| `exchangeRate` | `6.8` | 1 USD 兑多少 CNY |
| `cacheRateMode` | `"total"` | 缓存命中率：`total` 累计 / `latest` 最近一次请求 |
| `usageScope` | `"branch"` | 词元与费用统计范围：`branch` 当前分支 / `session` 整棵会话树 |
| `barWidth` | `18` | 上下文进度条宽度（进度条已在本项目中移除，此项保留兼容） |
| `maxTools` | `7` | 工具统计最多显示几个 |

### 显示项开关（`display`）

支持 `all`、`classic`、`border` 三组，优先级 `all` < 当前样式。未配置的默认为开启。

| 字段 | 说明 |
|---|---|
| `modelName` | 模型名 |
| `thinkingLevel` | 思考等级 |
| `projectName` | 目录名 |
| `gitBranch` | git 分支（含主干/分支标识） |
| `context` | 上下文用量 |
| `tokens` | 累计 Token 总数 |
| `tokenBreakdown` | `↑输入 ↓输出 R缓存读 W缓存写` |
| `tokenRate` | 实时输出速率 |
| `cacheRate` | 缓存命中率 |
| `elapsed` | 会话耗时 |
| `cost` | 费用 |
| `state` | `✓ 就绪` / `● 运行中` |
| `toolsLine` | 工具调用统计行 |
| `extensionStatus` | 其它扩展通过 `ctx.ui.setStatus` 写入的状态 |
| `planMode` | Plan / Edit 模式标识 |
| `turnDuration` | 每轮结束通知（默认关闭） |

## 与 PiDeck 共存

如果你使用 [PiDeck](https://github.com/ayuayue/PiDeck) 桌面客户端，它自带的 `pi-deck-plan-mode.ts` 同样注册了 `Shift+Tab`，会与本项目的 `extensions/plan-mode.ts` 争抢同一个键。

二选一：

- **用 PiDeck 的**：在 `pi config` 中关闭本项目的 `plan-mode` 扩展，状态栏仍能正常显示 Plan/Edit（它读的是工具集）
- **只用 pi**：保留本项目的 `plan-mode.ts`

## 快捷键

| 功能 | 键 |
|---|---|
| Plan / Edit | `Shift+Tab`（本扩展注册） |
| 切换思考深度 | pi 默认；可用 `~/.pi/agent/keybindings.json` 改，例如 `"app.thinking.cycle": ["ctrl+shift+t", "alt+t"]` |

## 致谢

- 状态栏基础来自 [liao666brant/pi-hud-footer](https://github.com/liao666brant/pi-hud-footer)
- Plan 模式的设计思路参考 [ayuayue/PiDeck](https://github.com/ayuayue/PiDeck) 的 `pi-deck-plan-mode`

## 许可证

MIT，见 [LICENSE](LICENSE)。
