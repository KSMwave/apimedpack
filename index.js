import express from 'express';
import { Firestore } from '@google-cloud/firestore';
import { OAuth2Client } from 'google-auth-library';

const app = express();
app.use(express.json());

const db = new Firestore();
const client = new OAuth2Client();
// ตรวจสอบว่า CLIENT_ID ตรงกับใน WinForms
const CLIENT_ID = '887088631874-ld8c3idr9qcmts2cllus42d8gt8dkr8d.apps.googleusercontent.com';

app.get('/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const idToken = authHeader.split(' ')[1];

    // 1. ตรวจสอบ Token กับ Google
    const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload['email'];

    // 2. ดึงข้อมูลจากตาราง Firestore
    const userDoc = await db.collection('users').doc(email).get();

    if (!userDoc.exists) {
      return res.status(403).json({ error: `ไม่พบอีเมล ${email} ในระบบ` });
    }

    const userData = userDoc.data();
    res.json({ 
      status: 'OK', 
      name: userData.name, 
      role: userData.role,
      message: `ยินดีต้อนรับ ${userData.role} ${userData.name}`
    });

  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Invalid or Expired Token' }); //
  }
});

const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => { console.log(`API running on port ${PORT}`); });