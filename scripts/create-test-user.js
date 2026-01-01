/**
 * Script to create a test user for development
 * 
 * Usage: node scripts/create-test-user.js <email> <password> <displayName>
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function createTestUser() {
    const email = process.argv[2] || process.env.VITE_DEV_AUTH_EMAIL || 'test@example.com';
    const password = process.argv[3] || process.env.VITE_DEV_AUTH_PASSWORD || 'password123';
    const displayName = process.argv[4] || 'Test User';

    console.log(`Creating test user: ${email}...`);

    try {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;

        if (!projectId || !clientEmail || !privateKey) {
            throw new Error('Firebase credentials not found in .env');
        }

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                }),
            });
        }

        let user;
        try {
            user = await admin.auth().getUserByEmail(email);
            console.log('User already exists. Updating password...');
            await admin.auth().updateUser(user.uid, { password, displayName });
        } catch (e) {
            user = await admin.auth().createUser({
                email,
                password,
                displayName,
            });
            console.log('User created successfully.');
        }

        console.log(`UID: ${user.uid}`);
        console.log('Success!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

createTestUser();
