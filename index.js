import express from 'express';
import { Firestore } from '@google-cloud/firestore';
import { OAuth2Client } from 'google-auth-library';

const app = express();
app.use(express.json());

const db = new Firestore({
  projectId: 'bamboo-depth-472206-f1',
  databaseId: 'meddb'
});

const client = new OAuth2Client();
const CLIENT_ID = '887088631874-ld8c3idr9qcmts2cllus42d8gt8dkr8d.apps.googleusercontent.com';

/**
 * 1. Endpoint สำหรับ Pre-check Email
 * ใช้ตรวจสอบก่อนว่าอีเมลมีอยู่ในระบบไหม ก่อนให้ User ไปกดยืนยันในมือถือ
 */
app.get('/check-email', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }

    const emailSearch = email.toLowerCase().trim();
    const userDoc = await db.collection('users').doc(emailSearch).get();

    if (userDoc.exists) {
      return res.json({ allowed: true, message: 'User found' });
    } else {
      return res.status(404).json({ allowed: false, error: 'User not registered' });
    }
  } catch (error) {
    console.error("Check Email Error:", error.message);
    res.status(500).json({ error: 'Database check failed' });
  }
});

/**
 * 2. Endpoint /status เดิม
 * ตรวจสอบ Token และดึง Role
 */
app.get('/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing Token' });
    }

    const idToken = authHeader.split(' ')[1];
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (authError) {
      return res.status(401).json({ error: 'Invalid Token', detail: authError.message });
    }

    const emailFromToken = payload['email'].toLowerCase().trim();
    const userDoc = await db.collection('users').doc(emailFromToken).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found', name: 'ไม่มีชื่อในระบบ', role: 'N/A' });
    }

    const userData = userDoc.data();
    res.json({ 
      status: 'OK', 
      name: userData.name || 'Unknown', 
      role: userData.role || 'user',
      message: `ยินดีต้อนรับคุณ ${userData.name}`
    });

  } catch (error) {
    console.error("Firestore Error:", error.message);
    res.status(500).json({ error: 'Internal Server Error', detail: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API Server กำลังทำงานที่ Port ${PORT} (Database: meddb)`);
});