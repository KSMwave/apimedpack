import express from 'express';
import { Firestore } from '@google-cloud/firestore';
import { OAuth2Client } from 'google-auth-library';

const app = express();
app.use(express.json());

// แก้ไข: ระบุ databaseId เป็น 'meddb' ตามที่คุณสร้างไว้
const db = new Firestore({
  databaseId: 'meddb' 
});

const client = new OAuth2Client();
// Client ID ต้องตรงกับใน WinForms
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

    // 2. ดึงข้อมูลจากตาราง users ใน database 'meddb'
    const userDoc = await db.collection('users').doc(email).get();

    if (!userDoc.exists) {
      // แจ้งชัดเจนว่าหาอีเมลนี้ไม่เจอใน Firestore
      return res.status(403).json({ error: `อีเมล ${email} ไม่มีสิทธิ์ใช้งาน (ไม่พบใน meddb)` });
    }

    const userData = userDoc.data();
    res.json({ 
      status: 'OK', 
      name: userData.name, 
      role: userData.role,
      message: `ยินดีต้อนรับคุณ ${userData.name} (${userData.role})`
    });

  } catch (error) {
    // ปรับปรุง: ให้ Log แสดงรายละเอียด Error จริงๆ ใน Console ของ Cloud Run
    console.error("Detailed Error:", error.message);
    
    // ส่ง Error กลับไปที่ WinForms ตามจริง
    res.status(401).json({ 
      error: 'Authentication Failed', 
      detail: error.message 
    });
  }
});

const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => { 
  console.log(`API running on port ${PORT} using database meddb`); 
});