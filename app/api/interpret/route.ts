import { NextRequest } from 'next/server';
import { DrawnCard, Spread, ApiConfig } from '@/lib/tarot/types';
import { buildInterpretationPrompt } from '@/lib/api/prompts';

interface InterpretRequest {
  question: string;
  spread: Spread;
  drawnCards: DrawnCard[];
  apiConfig: ApiConfig;
}

// 从环境变量获取后备配置
const FALLBACK_CONFIG = {
  endpoint: process.env.FALLBACK_LLM_ENDPOINT || '',
  apiKey: process.env.FALLBACK_LLM_KEY || '',
  model: process.env.FALLBACK_LLM_MODEL || 'gpt-4o-mini',
  enabled: process.env.ENABLE_FALLBACK_LLM === 'true',
};

// 注意：在 Azion Edge 环境中，应使用 Edge Firewall 的速率限制规则
// 而非内存 Map（Edge Functions 无状态，Map 会在每次请求后重置）
// 配置方法：Azion 控制台 → Edge Firewall → Rate Limiting Rules

export async function POST(request: NextRequest) {
  try {
    const body: InterpretRequest = await request.json();
    const { question, spread, drawnCards, apiConfig } = body;

    // 安全检查：如果客户端发送的 apiConfig 与内置配置完全匹配，拒绝请求
    // 这防止有人通过某种方式获取了内置配置并尝试直接使用
    if (
      FALLBACK_CONFIG.enabled &&
      apiConfig.apiKey === FALLBACK_CONFIG.apiKey &&
      apiConfig.endpoint === FALLBACK_CONFIG.endpoint
    ) {
      return new Response(
        JSON.stringify({ error: '无效的配置' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 决定使用用户配置还是后备配置
    let effectiveConfig = apiConfig;
    let usingFallback = false;

    if (!apiConfig.apiKey && FALLBACK_CONFIG.enabled && FALLBACK_CONFIG.apiKey) {
      effectiveConfig = FALLBACK_CONFIG;
      usingFallback = true;
    } else if (!apiConfig.apiKey) {
      return new Response(
        JSON.stringify({ error: '请先配置 API Key' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const prompt = buildInterpretationPrompt(question, spread, drawnCards);

    const endpoint = effectiveConfig.endpoint.trim();
    const hasChatCompletions = endpoint.includes('/chat/completions');
    const baseEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    const requestUrl = hasChatCompletions ? baseEndpoint : `${baseEndpoint}/chat/completions`;

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: effectiveConfig.model,
        messages: [
          { role: 'user', content: prompt }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // 清理错误消息，确保不泄露敏感信息
      const sanitizedError = errorText
        .replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED]')
        .replace(/sk-[a-zA-Z0-9]+/gi, '[REDACTED]')
        .replace(new RegExp(effectiveConfig.apiKey, 'g'), '[REDACTED]');

      return new Response(
        JSON.stringify({ error: `API 请求失败: ${response.status} - ${sanitizedError}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!response.body) {
      return new Response(
        JSON.stringify({ error: '上游未返回响应流' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...(usingFallback && { 'X-Using-Fallback': 'true' }),
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: '服务器错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
