import express from 'express';
const app = express();
app.use(express.json());

app.get('/status', (req, res) => {
  // ตอบกลับ OK 200 พร้อมข้อมูลที่ WinForms รออ่านอยู่
  res.json({ 
    status: 'OK', 
    name: 'ระบบทดสอบ', 
    role: 'แอดมิน',
    message: 'เชื่อมต่อ API สำเร็จแล้ว!' 
  });
});

const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
<<<<<<< HEAD
});
=======
});
>>>>>>> 0b210f5d96b7a96a399a0f1ab56296cfd5396d35
