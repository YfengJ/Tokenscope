# TokenScope

[English](README.md)

TokenScope 是一个 local-first 的桌面端 AI token 使用分析工具，用来查看 AI 编程工具和 LLM provider 的 token 用量、模型分布、来源分布、时间趋势、会话级预估成本和异常峰值。默认不会上传数据。

## 为什么做 TokenScope

AI 编程工具已经分散在 CLI、IDE、provider API、本地日志和代理服务里。TokenScope 希望把这些 token metadata 放到一个本地仪表盘中，帮助开发者理解用量和成本，同时避免把 prompt 或 response 内容写入数据库。

## 数据源状态

### 0.1.0 已实现

- Demo data
- Manual CSV import
- Experimental Codex local log parser
- Experimental Claude Code local log parser

### UI 脚手架 / 计划中

- OpenAI API
- Anthropic API
- OpenRouter
- LiteLLM
- Cursor
- GitHub Copilot
- Gemini CLI

| 数据源 | 状态 | 类型 | 准确性 |
| --- | --- | --- | --- |
| Demo data | 0.1.0 已实现 | Demo | 仅用于 UI 测试 |
| Manual CSV import | 已实现 | CSV import | Medium |
| Codex CLI local logs | Experimental | Local log | Experimental |
| Claude Code local logs | Experimental | Local log | Experimental/medium |
| OpenAI API | UI scaffold / planned | Official API | Planned high accuracy |
| Anthropic API | UI scaffold / planned | Official API | Planned high accuracy |
| OpenRouter | UI scaffold / planned | Official API | Planned medium accuracy |
| LiteLLM | UI scaffold / planned | Telemetry | Planned medium accuracy |
| Cursor | UI scaffold / planned | Telemetry | Planned low accuracy |
| GitHub Copilot | UI scaffold / planned | Telemetry | Planned low accuracy |
| Gemini CLI | UI scaffold / planned | Local log | Planned experimental |

除非上面明确写为已实现，否则 API connector 在 0.1.0 中尚未完整实现。

## 隐私边界

TokenScope 默认不存储 prompt 或 response 内容。解析器只保留 token metadata、模型、来源、时间戳、项目/会话 ID 和安全引用。0.1.0 默认不调用 LLM API，也不会默认上传数据。

## 准确性说明

Estimated cost 是近似值。准确性取决于数据源。Local log parser 仍是实验性能力，因为日志格式可能变化，也可能缺少字段。CSV import 的准确性取决于导入文件中的列。

## 截图

截图会在公开发布前补充。计划放在：

- `docs/screenshots/dashboard.png`
- `docs/screenshots/sources.png`
- `docs/screenshots/sessions.png`
- `docs/screenshots/settings.png`

## 从 Release 安装

预构建安装包会发布在 GitHub Releases：

- macOS 下载 `.dmg`
- Windows 下载 `.msi` 或 `.exe`
- 当前 MVP build 还未签名，macOS Gatekeeper 或 Windows SmartScreen 可能会提示风险
- 正式公开发布前建议配置 macOS notarization 和 Windows code signing

Release 页面：[github.com/YfengJ/Tokenscope/releases](https://github.com/YfengJ/Tokenscope/releases)

## 开发

需要 Node.js、pnpm、Rust，以及 Tauri 对应平台的桌面构建依赖。

```bash
pnpm install
pnpm dev
```

运行桌面应用：

```bash
pnpm tauri dev
```

## 测试

```bash
pnpm typecheck
pnpm test
cargo test --manifest-path src-tauri/Cargo.toml
pnpm build
```

## 本地打包

```bash
pnpm tauri build
```

GitHub Release 由 `v*` tag 触发。当前 workflow 会创建 draft release。正式生产分发仍需要 macOS notarization 和 Windows code signing。

## CSV 格式

CSV import 支持这些列：

```csv
timestamp,source,model,input_tokens,output_tokens,cache_read_tokens,cache_write_tokens,reasoning_tokens,total_tokens,estimated_cost_usd,project_name,session_id
```

缺失的数值字段默认是 `0`。缺失 `source` 时默认为 `manual_import`。缺失 `total_tokens` 时，TokenScope 会把 input、output、cache 和 reasoning tokens 相加。

## License

MIT. See [LICENSE](LICENSE).
