# OpenAI Integration Setup

## ✅ Changes Made

### 1. **Package Installation**
- ✅ Added `@genkit-ai/openai` package
- ✅ Removed dependency on `@genkit-ai/google-genai` (optional - can keep for fallback)

### 2. **Configuration Update** (`src/ai/genkit.ts`)
- ✅ Switched from Google AI to OpenAI
- ✅ Changed model from `googleai/gemini-2.5-flash` to `openai/gpt-4o-mini`
- ✅ Added comments for alternative OpenAI models

### 3. **Environment Variables** (`env.example`)
- ✅ Added `OPENAI_API_KEY` to environment variables

## 🔧 Setup Instructions

### **Step 1: Get OpenAI API Key**

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)

### **Step 2: Add API Key to Environment**

Add to your `.env` file:
```bash
OPENAI_API_KEY=sk-your_actual_api_key_here
```

### **Step 3: Restart Your Development Server**

After adding the API key:
```bash
npm run dev
```

## 🤖 Available OpenAI Models

You can change the model in `src/ai/genkit.ts`:

### **Recommended Models:**

1. **`openai/gpt-4o-mini`** (Current Default)
   - Fast and cost-effective
   - Good for structured outputs (JSON)
   - Best for ATS analysis workloads
   - ~$0.15 per 1M input tokens

2. **`openai/gpt-4o`**
   - Most capable model
   - Highest quality responses
   - Best for complex analysis
   - ~$2.50 per 1M input tokens

3. **`openai/gpt-4-turbo`**
   - High quality
   - Good balance of speed and capability
   - ~$10 per 1M input tokens

4. **`openai/gpt-3.5-turbo`**
   - Fastest and cheapest
   - Good for simple tasks
   - ~$0.50 per 1M input tokens

## 📋 Model Comparison

| Model | Speed | Quality | Cost | Best For |
|-------|-------|---------|------|----------|
| gpt-4o-mini | ⚡⚡⚡ Fast | ⭐⭐⭐ Good | 💰 Low | ATS Analysis, JSON outputs |
| gpt-4o | ⚡⚡ Medium | ⭐⭐⭐⭐⭐ Excellent | 💰💰💰 High | Complex analysis |
| gpt-4-turbo | ⚡⚡ Medium | ⭐⭐⭐⭐ Very Good | 💰💰💰💰 Very High | Advanced tasks |
| gpt-3.5-turbo | ⚡⚡⚡ Fastest | ⭐⭐ Basic | 💰 Very Low | Simple tasks |

## 🔄 Switching Models

To change the model, edit `src/ai/genkit.ts`:

```typescript
export const ai = genkit({
  plugins: [openAI()],
  model: 'openai/gpt-4o', // Change this line
});
```

## ✅ Features Using OpenAI

All ATS Checker features now use OpenAI:
- ✅ Resume Analysis (ATS scoring)
- ✅ Chat Assistant (resume improvement chat)
- ✅ Cover Letter Generation

## 🧪 Testing

After setup:
1. Add your OpenAI API key to `.env`
2. Restart the dev server
3. Go to ATS Checker page
4. Upload a resume and analyze
5. Check console for any errors

## 💡 Tips

1. **Start with gpt-4o-mini**: Best balance of cost and quality
2. **Monitor usage**: Check OpenAI dashboard for API usage
3. **Set usage limits**: Configure spending limits in OpenAI dashboard
4. **Error handling**: The app will show errors if API key is invalid

## ⚠️ Important Notes

- **API Key Security**: Never commit your API key to git
- **Rate Limits**: OpenAI has rate limits based on your plan
- **Cost Monitoring**: Monitor your usage in OpenAI dashboard
- **Fallback**: Keep Google AI package if you want fallback option

## 🐛 Troubleshooting

### **"Invalid API Key" Error**
- Check that `OPENAI_API_KEY` is set in `.env`
- Verify the key starts with `sk-`
- Make sure you restarted the server after adding the key

### **"Rate Limit Exceeded" Error**
- Check your OpenAI account limits
- Consider upgrading your plan
- Or switch to a cheaper model like `gpt-4o-mini`

### **"Model Not Found" Error**
- Verify the model name is correct
- Check OpenAI API documentation for available models
- Ensure your API key has access to the model

