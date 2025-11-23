import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // STREAMING FLOW OVERVIEW:
  // 1. Receive chat messages from frontend
  // 2. Forward request to Python backend with streaming enabled
  // 3. Backend returns text/event-stream with JSON chunks like: {"choices":[{"delta":{"content":"Hello"}}]}\n
  // 4. Transform each chunk to frontend format: 0:"Hello"\n
  // 5. Stream transformed chunks back to frontend in real-time

  try {
    const { messages = [] } = await request.json();

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Validate input
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token is required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Forward the request to your backend
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          // Request streaming response
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          messages: messages,
          stream: true, // Enable streaming
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(
        JSON.stringify({
          error:
            errorData.message || 'Failed to get response from chat service',
        }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if the response is streaming
    const contentType = response.headers.get('content-type');

    // For streaming responses from your backend
    if (contentType?.includes('text/event-stream') && response.body) {
      // STREAMING EXPLANATION:
      // 1. Your backend returns a stream of JSON objects separated by newlines
      // 2. Each JSON object contains a chunk of the AI response
      // 3. We need to transform this into a format our frontend can consume

      // Create readers/writers for stream transformation
      const reader = response.body.getReader();
      const encoder = new TextEncoder(); // Converts text to binary for output stream
      const decoder = new TextDecoder(); // Converts binary chunks to text

      // WHY WE NEED DECODER:
      // - response.body.getReader() returns chunks as Uint8Array (binary data)
      // - Even though the content is JSON text, it arrives as binary bytes
      // - TextDecoder converts these bytes back to readable text strings
      // - Without it, we'd have raw bytes like [123, 34, 99, 104, 111, 105, 99, 101, 115, 34, ...]

      // Create a new ReadableStream that will transform the backend data
      const stream = new ReadableStream({
        async start(controller) {
          let buffer = '';

          // Read chunks from the backend stream
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              controller.close();
              break;
            }

            // Decode the binary chunk to text
            buffer += decoder.decode(value, { stream: true });

            // Split by newlines to get individual JSON objects
            const lines = buffer.split('\n');

            // Keep the last line in buffer if it's incomplete
            buffer = lines.pop() || '';

            // Process each complete line (JSON object)
            for (const line of lines) {
              if (line.trim()) {
                try {
                  // Parse the JSON object from your backend
                  // Example: {"choices": [{"delta": {"content": "Hello"}}]}
                  const parsed = JSON.parse(line);

                  // Extract the actual text content from various possible formats
                  // Your backend uses: choices[0].delta.content
                  const content =
                    parsed.choices?.[0]?.delta?.content ||
                    parsed.delta?.content ||
                    parsed.content ||
                    parsed.text ||
                    '';

                  if (content) {
                    // Transform to the format expected by our frontend
                    // Frontend expects: 0:"content"\n
                    const aiSdkFormat = `0:"${content.replace(/"/g, '\\"')}"\n`;

                    // Send the transformed chunk to the frontend
                    controller.enqueue(encoder.encode(aiSdkFormat));
                  }
                } catch (e) {
                  console.error('Error parsing streaming data:', e);
                }
              }
            }
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const data = await response.json();
      const content =
        data.message || data.content || data.text || 'I received your message.';

      // Return in AI SDK expected format for non-streaming
      return new Response(`0:"${content.replace(/"/g, '\\"')}"`, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get token from query parameter since EventSource doesn't support custom headers
    // and sessionStorage is not available on the server
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      // Return SSE formatted error
      return new Response(
        `data: ${JSON.stringify({ error: 'Token is required' })}\n\n`,
        {
          status: 401,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        }
      );
    }

    // Call the fake-stream endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/fake-stream`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(
        JSON.stringify({
          error: errorData.message || 'Failed to get response from fake stream',
        }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Forward the streaming response
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Fake stream error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
