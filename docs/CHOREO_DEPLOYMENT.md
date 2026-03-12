# TarotWhisper - Choreo 部署指南

本文档提供在 WSO2 Choreo 平台上部署 TarotWhisper 的完整步骤。

## 前置要求

1. **GitHub 账号**：项目代码需托管在 GitHub 仓库
2. **Choreo 账号**：访问 [console.choreo.dev](https://console.choreo.dev) 注册
3. **OpenAI API Key**（可选）：如需启用后备 LLM 配置

## 项目准备

### 1. 确认必需文件

确保项目根目录包含以下文件：

```
TarotWhisper/
├── Dockerfile              # ✅ 已创建（符合 Choreo USER 10001 要求）
├── .dockerignore           # ✅ 已创建（优化构建速度）
├── next.config.ts          # ✅ 已配置 output: 'standalone'
└── package.json
```

### 2. 推送代码到 GitHub

```bash
cd D:\Github\coding\TarotWhisper
git add .
git commit -m "Add Choreo deployment configuration"
git push origin main
```

## Choreo 部署步骤

### 第一步：创建 Web Application 组件

1. 登录 [Choreo Console](https://console.choreo.dev)
2. 选择或创建一个 **Project**
3. 点击 **+ Create** → 选择 **Web Application** 卡片
4. 点击 **Authorize with GitHub** 并授权 Choreo 访问你的仓库

### 第二步：配置仓库连接

| 配置项 | 值 |
|--------|-----|
| **GitHub Account** | 选择你的 GitHub 账号 |
| **GitHub Repository** | 选择 TarotWhisper 仓库 |
| **Branch** | `main`（或你的主分支名） |
| **Component Directory** | `/`（如果项目在根目录）或 `/TarotWhisper`（如果在子目录） |

### 第三步：配置构建设置

| 配置项 | 值 |
|--------|-----|
| **Build Preset** | 选择 **Dockerfile** |
| **Dockerfile Path** | `/Dockerfile` |
| **Docker Context Path** | `/` |
| **Port** | `3000` |

### 第四步：组件命名

| 配置项 | 示例值 |
|--------|---------|
| **Display Name** | `TarotWhisper` |
| **Unique Name** | `tarotwhisper`（自动生成，可修改） |
| **Description** | `AI-powered Tarot reading web application` |

点击 **Create** 完成组件创建。

### 第五步：配置环境变量

1. 在左侧导航栏点击 **DevOps** → **Configs & Secrets**
2. 点击 **+ Create** → 选择 **Secret**
3. 添加以下环境变量：

#### 必需环境变量

| Key | Value | 说明 |
|-----|-------|------|
| `NODE_ENV` | `production` | Node.js 运行环境 |
| `NEXT_TELEMETRY_DISABLED` | `1` | 禁用 Next.js 遥测 |

#### 可选环境变量（后备 LLM 配置）

如果需要启用服务端后备 LLM（用户无需自带 API Key）：

| Key | Value | 说明 |
|-----|-------|------|
| `ENABLE_FALLBACK_LLM` | `true` | 启用后备配置 |
| `FALLBACK_LLM_ENDPOINT` | `https://api.openai.com/v1/chat/completions` | LLM API 端点 |
| `FALLBACK_LLM_KEY` | `sk-proj-xxxxx` | 你的 OpenAI API Key |
| `FALLBACK_LLM_MODEL` | `gpt-4o-mini` | 使用的模型 |
| `RATE_LIMIT_PER_HOUR` | `10` | 每 IP 每小时请求限制 |

**配置方式**：
- **Mount Type**: 选择 **Environment Variables**
- **Config Type**: 选择 **Secret**（保护敏感信息）

### 第六步：构建和部署

#### 6.1 触发构建

1. 点击左侧 **Build** 菜单
2. 选择最新的 commit
3. 点击 **Build** 按钮

构建过程包括：
- ✅ Trivy 安全扫描
- ✅ Docker 镜像构建
- ✅ 镜像推送到 Choreo Registry

#### 6.2 部署到 Development 环境

1. 构建成功后，点击左侧 **Deploy** 菜单
2. 点击 **Configure & Deploy** 按钮
3. 配置认证设置（可选）：
   - **Authentication**: 选择 **None**（公开访问）或配置 OAuth
4. 点击 **Deploy** 按钮

#### 6.3 验证部署

1. 等待状态变为 **Active**（绿色）
2. 点击 **Web App URL** 打开应用
3. 测试核心功能：
   - 首页加载
   - 选择牌阵
   - 抽取塔罗牌
   - AI 解读（测试 `/api/interpret` 流式响应）

### 第七步：推广到生产环境

1. 在 Development 环境测试通过后，点击 **Promote** 按钮
2. 选择 **Production** 环境
3. 确认部署配置
4. 点击 **Promote** 完成推广

#### 自定义域名（可选）

1. 点击 **Settings** → **Custom Domains**
2. 添加你的域名（如 `tarot.yourdomain.com`）
3. 按照提示配置 DNS CNAME 记录
4. 等待 SSL 证书自动签发

## 故障排查

### 构建失败

**问题**：Dockerfile 构建错误

**解决方案**：
1. 检查 `next.config.ts` 是否包含 `output: 'standalone'`
2. 确认 `package.json` 中 Node.js 版本兼容（需要 18+）
3. 查看 Build Logs 中的详细错误信息

### 部署后无法访问

**问题**：Web App URL 返回 502/503

**解决方案**：
1. 检查 Dockerfile 中的 `EXPOSE 3000` 和 Choreo 配置的 Port 是否一致
2. 确认 `USER 10001` 指令存在（Choreo 强制要求）
3. 查看 Runtime Logs 检查应用启动错误

### 流式响应中断

**问题**：`/api/interpret` SSE 流式输出被截断

**解决方案**：
1. 检查 LLM API 响应时间是否过长
2. 在 Choreo 的 **Settings** → **Timeouts** 中增加超时时间
3. 考虑在客户端实现重试机制

### 环境变量未生效

**问题**：API Key 配置无效

**解决方案**：
1. 确认环境变量 Mount Type 选择了 **Environment Variables**
2. 重新部署组件（环境变量修改需要重新部署）
3. 在 Runtime Logs 中搜索 `ENABLE_FALLBACK_LLM` 确认是否加载

## 监控和维护

### 查看日志

1. **Build Logs**: Build → 选择构建记录 → View Logs
2. **Runtime Logs**: Deploy → 选择环境 → View Logs
3. **Access Logs**: Observability → Logs

### 性能监控

1. 点击 **Observability** → **Metrics**
2. 查看关键指标：
   - Request Rate（请求速率）
   - Response Time（响应时间）
   - Error Rate（错误率）
   - CPU/Memory Usage（资源使用）

### 自动扩缩容

Choreo 默认启用自动扩缩容（基于 KEDA）：
- **最小副本数**: 1
- **最大副本数**: 可在 Settings → Scaling 中配置
- **Scale to Zero**: 支持（低流量时自动缩容到 0）

## 成本优化

### Choreo 定价模式

- **Free Tier**: 包含基础资源配额
- **按需计费**: 根据实际使用的 CPU/内存/流量计费
- **FinOps Dashboard**: Observability → Cost 查看详细费用

### 优化建议

1. **启用 Scale to Zero**: 低流量时段自动缩容
2. **配置合理的资源限制**: Settings → Resources
3. **使用 CDN**: 静态资源（塔罗牌图片）可考虑外部 CDN
4. **监控 LLM API 调用**: 如启用后备配置，设置合理的 `RATE_LIMIT_PER_HOUR`

## 安全最佳实践

1. **API Key 保护**
   - 始终使用 Secret 类型存储 `FALLBACK_LLM_KEY`
   - 定期轮换 API Key
   - 在 OpenAI Dashboard 设置月度预算限制

2. **访问控制**
   - 生产环境考虑启用 OAuth 认证
   - 使用 Choreo 的 Rate Limiting 功能

3. **安全扫描**
   - Choreo 自动执行 Trivy 镜像扫描
   - 定期更新依赖包（`npm audit fix`）

## 持续集成/部署

### 自动部署

Choreo 默认启用 CI/CD：
- 每次 push 到配置的分支会自动触发构建
- 可在 Settings → Build Triggers 中配置触发条件

### 手动部署

如需禁用自动部署：
1. Settings → Build Triggers
2. 取消勾选 **Auto Deploy**
3. 后续通过 Build 页面手动触发

## 回滚策略

如果新版本出现问题：
1. 点击 Deploy → 选择环境
2. 在 Deployment History 中找到上一个稳定版本
3. 点击 **Rollback** 按钮

## 参考资源

- [Choreo 官方文档](https://wso2.com/choreo/docs/)
- [Next.js Standalone 模式](https://nextjs.org/docs/advanced-features/output-file-tracing)
- [Docker 多阶段构建](https://docs.docker.com/build/building/multi-stage/)
- [TarotWhisper 项目文档](../README.md)

## 技术支持

- **Choreo 社区**: [WSO2 Discord](https://discord.gg/wso2)
- **项目 Issues**: [GitHub Issues](https://github.com/your-username/TarotWhisper/issues)
