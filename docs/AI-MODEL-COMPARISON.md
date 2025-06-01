# AI Model Comparison for Transaction Categorization

## OpenAI Models

### Current Model: GPT-3.5-turbo
- **Cost**: $0.0005/1K input tokens, $0.0015/1K output tokens
- **Speed**: Very fast (typically 500-1000ms)
- **Accuracy**: Good for transaction categorization
- **Context Window**: 16K tokens
- **Best for**: Cost-effective batch processing

### Alternative OpenAI Models

#### GPT-4o (GPT-4 Omni)
- **Cost**: $0.005/1K input tokens, $0.015/1K output tokens (10x more than GPT-3.5)
- **Speed**: Moderate (1-3 seconds)
- **Accuracy**: Excellent, better understanding of complex transactions
- **Context Window**: 128K tokens
- **Best for**: High accuracy requirements, complex categorization rules

#### GPT-4o-mini
- **Cost**: $0.00015/1K input tokens, $0.0006/1K output tokens (cheaper than GPT-3.5!)
- **Speed**: Fast (similar to GPT-3.5)
- **Accuracy**: Very good, between GPT-3.5 and GPT-4
- **Context Window**: 128K tokens
- **Best for**: Best value - cheaper and often better than GPT-3.5

#### GPT-4-turbo
- **Cost**: $0.01/1K input tokens, $0.03/1K output tokens (most expensive)
- **Speed**: Slower (2-5 seconds)
- **Accuracy**: Highest accuracy, best reasoning
- **Context Window**: 128K tokens
- **Best for**: Most complex categorization needs

## Cost Comparison Example

For a typical bank statement with 100 transactions:
- Input: ~2,000 tokens (transaction descriptions + prompt)
- Output: ~500 tokens (categories)

**Monthly cost for 1,000 statements:**

| Model | Input Cost | Output Cost | Total | vs Current |
|-------|------------|-------------|--------|------------|
| GPT-3.5-turbo (current) | $1.00 | $0.75 | $1.75 | - |
| GPT-4o-mini | $0.30 | $0.30 | $0.60 | -66% |
| GPT-4o | $10.00 | $7.50 | $17.50 | +900% |
| GPT-4-turbo | $20.00 | $15.00 | $35.00 | +1900% |

## Implementation Guide

To switch models, update the model name in `/src/services/bankStatement/openai.ts`:

```typescript
const response = await this.openai.chat.completions.create({
  model: 'gpt-4o-mini',  // Change this line
  messages: [
    // ... existing messages
  ],
  temperature: 0.3,
  response_format: { type: 'json_object' },
})
```

## Recommendations

1. **For Cost Optimization**: Switch to `gpt-4o-mini`
   - 66% cheaper than current GPT-3.5-turbo
   - Often better accuracy
   - Same speed

2. **For Better Accuracy**: Use `gpt-4o`
   - 10x more expensive but significantly better
   - Worth it for high-value transactions or complex businesses

3. **For Maximum Performance**: Use `gpt-4-turbo`
   - Only if accuracy is critical and cost is not a concern
   - Best for financial institutions or high-stakes applications

## Alternative Providers

### Claude (Anthropic)
- **Claude 3 Haiku**: $0.00025/1K input, $0.00125/1K output (very competitive)
- **Claude 3.5 Sonnet**: $0.003/1K input, $0.015/1K output
- **Claude 3 Opus**: $0.015/1K input, $0.075/1K output

### Open Source Options (Self-hosted)
- **Llama 3**: Free but requires infrastructure
- **Mistral**: Free but requires infrastructure
- **Pros**: No API costs, full control
- **Cons**: Infrastructure costs, maintenance, potentially lower accuracy

## Quick Switch Guide

To change to GPT-4o-mini (recommended):

```bash
# 1. Update the model in the code
# In /src/services/bankStatement/openai.ts, line 127:
model: 'gpt-4o-mini',

# 2. Test with a sample statement
# 3. Monitor accuracy and costs
```