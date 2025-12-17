
import express from 'express';
const app = express();
app.use(express.json());

// ----------------------------------------------------
// 3. API Endpoints
// ----------------------------------------------------


app.get('/status', (req, res) => {
  const environment = process.env.NODE_ENV || 'development'; 
  res.json({ 
    status: 'OK', 
    version: '1.0.0',
    environment: environment
  });
});


app.post('/echo', (req, res) => {
    res.json({ received: req.body });
});

const PORT = parseInt(process.env.PORT) || 8080; 

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});