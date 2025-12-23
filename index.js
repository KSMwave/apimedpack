import express from 'express';
import { Firestore } from '@google-cloud/firestore';
import { OAuth2Client } from 'google-auth-library';

const app = express();
app.use(express.json());

const db = new Firestore();
const client = new OAuth2Client();
// ใส่ Client ID ของคุณที่นี่
const CLIENT_ID = '887088631874-7hg3ne9bsgnfurtdd8eamb7tnq339lpa.apps.googleusercontent.com';

app.get('/status', async (req, res) => {
  try {
    // 1. รับ Token จาก Header
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const idToken = authHeader.split(' ')[1];

    // 2. ตรวจสอบ Token กับ Google เพื่อหา Email
    const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload['email']; // ได้ Email จาก Google แล้ว

    // 3. นำ Email ไปค้นหาใน Firestore Table "users"
    const userDoc = await db.collection('users').doc(email).get();

    if (!userDoc.exists) {
        // หากไม่เจออีเมลนี้ในตาราง Firestore
        return res.status(403).json({ 
            error: "Forbidden", 
            message: `อีเมล ${email} ไม่มีสิทธิ์ใช้งานเครื่องจัดยานี้` 
        });
    }

    // 4. เจอข้อมูลในตาราง ให้ส่งชื่อและ Role กลับไป
    const userData = userDoc.data();
    res.json({ 
        status: 'OK',
        name: userData.name, 
        role: userData.role,
        email: email,
        message: `ยินดีต้อนรับคุณ ${userData.name} (${userData.role})`
    });

  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Invalid or Expired Token' });
  }
});

app.post('/echo', (req, res) => {
    res.json({ received: req.body });
});

const PORT = parseInt(process.env.PORT) || 8080; 
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});