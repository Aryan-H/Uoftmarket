
import { corsHeaders } from '../_shared/cors.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

console.log('Function "hello-world" up and running!');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse the request body if it exists
    let name = 'World';
    try {
      const body = await req.json();
      if (body && body.name) {
        name = body.name;
      }
    } catch {
      // If there's no body or it's not valid JSON, use the default name
    }

    // Log the request for debugging
    console.log(`Processing request for name: ${name}`);

    // Prepare the response data
    const data = {
      message: `Hello ${name}!`,
      timestamp: new Date().toISOString(),
    };

    // Return the response with CORS headers
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    // Log the error for debugging
    console.error('Error processing request:', error);

    // Return an error response with CORS headers
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
