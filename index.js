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

    // 1. ตรวจสอบ Token
    const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    
    // ดึงอีเมลออกมา และจัดการลบช่องว่าง/ทำเป็นตัวพิมพ์เล็ก
    const emailFromToken = payload['email'].toLowerCase().trim();

    // --- ส่วนที่เพิ่มเข้ามาเพื่อตรวจสอบ (Console Log) ---
    console.log("--- DEBUG LOGIN ---");
    console.log("Email from Google Token:", `"${emailFromToken}"`);
    console.log("Searching in Database: meddb, Collection: users");
    // ----------------------------------------------

    // 2. ดึงข้อมูลจาก Firestore โดยระบุ databaseId
    const userDoc = await db.collection('users').doc(emailFromToken).get();

    if (!userDoc.exists) {
      console.error(`[FAIL] ไม่พบอีเมล "${emailFromToken}" ในฐานข้อมูล meddb`);
      return res.status(403).json({ 
        error: `ไม่พบอีเมล ${emailFromToken} ในระบบ`,
        debug_email: emailFromToken 
      });
    }

    const userData = userDoc.data();
    console.log(`[SUCCESS] พบข้อมูลผู้ใช้: ${userData.name} (${userData.role})`);

    res.json({ 
      status: 'OK', 
      name: userData.name, 
      role: userData.role,
      message: `ยินดีต้อนรับ ${userData.name}`
    });

  } catch (error) {
    console.error("--- ERROR DETAIL ---");
    console.error("Message:", error.message);
    console.error("Code:", error.code); // จะได้เห็นว่ายังเป็นเลข 7 (Permission Denied) อยู่ไหม
    res.status(401).json({ 
      error: 'Authentication Failed', 
      detail: error.message,
      code: error.code 
    });
  }
});

const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => { 
  console.log(`API running on port ${PORT} using database meddb`); 
});