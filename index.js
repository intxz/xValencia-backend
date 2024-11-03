// index.js
require('dotenv').config(); // Cargar variables de entorno desde .env
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = ['https://intxz.github.io', 'http://127.0.0.1:5500'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No autorizado por CORS'));
    }
  }
}));
// Middleware para analizar JSON en solicitudes entrantes
app.use(express.json());

// Importa Firebase Admin desde el archivo de configuración
const admin = require('./firebaseConfig');

// Ruta de prueba para obtener datos de Firebase
app.get('/alerts', async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('alerts').get();
    const alerts = snapshot.docs.map(doc => doc.data());
    res.json(alerts);
  } catch (error) {
    console.error('Error obteniendo datos de Firebase:', error);
    res.status(500).send('Error obteniendo datos de Firebase');
  }
});

app.post('/alerts', async (req, res) => {
    const { title, description, priority, latitude, longitude } = req.body;
  
    try {
      const expirationTimestamp = new Date();
      expirationTimestamp.setDate(expirationTimestamp.getDate() + 1);

      await admin.firestore().collection('alerts').add({
        title,
        description,
        priority,
        latitude,
        longitude,
        timestamp: new Date(),
        expirationTimestamp,
        helpCount: 0, // Inicializar el contador de ayuda en 0
      });

      res.status(201).json({ message: 'Alerta creada con éxito' });
    } catch (error) {
      console.error('Error al crear alerta:', error);
      res.status(500).send('Error al crear alerta');
    }
});
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
