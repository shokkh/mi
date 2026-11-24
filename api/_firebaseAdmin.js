'use strict';

const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');

function getFirebaseAdmin() {
    let app = getApps()[0];
    if (!app) {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (!serviceAccountJson) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured.');
        }

        let serviceAccount;
        try {
            serviceAccount = JSON.parse(serviceAccountJson);
        } catch (error) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.', { cause: error });
        }

        app = initializeApp({ credential: cert(serviceAccount) });
    }

    return {
        auth: getAuth(app),
        firestore: getFirestore(app),
        FieldValue
    };
}

async function verifyUser(request) {
    const authorization = request.headers.authorization || '';
    const match = /^Bearer (.+)$/i.exec(authorization);
    if (!match) {
        const error = new Error('Sign in to request AI feedback.');
        error.statusCode = 401;
        throw error;
    }

    const firebaseAdmin = getFirebaseAdmin();
    try {
        return await firebaseAdmin.auth.verifyIdToken(match[1]);
    } catch (error) {
        if (error.statusCode) throw error;
        const authError = new Error('Your sign-in session is invalid or expired.');
        authError.statusCode = 401;
        throw authError;
    }
}

module.exports = { getFirebaseAdmin, verifyUser };
