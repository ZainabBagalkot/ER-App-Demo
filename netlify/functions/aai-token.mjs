// Netlify Function: mint an AssemblyAI realtime temp token server-side.
// Reads ASSEMBLYAI_API_KEY from the Netlify environment so the key is never
// shipped to the browser. The browser calls this endpoint and uses the
// returned token to open the AssemblyAI v3 streaming WebSocket.
//
// Note: this is a Netlify v2 function, so it must return a web-standard
// `Response` (not a `{ statusCode, body }` envelope).

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
        },
    });
}

export default async function handler(request) {
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const apiKey = process.env.ASSEMBLYAI_API_KEY;

    if (!apiKey) {
        return json({ error: 'ASSEMBLYAI_API_KEY is not set in the Netlify environment.' }, 500);
    }

    try {
        const tokenRes = await fetch(
            'https://streaming.assemblyai.com/v3/token?expires_in_seconds=600',
            { headers: { authorization: apiKey } }
        );

        if (!tokenRes.ok) {
            const detail = await tokenRes.text();
            return json({ error: 'AssemblyAI token request failed.', detail }, tokenRes.status);
        }

        const { token } = await tokenRes.json();
        return json({ token });
    } catch (err) {
        return json({ error: 'Unexpected error minting AssemblyAI token.', detail: String(err) }, 500);
    }
}