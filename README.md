# CZUR Agent Skills

[简体中文](README.zh-CN.md)

Reusable Agent Skills for scanning documents with CZUR devices, processing local images, OCR, and
PDF export. This repository is the maintenance source for the six Skills; it does **not** contain
the implementation of the CZUR CLI, MCP server, SDK, or Runtime.

## Install

With Node.js 20 or later and Git available:

```bash
# Discover the available Skills without installing them
npx skills add CZUR-Developer/czur-agent-skills --list

# Choose Skills and target agents interactively
npx skills add CZUR-Developer/czur-agent-skills

# Install just the scanning Skill for Codex (project scope)
npx skills add CZUR-Developer/czur-agent-skills --skill czur-document-scan --agent codex

# Install just the OCR Skill for Claude Code (project scope)
npx skills add CZUR-Developer/czur-agent-skills --skill czur-file-ocr --agent claude-code
```

Add `--global` for user-wide installation. See the [Skills CLI](https://github.com/vercel-labs/skills)
for supported agents and installation options. You can also download this repository and copy a
complete Skill directory into your agent's configured skill directory, including its resources.
Installing a Skill does **not** register an MCP server, log in, or install CZUR Runtime.

## Configure CZUR tools

The Skills use the published [CLI](https://www.npmjs.com/package/@czur/open-cli) and
[MCP server](https://www.npmjs.com/package/@czur/open-mcp), currently pinned to `0.1.2` in these instructions.
Configure a local stdio MCP server using your host's configuration format. A common configuration is:

```json
{
  "mcpServers": {
    "czur-open": {
      "command": "npx",
      "args": ["-y", "@czur/open-mcp@0.1.2"]
    }
  }
}
```

Use Node.js 20 or later. Windows hosts may require `npx.cmd`; follow the host's stdio launch rules.
Keep the MCP server, Runtime, input images, and physical device on the same user computer.

For consumer-account authorization, leave `CZUR_OPEN_API_KEY` unset. Only when the user explicitly
requests login, run:

```bash
npx -y @czur/open-cli@0.1.2 auth login
```

Open the printed authorization URL, finish approval, and keep the command running until it completes.
The CLI and MCP share local account state. `auth status --json` checks local state only; `auth check --json`
checks remote authorization and may contact Runtime. If your environment already uses a supported
Runtime API Key, retain its existing configuration rather than mixing authorization methods. Never
paste secrets into a Skill or model conversation.

In WorkBuddy, use the CZUR connector's pre-authorization and reconnect UI instead of manually replacing
its configuration; `--workbuddy` is specific to that login flow. This public Skills repository is not a
WorkBuddy upload ZIP and does not prove marketplace approval.

## Skills

| Skill                                                              | Purpose                                                                               |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| [czur-runtime-onboarding](skills/czur-runtime-onboarding/SKILL.md) | Check the environment and guide a confirmed Runtime download and manual installation. |
| [czur-document-scan](skills/czur-document-scan/SKILL.md)           | Scan papers, books, and certificates with material-aware page and color modes.        |
| [czur-document-process](skills/czur-document-process/SKILL.md)     | Correct pages and combine supported local enhancement workflows.                      |
| [czur-image-color](skills/czur-image-color/SKILL.md)               | Optimize local image colors while preserving seals and original files.                |
| [czur-file-ocr](skills/czur-file-ocr/SKILL.md)                     | Recognize text in supported local images and export OCR documents.                    |
| [czur-export-pdf](skills/czur-export-pdf/SKILL.md)                 | Combine ordered images into image-only PDF; OCR PDF only when explicitly requested.   |

## Requirements and limits

- Runtime must be installed and reachable. Use `npx -y @czur/open-cli@0.1.2 doctor --json` to inspect it;
  a missing device or failed authorization does not by itself mean Runtime is missing.
- Device scanning needs a supported CZUR device. Local image processing, OCR, and PDF export do not
  require starting a device scan, but still require Runtime and the applicable authorization/entitlements.
- Platform, architecture, hardware, and provider availability depend on the published toolkit and official
  Runtime metadata; these Skills do not add support. Run doctor rather than guessing installer URLs.
- OCR/PDF inputs are supported local images, not arbitrary Office documents or existing PDFs.
- End an active scan before standalone enhancement/OCR. Preserve page order and instance-local task handles;
  do not resubmit operations automatically when the outcome is unknown.
- Runtime installation requires separate explicit confirmation and manual execution of a verified installer.
  Skills must not run installers, `sudo`, modify services, or weaken TLS.
- OCR quality, searchable text layers, hardware support, account entitlement, and marketplace acceptance
  require actual validation. Installing these instructions does not establish them.

## Contributing and validation

Edit Skills here, not copies installed in agents or generated connector copies. Each Skill is
self-contained: required `SKILL.md`, optional `agents/openai.yaml`, and only necessary resources.
Frontmatter uses the documented single-line string subset: `name`, `description`, and nested `metadata`.
Preserve author/version/localized metadata used by downstream connectors.

No dependency installation is needed for the local checks (Node.js 20+):

```bash
npm run check
npm test
```

Checks validate source format, file safety, JSON syntax, and local resource links, not live MCP schema,
cloud services, hardware, or OCR quality. Commit messages use the Lore protocol: an intent line describing
why, plus relevant `Constraint`, `Confidence`, `Scope-risk`, `Tested`, and `Not-tested` trailers.

## License

[Apache-2.0](LICENSE) covers the contents of this repository only. CLI/MCP packages, SDK, Runtime,
services, and hardware retain their own terms; this repository does not relicense their implementations.
