import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = 'claude-sonnet-4-20250514'
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

export async function analyzeWithClaude<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ result: T; model: string }> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      })

      const textBlock = response.content.find(b => b.type === 'text')
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('No text response from Claude')
      }

      // Extract JSON from the response (handles markdown code blocks)
      let jsonStr = textBlock.text
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim()
      }

      // Try to find JSON object or array in the response
      const objMatch = jsonStr.match(/\{[\s\S]*\}/)
      if (objMatch) {
        jsonStr = objMatch[0]
      }

      const parsed = JSON.parse(jsonStr) as T
      return { result: parsed, model: MODEL }
    } catch (error) {
      lastError = error as Error

      // Don't retry on auth errors or invalid requests
      if (error instanceof Anthropic.AuthenticationError ||
          error instanceof Anthropic.BadRequestError) {
        throw error
      }

      // Retry on rate limits or server errors
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)))
      }
    }
  }

  throw lastError || new Error('Analysis failed after retries')
}

export { MODEL }
