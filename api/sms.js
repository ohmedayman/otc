module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { to, message } = req.body || {};
    console.log('[SMS] Request:', { to, message: message?.substring(0, 50) });

    if (!to || !message) {
        return res.status(400).json({ error: 'to and message are required' });
    }

    try {
        const apiKey = 'pk_J9mvUtc7wETvuX5q5V2W3uTMoG7k2hz9';
        const apiSecret = 'sk_CB1odRcCfZ23M8RlimP42a0bDaWidrVj1SEngrx8';

        console.log('[SMS] Calling ZADX API...');
        const resp = await fetch('https://smsapi.zadx.net/api/v1/sms/send', {
            method: 'POST',
            headers: {
                'X-API-Key': apiKey,
                'X-API-Secret': apiSecret,
                'Content-Type': 'application/json',
                'Idempotency-Key': 'sms-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8)
            },
            body: JSON.stringify({ to, message: message.substring(0, 160) })
        });

        const text = await resp.text();
        console.log('[SMS] ZADX Response:', resp.status, text);

        let data;
        try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }

        return res.status(resp.status).json(data);
    } catch (e) {
        console.error('[SMS] Error:', e.message);
        return res.status(500).json({ error: e.message });
    }
};
