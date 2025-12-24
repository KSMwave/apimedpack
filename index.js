import express from 'express';
import { Firestore } from '@google-cloud/firestore';
import { OAuth2Client } from 'google-auth-library';

const app = express();
app.use(express.json());

// 1. เชื่อมต่อฐานข้อมูล meddb (ตรวจสอบว่า Project ID ถูกต้อง)
const db = new Firestore({
  projectId: 'bamboo-depth-472206-f1',
  databaseId: 'meddb' // ระบุชื่อฐานข้อมูลที่คุณสร้างไว้
});

const client = new OAuth2Client();
// Client ID ที่ตรงกับใน Google Cloud Console และ WinForms
const CLIENT_ID = '887088631874-ld8c3idr9qcmts2cllus42d8gt8dkr8d.apps.googleusercontent.com';

app.get('/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("ไม่มี Token ส่งมาใน Header");
      return res.status(401).json({ error: 'Unauthorized: Missing Token' });
    }

    const idToken = authHeader.split(' ')[1];

    // 2. ตรวจสอบ Token กับ Google
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (authError) {
      console.error("Token Validation Failed:", authError.message);
      return res.status(401).json({ error: 'Invalid Token', detail: authError.message });
    }

    // ทำอีเมลให้เป็นตัวพิมพ์เล็กเพื่อให้ตรงกับ Document ID ใน Firestore
    const emailFromToken = payload['email'].toLowerCase().trim();
    console.log(`กำลังค้นหาข้อมูลสำหรับผู้ใช้: ${emailFromToken}`);

    // 3. ดึงข้อมูลจาก Collection 'users' ใน meddb
    // ตรวจสอบว่า Service Account มีสิทธิ์ Cloud Datastore User ในฐานข้อมูล meddb แล้ว
    const userDoc = await db.collection('users').doc(emailFromToken).get();

    if (!userDoc.exists) {
      console.log(`ไม่พบข้อมูลผู้ใช้: ${emailFromToken} ในฐานข้อมูล meddb`);
      return res.status(404).json({ 
        error: 'User not found', 
        name: 'ไม่มีชื่อในระบบ', 
        role: 'N/A' 
      });
    }

    const userData = userDoc.data();
    console.log("ดึงข้อมูลสำเร็จ:", userData.name);
    
    // 4. ส่งค่ากลับไปยัง WinForms
    res.json({ 
      status: 'OK', 
      name: userData.name || 'Unknown', 
      role: userData.role || 'user',
      message: `ยินดีต้อนรับคุณ ${userData.name}`
    });

  } catch (error) {
    // กรณีเกิด PERMISSION_DENIED จะมาตกที่นี่
    console.error("Firestore Error:", error.message);
    res.status(500).json({ 
      error: 'Internal Server Error (Database)', 
      detail: error.message 
    });
  }
});

// Cloud Run จะใช้ Port จาก Environment Variable เสมอ
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API Server กำลังทำงานที่ Port ${PORT} (Database: meddb)`);
});