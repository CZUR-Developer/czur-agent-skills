# CZUR Agent Skills

[English](README.md)

用于 CZUR 设备文档扫描、本地图片处理、OCR 和 PDF 导出的 Agent Skills。
本仓库是六个 Skill 的唯一维护源，不包含 CLI、MCP Server、SDK 或 Runtime 的实现代码。

## 安装

准备 Node.js 20 或以上版本及 Git，然后执行：

```bash
# 只列出 Skill，不安装
npx skills add CZUR-Developer/czur-agent-skills --list

# 交互选择 Skill 和目标 Agent
npx skills add CZUR-Developer/czur-agent-skills

# 为 Codex 安装扫描 Skill（项目级）
npx skills add CZUR-Developer/czur-agent-skills --skill czur-document-scan --agent codex

# 为 Claude Code 安装 OCR Skill（项目级）
npx skills add CZUR-Developer/czur-agent-skills --skill czur-file-ocr --agent claude-code
```

加 `--global` 可安装到用户级目录。支持的 Agent 和选项见
[Skills CLI](https://github.com/vercel-labs/skills)。也可下载本仓库，将完整的单个 Skill 目录
连同资源复制到目标 Agent 配置的技能目录。
**安装 Skill 不会自动配置 MCP、登录账号或安装 Runtime。**

## 配置 CZUR 工具

使用已发布的 [CLI](https://www.npmjs.com/package/@czur/open-cli) 和
[MCP Server](https://www.npmjs.com/package/@czur/open-mcp)。MCP 配置使用 npm 的 `latest`
版本，CLI 示例仍固定为 `0.1.2`。
在 Agent 的 MCP 设置中配置本地 stdio 服务，常见格式为：

```json
{
  "mcpServers": {
    "czur-open": {
      "command": "npx",
      "args": ["-y", "@czur/open-mcp@latest"]
    }
  }
}
```

使用 Node.js 20 或以上版本。Windows 主机可能需要 `npx.cmd`，以 Agent 的进程启动规则为准。
MCP、Runtime、输入图片和物理设备应在同一用户电脑。

普通账号授权时保持 `CZUR_OPEN_API_KEY` 未设置，仅在用户明确请求登录时执行：

```bash
npx -y @czur/open-cli@0.1.2 auth login
```

打开输出的授权链接，完成审批，并保持命令运行到结束。CLI 和 MCP 共享本地账号状态。
`auth status --json` 只检查本地状态；`auth check --json` 会校验远端授权，可能访问 Runtime。
已有合法 Runtime API Key 配置时使用原有方式，不混用授权方式，不向 Agent 粘贴密钥。

WorkBuddy 用户使用 CZUR 连接器的预授权和重新连接入口；`--workbuddy` 只用于对应登录流程。
本仓库不是 WorkBuddy 上传包，内容公开不代表已通过市场审核。

## 六个 Skill

| Skill                                                              | 用途                                                     |
| ------------------------------------------------------------------ | -------------------------------------------------------- |
| [czur-runtime-onboarding](skills/czur-runtime-onboarding/SKILL.md) | 检查环境，指导明确确认后的 Runtime 下载与人工安装。      |
| [czur-document-scan](skills/czur-document-scan/SKILL.md)           | 扫描纸张、书籍和证件，选择页面处理与色彩模式。           |
| [czur-document-process](skills/czur-document-process/SKILL.md)     | 页面校正与当前支持的本地增强流程。                       |
| [czur-image-color](skills/czur-image-color/SKILL.md)               | 优化本地图片色彩，保留印章及原始文件。                   |
| [czur-file-ocr](skills/czur-file-ocr/SKILL.md)                     | 识别支持的本地图片文字，导出 OCR 文档。                  |
| [czur-export-pdf](skills/czur-export-pdf/SKILL.md)                 | 按顺序合成 PDF，默认图片型，明确需要文字层时才执行 OCR。 |

## 前提与边界

- Runtime 必须已安装且可达；使用 `npx -y @czur/open-cli@0.1.2 doctor --json` 检查。
  无设备或授权失败不等于 Runtime 缺失。
- 设备扫描需要受支持的 CZUR 硬件。本地图片处理、OCR 和 PDF 不必启动设备扫描，
  但仍需要 Runtime 和相应的账号授权、Provider 权益。
- 系统、架构、设备和 Provider 支持以已发布工具及官方 Runtime 元数据为准；Skill 不增加支持范围。
  不猜测安装包地址，先运行 doctor。
- OCR/PDF 输入是支持的本地图片，不承诺任意 Office/PDF 转换或现有 PDF 合并。
- 扫描结束后先释放扫描，再提交独立增强或 OCR；保留页序、实例内句柄，不自动重放结果未知的操作。
- Runtime 安装必须单独明确确认并人工执行经过校验的安装器；Skill 不执行安装器、sudo、服务修改或 TLS 降级。
- OCR 质量、文字层、设备支持、服务权益及市场验收需要实际验证，不能由安装 Skill 推断成功。

## 维护与验证

在本仓库维护 Skill，不修改 Agent 安装副本或连接器生成副本。每个 Skill 是独立目录，
包含 `SKILL.md`、可选的 `agents/openai.yaml` 以及必要资源。Frontmatter 使用单行字符串子集：
`name`、`description` 和嵌套 `metadata`，保留供下游连接器使用的作者、版本及双语元数据。

无需安装依赖，使用 Node.js 20 或以上版本执行：

```bash
npm run check
npm test
```

检查格式、文件安全、JSON 语法和资源引用，不验证真实 MCP schema、云服务、硬件或 OCR 质量。
提交信息采用 Lore 协议：首行说明修改原因，按需附带 Constraint、Confidence、Scope-risk、Tested、
Not-tested 等决策记录。

## 许可证

[Apache-2.0](LICENSE) 只覆盖本仓库内容。CLI/MCP、SDK、Runtime、在线服务和硬件各自遵循原有条款，
不因本仓库公开而改变其实现代码的许可。
