import express from 'express';
import { Firestore } from '@google-cloud/firestore'; // <-- ต้องมีอันนี้
import { OAuth2Client } from 'google-auth-library';

const app = express();
app.use(express.json());

// เชื่อมต่อฐานข้อมูล meddb
const db = new Firestore({
  databaseId: 'meddb' 
});

const client = new OAuth2Client();
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
    const email = payload['email'].toLowerCase().trim(); // ทำเป็นตัวพิมพ์เล็กเพื่อความแม่นยำ

    // 2. ดึงข้อมูลจากตาราง users ใน meddb
    const userDoc = await db.collection('users').doc(email).get();

    if (!userDoc.exists) {
      // ถ้าไม่เจอเมลใน DB ให้ตอบกลับไปบอก WinForms
      return res.status(403).json({ 
        error: `ไม่พบอีเมล ${email} ในระบบ meddb`,
        name: 'Unknown',
        role: 'None'
      });
    }

    const userData = userDoc.data();
    
    // ส่งข้อมูลจริงกลับไปให้ WinForms โชว์
    res.json({ 
      status: 'OK', 
      name: userData.name, 
      role: userData.role,
      message: `ยินดีต้อนรับ ${userData.name}`
    });

  } catch (error) {
    console.error("Error:", error.message);
    res.status(401).json({ error: 'Authentication Failed', detail: error.message });
  }
});

const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => { console.log(`API running on port ${PORT} with meddb`); });