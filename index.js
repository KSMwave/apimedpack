import express from 'express';
import { Firestore } from '@google-cloud/firestore';
import { OAuth2Client } from 'google-auth-library';

const app = express();
app.use(express.json());

// 1. ตั้งค่าการเชื่อมต่อฐานข้อมูล meddb
const db = new Firestore({
  projectId: 'bamboo-depth-472206-f1',
  databaseId: 'meddb'
});

// 2. ตั้งค่า OAuth สำหรับมาตรฐานองค์กร (ย้ายความลับมาไว้บน Server)
// แนะนำให้ตั้งค่าเหล่านี้ใน Cloud Run Environment Variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '887088631874-ld8c3idr9qcmts2cllus42d8gt8dkr8d.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET; // ห้ามใส่ค่าตรงๆ ในโค้ด
const REDIRECT_URI = 'https://apimedpackv1-887088631874.southamerica-west1.run.app/auth/google/callback';

const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Endpoint เดิมสำหรับตรวจสอบสถานะและดึงข้อมูล User
app.get('/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing Token' });
    }

    const idToken = authHeader.split(' ')[1];

    // ตรวจสอบ Token กับ Google
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: idToken,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const emailFromToken = payload['email'].toLowerCase().trim();

    // ดึงข้อมูลจาก Firestore
    const userDoc = await db.collection('users').doc(emailFromToken).get();

    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: 'User not found', 
        name: 'ไม่มีชื่อในระบบ', 
        role: 'N/A' 
      });
    }

    const userData = userDoc.data();
    res.json({ 
      status: 'OK', 
      name: userData.name || 'Unknown', 
      role: userData.role || 'user',
      message: `ยินดีต้อนรับคุณ ${userData.name}`
    });

  } catch (error) {
    console.error("Auth/Firestore Error:", error.message);
    res.status(500).json({ error: 'Internal Server Error', detail: error.message });
  }
});

// 3. Endpoint ใหม่สำหรับจัดการการ Redirect จาก Google (Web Server Flow)
app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query; // ได้รับ Auth Code จาก Google Browser
    
    if (!code) {
      return res.status(400).send('Missing authorization code');
    }

    // นำ Code ไปแลกเป็น Tokens (ใช้ Client Secret ที่อยู่บน Server นี้)
    const { tokens } = await oAuth2Client.getToken(code);
    
    // ส่ง id_token กลับไปแสดงผล (หรือส่งกลับไปที่ WinForms ตามวิธีที่ออกแบบไว้)
    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
          <h1 style="color: #28a745;">Login Success!</h1>
          <p>เข้าสู่ระบบสำเร็จ คุณสามารถคัดลอก Token นี้ไปใช้ในแอป หรือปิดหน้าต่างนี้ได้เลย</p>
          <textarea style="width: 80%; height: 100px; padding: 10px;">${tokens.id_token}</textarea>
          <br><br>
          <button onclick="window.close()">ปิดหน้าต่างนี้</button>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Exchange Token Error:", error.message);
    res.status(500).send("Authentication Failed: " + error.message);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} (Database: meddb)`);
});