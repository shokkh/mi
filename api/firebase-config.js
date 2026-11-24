'use strict';

module.exports = function firebaseConfig(request, response) {
    if (request.method !== 'GET') {
        response.setHeader('Allow', 'GET');
        return response.status(405).json({ error: 'Method not allowed.' });
    }

    const config = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        appId: process.env.FIREBASE_APP_ID,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID
    };
    const missing = Object.entries(config)
        .filter(([key, value]) => key !== 'messagingSenderId' && !value)
        .map(([key]) => key);

    response.setHeader('Cache-Control', 'no-store');
    if (missing.length) {
        console.error('Firebase web configuration is incomplete.', missing);
        return response.status(503).json({ error: 'Cloud account services are not configured on this host.' });
    }

    return response.status(200).json(config);
};
