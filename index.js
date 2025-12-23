import express from 'express';
import { OAuth2Client } from 'google-auth-library';

const app = express();
app.use(express.json());

const client = new OAuth2Client();
// ตรวจสอบ CLIENT_ID ให้ตรงกับใน WinForms เป๊ะๆ
const CLIENT_ID = '887088631874-ld8c3idr9qcmts2cllus42d8gt8dkr8d.apps.googleusercontent.com';

app.get('/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const idToken = authHeader.split(' ')[1];

    // --- ตรวจสอบ Token กับ Google ---
    const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload['email']; // ดึงอีเมลจริงจาก Token

    console.log(`--- DEBUG: พบอีเมลจาก Google: ${email} ---`);

    // ตอบกลับ OK โดยเอาอีเมลจริงมาโชว์ แต่ยังไม่ค้นใน DB
    res.json({ 
      status: 'OK', 
      name: email, // โชว์อีเมลแทนชื่อไปก่อนเพื่อทดสอบ
      role: 'Verified User',
      message: `ล็อกอินผ่าน Google สำเร็จ! สวัสดีคุณ ${email}`
    });

  } catch (error) {
    console.error("Auth Error:", error.message);
    res.status(401).json({ 
      error: 'Authentication Failed', 
      detail: error.message 
    });
  }
});

const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });