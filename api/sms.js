const handler = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { to, message } = req.body || {};
    if (!to || !message) return res.status(400).json({ error: 'to and message required' });

    try {
        const resp = await fetch('https://smsapi.zadx.net/api/v1/sms/send', {
            method: 'POST',
            headers: {
                'X-API-Key': 'pk_J9mvUtc7wETvuX5q5V2W3uTMoG7k2hz9',
                'X-API-Secret': 'sk_CB1odRcCfZ23M8RlimP42a0bDaWidrVj1SEngrx8',
                'Content-Type': 'application/json',
                'Idempotency-Key': 'sms-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8)
            },
            body: JSON.stringify({ to, message: message.substring(0, 160) })
        });
        const text = await resp.text();
        let data;
        try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }
        return res.status(resp.status).json(data);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
module.exports = handler;
