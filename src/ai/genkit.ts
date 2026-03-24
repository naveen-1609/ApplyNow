import {genkit} from 'genkit';
import openAICompatible from '@genkit-ai/compat-oai';
import {openAI} from '@genkit-ai/compat-oai/openai';

export const ANTHROPIC_PRIMARY_MODEL = 'anthropic/claude-sonnet-4-6';
export const OPENAI_FALLBACK_MODEL = 'openai/gpt-4o';

export function readServerEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const anthropicApiKey = readServerEnv('ANTHROPIC_ADMIN_API_KEY');
const openAiApiKey = readServerEnv('OPENAI_API_KEY');

export const ai = genkit({
  plugins: [
    openAICompatible({
      name: 'anthropic',
      apiKey: anthropicApiKey,
      baseURL: process.env.ANTHROPIC_OPENAI_BASE_URL || 'https://api.anthropic.com/v1/',
    }),
    openAI({
      apiKey: openAiApiKey,
    }),
  ],
  model: anthropicApiKey ? ANTHROPIC_PRIMARY_MODEL : OPENAI_FALLBACK_MODEL,
});
