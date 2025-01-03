import { NextResponse } from 'next/server';
import OpenAI from 'openai';

interface Finding {
  category: string;
  observation: string;
  details: string;
  impact: string;
}

interface AnalysisResponse {
  findings: Finding[];
}

// Add console.log to debug API key
console.log('API Key exists:', !!process.env.OPENAI_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '' // Provide empty string as fallback
});

export async function POST(request: Request) {
  console.log('API route hit'); // Debug log

  if (!process.env.OPENAI_API_KEY) {
    console.error('No OpenAI API key found');
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    console.log('Request body received'); // Debug log

    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt in request body' },
        { status: 400 }
      );
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a data analysis expert. Analyze spreadsheets and provide structured comparisons. Your response must be valid JSON.`
          },
          {
            role: "user",
            content: `${prompt}\n\nRespond with a JSON object in this exact format:
            {
              "findings": [
                {
                  "category": "Content Structure",
                  "observation": "brief observation here",
                  "details": "detailed explanation here",
                  "impact": "high/medium/low with brief explanation"
                }
              ]
            }`
          }
        ],
        temperature: 0.5,
        max_tokens: 2000
      });

      const analysisText = completion.choices[0].message.content;
      console.log('OpenAI raw response:', analysisText);

      if (!analysisText) {
        return NextResponse.json({
          findings: [{
            category: "Error",
            observation: "No response from AI",
            details: "The AI model did not provide any analysis",
            impact: "high - analysis failed"
          }]
        });
      }

      // Clean the response text and ensure it's valid JSON
      const cleanedText = analysisText.trim().replace(/```json/g, '').replace(/```/g, '');
      
      try {
        const analysis = JSON.parse(cleanedText) as AnalysisResponse;
        
        // Validate the structure
        if (!analysis.findings || !Array.isArray(analysis.findings)) {
          throw new Error('Invalid response structure');
        }

        // Ensure each finding has the required fields
        const validatedFindings = analysis.findings.map((finding: Finding) => ({
          category: finding.category || 'Uncategorized',
          observation: finding.observation || 'No observation provided',
          details: finding.details || 'No details provided',
          impact: finding.impact || 'Impact not specified'
        }));

        return NextResponse.json({ findings: validatedFindings });

      } catch (parseError) {
        console.error('Parse error:', parseError);
        // Return a fallback response
        return NextResponse.json({
          findings: [{
            category: "Error",
            observation: "Failed to parse AI response",
            details: "The AI response was not in the expected format",
            impact: "high - analysis failed"
          }]
        });
      }

    } catch (openAIError: any) {
      console.error('OpenAI API error:', openAIError);
      return NextResponse.json({
        findings: [{
          category: "Error",
          observation: "OpenAI API Error",
          details: openAIError.message || "Unknown OpenAI error",
          impact: "high - analysis failed"
        }]
      });
    }

  } catch (error: any) {
    console.error('General error in API route:', error);
    return NextResponse.json({
      findings: [{
        category: "Error",
        observation: "General Error",
        details: error.message || "Unknown error occurred",
        impact: "high - analysis failed"
      }]
    });
  }
} 