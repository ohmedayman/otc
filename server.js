const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Egypt Post tracking endpoint
app.get('/api/track/:trackingNumber', async (req, res) => {
    const { trackingNumber } = req.params;
    
    try {
        // Validate tracking number format (13 characters for international)
        if (!trackingNumber || trackingNumber.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Invalid tracking number format'
            });
        }
        
        // Try to fetch from Egypt Post website
        const result = await trackFromEgyptPost(trackingNumber);
        
        if (result) {
            res.json({
                success: true,
                data: result
            });
        } else {
            // Return demo data if Egypt Post is not accessible
            res.json({
                success: true,
                data: generateDemoData(trackingNumber),
                note: 'Using demo data - Egypt Post API not available'
            });
        }
    } catch (error) {
        console.error('Tracking error:', error.message);
        
        // Return demo data on error
        res.json({
            success: true,
            data: generateDemoData(trackingNumber),
            note: 'Using demo data due to error: ' + error.message
        });
    }
});

// Track from Egypt Post website
async function trackFromEgyptPost(trackingNumber) {
    try {
        // Egypt Post tracking URL
        const url = 'https://egyptpost.gov.eg/ar-eg/home/eservices/track-and-trace/';
        
        // Note: Egypt Post website is protected by Cloudflare
        // In production, you might need to:
        // 1. Use a third-party tracking API (Tracktry, Track123, etc.)
        // 2. Use a headless browser with stealth plugins
        // 3. Contact Egypt Post for official API access
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ar,en;q=0.9'
            },
            timeout: 10000
        });
        
        // Parse the response (this is a simplified example)
        // In reality, you'd need to handle the form submission and AJAX requests
        const $ = cheerio.load(response.data);
        
        // This is a placeholder - actual implementation would depend on Egypt Post's response format
        // You would need to:
        // 1. Find the tracking form
        // 2. Submit the tracking number
        // 3. Parse the results
        
        return null; // Return null to use demo data
        
    } catch (error) {
        console.error('Egypt Post fetch error:', error.message);
        return null;
    }
}

// Generate demo data
function generateDemoData(trackingNumber) {
    const statuses = ['pending', 'in-transit', 'delivered', 'exception'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    const statusTextMap = {
        'pending': 'قيد المعالجة',
        'in-transit': 'في الطريق',
        'delivered': 'تم التوصيل',
        'exception': 'مشكلة في التوصيل'
    };
    
    const locations = [
        'فرع القاهرة الرئيسي',
        'مركز توزيع المعادي',
        'ميناء الإسكندرية',
        'فرع مصر الجديدة',
        'مركز الشحن الدولي'
    ];
    
    const events = [];
    const now = new Date();
    
    // Generate 1-4 events
    const numEvents = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < numEvents; i++) {
        const eventDate = new Date(now - i * 24 * 60 * 60 * 1000);
        events.push({
            date: eventDate.toLocaleString('ar-EG'),
            status: i === 0 ? 'آخر تحديث' : 'تحديث سابق',
            location: locations[Math.floor(Math.random() * locations.length)]
        });
    }
    
    return {
        trackingNumber: trackingNumber,
        status: randomStatus,
        statusText: statusTextMap[randomStatus],
        lastUpdate: now.toLocaleString('ar-EG'),
        location: locations[Math.floor(Math.random() * locations.length)],
        events: events
    };
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ===================================
    Milano OTC Tracking Server
    ===================================
    Server running on port ${PORT}
    Main page: http://localhost:${PORT}
    Admin panel: http://localhost:${PORT}/admin
    API endpoint: http://localhost:${PORT}/api/track/:trackingNumber
    ===================================
    `);
});
