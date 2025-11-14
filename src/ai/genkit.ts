import {genkit} from 'genkit';
import {openAI} from '@genkit-ai/compat-oai/openai';

// Initialize OpenAI plugin with API key from environment
// The API key will be read from OPENAI_API_KEY environment variable if not provided
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.OPENAI_API_KEY, // Optional: defaults to OPENAI_API_KEY env var
    }),
  ],
  model: 'openai/gpt-4o', // Fast and cost-effective model, good for structured outputs
  // Alternative models you can use:
  // 'openai/gpt-4o' - Most capable, best quality
  // 'openai/gpt-4-turbo' - High quality, good balance
  // 'openai/gpt-4o-mini' - Fast and efficient (current default)
  // 'openai/gpt-3.5-turbo' - Fastest and cheapest
});
