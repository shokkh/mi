'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const firebaseConfig = require('../api/firebase-config');
const feedback = require('../api/feedback');

function createResponse() {
    return {
        statusCode: 200,
        headers: {},
        status(code) {
            this.statusCode = code;
            return this;
        },
        setHeader(name, value) {
            this.headers[name] = value;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

test('Firebase config endpoint rejects methods other than GET', () => {
    const response = createResponse();
    firebaseConfig({ method: 'POST' }, response);
    assert.equal(response.statusCode, 405);
    assert.equal(response.headers.Allow, 'GET');
});

test('Firebase config endpoint reports missing public config', () => {
    const configKeys = ['FIREBASE_API_KEY', 'FIREBASE_AUTH_DOMAIN', 'FIREBASE_PROJECT_ID', 'FIREBASE_APP_ID'];
    const original = Object.fromEntries(configKeys.map(key => [key, process.env[key]]));
    const response = createResponse();
    const originalConsoleError = console.error;
    try {
        configKeys.forEach(key => delete process.env[key]);
        console.error = () => {};
        firebaseConfig({ method: 'GET' }, response);
    } finally {
        configKeys.forEach(key => {
            if (original[key] === undefined) delete process.env[key];
            else process.env[key] = original[key];
        });
        console.error = originalConsoleError;
    }
    assert.equal(response.statusCode, 503);
    assert.match(response.body.error, /not configured/i);
});

test('feedback endpoint rejects methods other than POST', async () => {
    const response = createResponse();
    await feedback({ method: 'GET', headers: {} }, response);
    assert.equal(response.statusCode, 405);
    assert.equal(response.headers.Allow, 'POST');
});

test('feedback endpoint requires an authenticated user', async () => {
    const response = createResponse();
    await feedback({ method: 'POST', headers: {}, body: {} }, response);
    assert.equal(response.statusCode, 401);
    assert.match(response.body.error, /sign in/i);
});
