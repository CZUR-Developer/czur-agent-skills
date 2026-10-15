---
name: 'czur-runtime-onboarding'
description: 'Detect unavailable CZUR Open SDK Runtime or check for Runtime updates, then guide a user-confirmed verified download and manual installation using czur-open CLI or MCP tools.'
metadata:
  short-description: 'Safely guide CZUR Runtime installation and updates'
  display_name: 'CZUR Runtime 环境与安装引导'
  display_name_en: 'CZUR Runtime Onboarding'
  description_zh: '检查 CZUR Runtime 环境与版本，引导明确确认后的官方安装包下载和人工安装。'
  description_en: 'Detect unavailable CZUR Open SDK Runtime or check for Runtime updates, then guide a user-confirmed verified download and manual installation using czur-open CLI or MCP tools.'
  version: '1.0.0'
  author: 'CZUR'
---

# CZUR Runtime 安装与更新引导

用于用户尚未安装 Runtime、CZUR MCP 无法连接 Runtime，或用户询问 Runtime 更新时。
仅编排现有 CLI/MCP，不能猜测发布 URL、Runtime 方法、安装路径或错误码。

## 前提与命令选择

- 在用户实际运行 Runtime 的主机执行。远程 Agent、容器或远程 MCP 主机不等于用户电脑；
  无法确定目标主机时先确认，不能在错误机器上下载。
- 优先使用包含 `runtime check-updates` 的本机 `czur-open`。命令不存在或本机 CLI 过旧时，
  可使用已发布的 `npx -y @czur/open-cli@0.1.2` 作为以下所有命令的前缀。
  npm 解析失败应报告阻碍，不回退到旧版或浮动 latest；Windows 本机入口为 `czur-open.cmd`。
- npx 可能从 npm 下载 CLI，但不安装 Runtime；不执行全局 npm 安装。
- JSON 只从 stdout 解析；doctor 退出 1 可带有效的 degraded/unavailable 报告，
  更新检查退出 1 或下载退出 1 也可能带有效的失败报告。空/非法 JSON 或参数错误不能推断缺失。
- Skill 必须安装到 Agent 支持的目录；连接 MCP 本身不会自动安装或加载此 Skill。

## 1. 只读检测和版本查询

```bash
czur-open doctor --json
czur-open runtime check-updates --json
```

更新检查只访问本机匿名系统接口和官方发布元数据，不下载安装包；不需要 API Key。
缓存默认 24 小时；用户明确询问最新状态或安装完成复查时追加 `--refresh`。

- doctor `healthy`：说明服务可达，不代表 API Key 已授权或设备可用。
- `degraded`：先诊断失败检查，不把健康问题直接当作需要重装。
- `unavailable`：可能未安装、未启动或 TLS/连接配置有误，不声称已经确认未安装。
- 空设备列表、授权失败或缺 API Key 不等于缺少 Runtime。
- 更新结果 `update_available`：展示当前版本与 `latestCompatibleVersion`。
- `no_update`：无需更新，不建议降级；仅比较发布版本，不比较相同版本的 build。
- `unknown`：当前版本未确认。旧 Runtime（包括未提供新版本字段的 0.0.7）仍可正常使用；
  展示可用版本，但不能声称本机过旧或最新。`runtime_unavailable` 先结合 doctor 排障。
- `unsupported`：没有精确匹配的官方资产，不跨架构、平台或 Linux 发行版回退。
- `failed` / `stale_cache`：检查未完成，缓存仅供历史参考。不要当作最新版本结论，
  不阻止已经可用的 Runtime 业务。可按用户需要显式刷新一次，不循环重试或改用镜像。

## 2. 下载前明确确认

使用更新报告的 `platform`、`arch`、`latestCompatibleVersion`，向用户说明目标机器、
平台、版本、官方源 `https://release.czur.com`、用户缓存下载位置的性质和人工安装边界。
先获得明确的下载授权；一般性的“连接设备/扫描”请求不是下载确认。

```bash
czur-open runtime install --version <latestCompatibleVersion> --json
```

将占位符替换为已验证报告中的精确版本，不能传 `latest` 或解析安装包文件名猜版本。
用户明确指定其他版本时原样精确选择。确认时无法得到有效版本则先解决检查错误；
不要通过直接运行 install 来探测平台或版本。

下载器重新读取正式 Manifest，先验证原始字节签名，再进行架构规范化和产物选择，
并验证安装包大小/SHA-256。`x86_64` 是被支持的 `x64` 元数据别名，不是跨架构回退。

## 3. 下载结果与人工安装

- `downloaded` / `cached`：展示实际版本、平台、架构、`installerPath`、摘要和全部 `nextSteps`。
  普通 CLI 模式会 best-effort 打开安装包所在位置，但只打开文件管理器，不执行安装器；
  明确说“安装包已准备”，不能说“Runtime 已安装”。
- `unsupported` / `failed` 或任何验签/完整性失败：停止，展示经过脱敏的原因和下一步，
  不推荐未验证文件，不切换未授权下载源。
- Linux：提供返回的 Debian 安装指导，由用户自行执行系统包管理器。
- Windows：用户手动打开已验证 EXE 并完成 UAC。
- macOS：用户手动打开匹配架构的已验证 PKG 并完成系统提示；缺资产则停止。

不得自动启动安装器、执行 sudo/提权、重启服务、修改证书/hosts/系统配置、禁用 TLS 校验，
也不得自动关闭仍在使用的设备或扫描会话。更新前提醒用户结束其正在进行的设备工作。

## 4. 安装后验收

用户完成安装后执行：

```bash
czur-open doctor --json
czur-open runtime check-updates --refresh --json
```

分别报告服务健康与版本结果：healthy 才表示服务可达，缺版本字段仍是 unknown。
如需继续 MCP 业务，调用现有 `runtime.connect` 重新建立授权连接，不自动重放扫描/采集。
WorkBuddy 通过 CLI preAuth 共享账号授权；其他主机可按已有环境配置选择授权方式。
不索取、记录凭据或传入 Tool 参数，不自动启动登录。
失败则返回具体诊断，不重复安装。

## 只有 MCP 时

- 在支持的新版 MCP 中调用 `runtime.check_updates`，按需要传 `{ "refresh": true }`。
- 下载前可调用 `runtime.install` 的 `{ "confirm": false, "version": "已确认精确版本" }`
  获取无网络确认计划；展示后取得用户确认才设置 `confirm: true`。
- 仍遵守以上结果解释与人工安装边界。安装后再次检查版本，再按需 `runtime.connect`。
- 没有 CLI 时不能假装已经执行 doctor；runtime.connect 成功只证明连接与授权，
  不代表 HTTPS healthz 也已检查。工具不存在时明确要求使用支持此能力的 MCP 版本。
- MCP stdout 只能含协议帧；诊断放在结构化结果或 stderr。
