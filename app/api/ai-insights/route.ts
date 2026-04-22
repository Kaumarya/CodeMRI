import { NextRequest, NextResponse } from 'next/server';

interface AiInsightsRequest {
  totalFiles: number;
  analyzedFiles: number;
  jsTsFiles: number;
  foldersCount: number;
  detectedLanguages: Record<string, number>;
  simpleRiskScore: number;
  externalServices: string[];
  risks: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    file: string;
    description: string;
  }>;
}

interface AiInsightsResponse {
  verdict: string;
  summary: string;
  topRisks: string[];
  quickWins: string[];
  architectureNote: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<AiInsightsResponse | { error: string }>> {
  try {
    const scanData: AiInsightsRequest = await request.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY is not configured');
      return NextResponse.json(
        { error: 'AI insights unavailable' },
        { status: 500 }
      );
    }

    const systemPrompt =
      'You are CodeMRI, an expert code intelligence assistant. You analyze codebase scan results and give developers clear, honest, actionable insights. Be direct, specific, and technical. Never be generic.';

    const userPrompt = `Analyze this codebase scan result and return a JSON object with exactly these fields:
{
  verdict: string (one of: 'Healthy', 'Needs Attention', 'Critical'),
  summary: string (2-3 sentence plain English overview of the project health),
  topRisks: string[] (exactly 3 specific risk descriptions based on the data),
  quickWins: string[] (exactly 3 concrete actionable improvements the dev can make today),
  architectureNote: string (one sentence about the detected architecture pattern)
}
Scan data: ${JSON.stringify(scanData)}
Return ONLY valid JSON. No markdown, no explanation, no backticks.`;

    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          temperature: 0.3,
          max_tokens: 1024,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        }),
      }
    );

    if (!groqResponse.ok) {
      const errorBody = await groqResponse.text();
      console.error('Groq API error:', groqResponse.status, errorBody);
      return NextResponse.json(
        { error: 'AI insights unavailable' },
        { status: 500 }
      );
    }

    const groqData = await groqResponse.json();

    // Extract the text content from the Groq response (OpenAI-compatible format)
    const messageContent = groqData.choices?.[0]?.message?.content;

    if (!messageContent) {
      console.error('No content in Groq response');
      return NextResponse.json(
        { error: 'AI insights unavailable' },
        { status: 500 }
      );
    }

    // Parse the JSON from Groq's response
    const insights: AiInsightsResponse = JSON.parse(messageContent);

    return NextResponse.json(insights);
  } catch (error) {
    console.error('AI insights error:', error);
    return NextResponse.json(
      { error: 'AI insights unavailable' },
      { status: 500 }
    );
  }
}
