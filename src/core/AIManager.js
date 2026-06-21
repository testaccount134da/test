// =============================================================================
//  AIManager
// -----------------------------------------------------------------------------
//  Thin wrapper around the OpenRouter chat-completions API used by the !ai /
//  !ask commands. Keeps a short rolling memory per player so follow-ups feel
//  conversational. Fails gracefully when no API key is configured.
// =============================================================================

import fetch from 'node-fetch';

export default class AIManager {
  constructor(config, logger) {
    this.config = config.ai ?? {};
    this.logger = logger;
    // username -> [{role, content}, ...] short memory
    this.memory = new Map();
    this.maxMemory = 6; // last 3 exchanges
  }

  /** AI is available only when enabled AND an API key is present. */
  get available() {
    return this.config.enabled !== false && !!this.config.apiKey;
  }

  /** Reset a single player's conversation memory. */
  resetMemory(username) {
    this.memory.delete(username.toLowerCase());
  }

  /**
   * Ask the model a question on behalf of `username`.
   * Returns the answer string, or throws on failure.
   */
  async ask(username, prompt) {
    if (!this.available) {
      throw new Error('AI is not configured. Set OPENROUTER_API_KEY in your .env file.');
    }

    const key = username.toLowerCase();
    const history = this.memory.get(key) ?? [];

    const messages = [
      { role: 'system', content: this.config.systemPrompt ?? 'You are a helpful assistant.' },
      ...history,
      { role: 'user', content: prompt }
    ];

    const body = {
      model: this.config.model ?? 'openai/gpt-4o-mini',
      messages,
      max_tokens: this.config.maxTokens ?? 300,
      temperature: this.config.temperature ?? 0.7
    };

    let res;
    try {
      res = await fetch(this.config.baseUrl ?? 'https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          // OpenRouter recommends these attribution headers.
          'HTTP-Referer': 'https://github.com/minecraft-support-bot',
          'X-Title': 'Minecraft Support Bot'
        },
        body: JSON.stringify(body)
      });
    } catch (err) {
      this.logger?.error('AI', 'Network error:', err.message);
      throw new Error('Could not reach the AI service.');
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger?.error('AI', `HTTP ${res.status}: ${text.slice(0, 200)}`);
      throw new Error(`AI request failed (HTTP ${res.status}).`);
    }

    const json = await res.json();
    const answer = json?.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error('AI returned an empty response.');

    // Update rolling memory.
    history.push({ role: 'user', content: prompt });
    history.push({ role: 'assistant', content: answer });
    while (history.length > this.maxMemory) history.shift();
    this.memory.set(key, history);

    return answer;
  }
}
