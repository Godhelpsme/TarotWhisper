# Azion 部署指南

本文档说明如何将 TarotWhisper 部署到 Azion Edge Platform。

## 前置要求

1. **Azion 账号**
   注册地址：https://console.azion.com/signup

2. **Azion CLI**
   安装命令：
   ```bash
   npm install -g azion
   ```

3. **已安装依赖**
   ```bash
   npm install
   ```

## 部署步骤

### 1. 登录 Azion CLI

首先安装 Azion CLI（如果尚未安装）：

```bash
npm install -g azion
```

然后登录：

```bash
azion login
```

### 2. 关联项目

在项目根目录执行：

```bash
azion link
```

按提示选择或创建 Azion 应用。

### 3. 构建应用

**方法 A：使用 OpenNext 工具（推荐）**

```bash
npx opennextjs-azion build
```

首次运行会自动创建 `open-next.config.ts` 配置文件。

**方法 B：使用 Azion CLI**

```bash
azion build --preset opennextjs
```

构建过程会：
- 自动使用 webpack（强制禁用 Turbopack）
- 通过 `@aziontech/opennextjs-azion` 适配 Next.js 构建产物
- 生成 Edge Functions 兼容的部署包到 `.open-next/` 目录

### 4. 本地预览（可选）

```bash
npx opennextjs-azion preview
# 或
azion dev --port 3000 --skip-framework-build
```

### 5. 部署到生产环境

```bash
azion deploy --skip-build --local
```

部署成功后会返回应用的 Edge URL。

## Windows 用户注意事项

**重要**：OpenNext 工具在 Windows 上有路径处理的兼容性问题，会导致 `azion build` 命令失败。

### 推荐解决方案

**方案 A：使用 WSL（推荐）**

1. 安装 WSL：
   ```powershell
   wsl --install
   ```

2. 在 WSL 中执行所有构建和部署命令：
   ```bash
   cd /mnt/d/Github/coding/TarotWhisper
   npm install
   azion build --preset opennextjs
   azion deploy --skip-build --local
   ```

**方案 B：使用 GitHub Actions 自动部署**

项目已包含 `.github/workflows/azion-deploy.yml`，配置步骤：

1. 创建 Azion Personal Token：
   ```bash
   azion create personal-token
   ```

2. 在 GitHub 仓库设置中添加 Secret：
   - 名称：`AZION_PERSONAL_TOKEN`
   - 值：上一步生成的 token

3. 推送代码到 GitHub，在 Actions 标签页手动触发部署

**方案 C：本地构建 + 手动上传（不推荐）**

虽然 `npx opennextjs-azion build` 可以在 Windows 上成功生成 `.open-next` 目录，但 Azion CLI 的部署命令需要 `.edge` 目录（由 `azion build` 生成）。由于 Windows 路径问题，这个流程无法完整执行。

### 已知问题

- `azion build --preset opennextjs` 在 Windows 上会因路径格式问题失败
- 错误信息：`Invalid path for a Cache Asset file: \\?\D:\...`
- 这是 Azion 工具链的已知限制，官方建议使用 WSL

## 环境变量配置

### 在 Azion 控制台配置

1. 登录 [Azion Console](https://console.azion.com)
2. 进入你的应用 → **Environment Variables**
3. 添加以下变量（如需使用后备 LLM）：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `FALLBACK_LLM_ENDPOINT` | 后备 LLM API 端点 | `https://api.openai.com/v1/chat/completions` |
| `FALLBACK_LLM_KEY` | 后备 LLM API 密钥 | `sk-xxx...` |
| `FALLBACK_LLM_MODEL` | 后备 LLM 模型名称 | `gpt-4o-mini` |
| `ENABLE_FALLBACK_LLM` | 是否启用后备 LLM | `true` |

### CI/CD 环境变量

如果在 CI/CD 中自动部署，设置：

```bash
export OPEN_NEXTJS_NO_INTERACTIVE_PROMPT=true
```

## 速率限制配置

**重要**：Edge Functions 无状态，原项目的内存速率限制已移除。

### 使用 Azion Edge Firewall 配置速率限制

1. 进入 Azion Console → **Edge Firewall**
2. 创建或编辑 Firewall 规则
3. 添加 **Rate Limiting** 规则：
   - **Criteria**: Request URI matches `/api/interpret`
   - **Behavior**: Rate Limit
   - **Limit**: 10 requests per hour per IP（根据需求调整）

## 技术说明

### 兼容性

| 功能 | 状态 | 说明 |
|------|------|------|
| SSR/SSG | ✅ 支持 | 自动转换为 Edge Functions |
| API Routes | ✅ 支持 | 转换为 Edge Functions |
| 流式响应（SSE） | ✅ 支持 | `ReadableStream` 原生支持 |
| 静态资源 | ✅ 支持 | 自动 CDN 分发 |
| 环境变量 | ✅ 支持 | 需在控制台配置 |
| Turbopack | ❌ 不支持 | 自动强制使用 webpack |

### 已移除功能

- **内存速率限制**：Edge 环境无状态，已移除 `Map` 实现
  - 替代方案：使用 Azion Edge Firewall 的 Rate Limiting

## 故障排查

### 构建失败：Turbopack 相关错误

**错误信息**：
```
✘ [ERROR] ⨯ Error: Failed to load chunk server/chunks/ssr/<chunk_name>.js
```

**解决方法**：
确保使用 `azion build --preset opennextjs`，该命令会自动添加 `--webpack` 标志。

### API Routes 返回 404

**原因**：未正确构建或部署。

**解决方法**：
1. 删除 `.azion` 和 `.next` 目录
2. 重新执行 `azion build --preset opennextjs`
3. 重新部署 `azion deploy --skip-build --local`

### 环境变量未生效

**原因**：环境变量仅在 Azion 控制台配置，本地 `.env` 文件不会自动同步。

**解决方法**：
在 Azion Console 的应用设置中手动添加所有环境变量。

## 参考资源

- [Azion CLI 文档](https://www.azion.com/en/documentation/products/azion-cli/overview/)
- [OpenNext for Azion GitHub](https://github.com/aziontech/opennextjs-azion)
- [Azion Edge Firewall 文档](https://www.azion.com/en/documentation/products/edge-firewall/)
