// index.js
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

// ----------------------------------------------------
// 1. การกำหนดค่า Swagger/OpenAPI
// ----------------------------------------------------

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cloud Run Node.js Swagger API',
      version: '1.0.0',
      description: 'API Demo for Cloud Run. Documentation available at /api-docs',
      contact: {
        name: 'Developer Support'
      }
    },
    // กำหนด Server URL พื้นฐาน (Cloud Run จะจัดการให้)
    servers: [
      {
        url: '/', 
        description: 'Cloud Run Deployment Server'
      },
    ],
    // กำหนด Global Security Scheme (ถ้าใช้ JWT)
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            }
        }
    },
  },
  // apis: ระบุไฟล์ที่ใช้ Swagger comments
  apis: [path.resolve('./index.js')], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ----------------------------------------------------
// 2. ตั้งค่า Express Server และ Middleware
// ----------------------------------------------------

const app = express();
// Middleware สำหรับการอ่าน JSON ใน Body
app.use(express.json());

// Endpoint สำหรับ Swagger UI (เข้าถึงได้ที่ /api-docs)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// ----------------------------------------------------
// 3. API Endpoints
// ----------------------------------------------------

/**
 * @swagger
 * /status:
 * get:
 * summary: ตรวจสอบสถานะการทำงานของ API
 * description: คืนค่าสถานะ 'OK' และเวอร์ชันของ Service
 * responses:
 * 200:
 * description: API ทำงานปกติ
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * status:
 * type: string
 * example: OK
 * version:
 * type: string
 * example: 1.0.0
 */
app.get('/status', (req, res) => {
  // ตัวอย่างการใช้ Environment Variable (ถ้ามีการตั้งค่าเพิ่มเติมใน Cloud Run)
  const environment = process.env.NODE_ENV || 'development'; 
  res.json({ 
    status: 'OK', 
    version: '1.0.0',
    environment: environment
  });
});

/**
 * @swagger
 * /echo:
 * post:
 * summary: ส่งข้อมูลกลับตามที่รับมา
 * description: ใช้สำหรับทดสอบการทำงานของ POST request
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * input:
 * type: string
 * example: Hello Cloud Run
 * responses:
 * 200:
 * description: ข้อมูลที่ส่งกลับมา
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * received:
 * type: object
 */
app.post('/echo', (req, res) => {
    res.json({ received: req.body });
});


// ----------------------------------------------------
// 4. เริ่มเซิร์ฟเวอร์
// ----------------------------------------------------

// Cloud Run จะกำหนด PORT ให้เราเสมอ เราต้องใช้ Environment Variable PORT
// ถ้าไม่ได้รันใน Cloud Run จะใช้ 8080 เป็นค่าเริ่มต้นสำหรับการทดสอบในเครื่อง
const PORT = parseInt(process.env.PORT) || 8080; 

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access Swagger UI at http://localhost:${PORT}/api-docs (when running locally)`);
});