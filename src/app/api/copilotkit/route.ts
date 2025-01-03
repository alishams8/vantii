import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY environment variable is missing or empty');
  throw new Error('Missing or empty OPENAI_API_KEY environment variable. Please check your .env.local file');
}

// Add this logging to debug the environment variable
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);

    // Extract messages from the GraphQL-style request
    const messages = body.variables?.data?.messages;

    // Check if messages exist in the correct format
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format:', body);
      return NextResponse.json(
        { 
          data: {
            generateCopilotResponse: {
              status: {
                code: 'ERROR',
                reason: 'Messages must be an array',
                __typename: 'FailedResponseStatus'
              },
              __typename: 'CopilotResponse'
            }
          }
        },
        { status: 400 }
      );
    }

    // Ensure each message has the required role and content properties
    const formattedMessages = messages.map(msg => {
      // Handle textMessage format
      if (msg.textMessage) {
        return {
          role: msg.textMessage.role || 'user',
          content: String(msg.textMessage.content || '')
        };
      }
      
      // Handle direct message format
      if (msg.content) {
        return {
          role: msg.role || 'user',
          content: String(msg.content || '')
        };
      }

      console.error('Invalid message format:', msg);
      throw new Error('Invalid message format');
    });

    // Create the chat completion
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: false,
    });

    // Format response to match expected GraphQL structure
    const response = {
      data: {
        generateCopilotResponse: {
          threadId: body.variables?.data?.threadId || null,
          runId: body.variables?.data?.runId || null,
          status: {
            code: 'SUCCESS',
            __typename: 'BaseResponseStatus'
          },
          messages: [{
            id: completion.id,
            createdAt: new Date().toISOString(),
            content: [completion.choices[0].message.content], // Wrap content in array
            role: completion.choices[0].message.role,
            __typename: 'TextMessageOutput',
            status: {
              code: 'SUCCESS',
              __typename: 'SuccessMessageStatus'
            }
          }],
          __typename: 'CopilotResponse'
        }
      }
    };

    console.log('Sending response:', response);
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error in copilotkit route:', error);
    
    return NextResponse.json({
      data: {
        generateCopilotResponse: {
          status: {
            code: 'ERROR',
            reason: error.message,
            details: error.stack,
            __typename: 'FailedResponseStatus'
          },
          messages: [],
          __typename: 'CopilotResponse'
        }
      }
    }, {
      status: error.status || 500
    });
  }
}
