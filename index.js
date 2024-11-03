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
    const alerts = snapshot.docs.map(doc => ({
      id: doc.id, // Aquí agregamos el ID del documento
      ...doc.data() // Incluimos el resto de los datos de la alerta
    }));
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

app.patch('/alerts/:id/help', async (req, res) => {
  const alertId = req.params.id;

  try {
    // Referencia al documento de la alerta específica en Firestore
    const alertDocRef = admin.firestore().collection('alerts').doc(alertId);
    
    // Obtener el documento actual
    const alertDoc = await alertDocRef.get();

    if (!alertDoc.exists) {
      return res.status(404).json({ message: 'Alerta no encontrada' });
    }

    // Incrementar el contador helpCount en 1
    await alertDocRef.update({
      helpCount: admin.firestore.FieldValue.increment(1),
    });

    res.status(200).json({ message: 'Contador de ayuda incrementado con éxito' });
  } catch (error) {
    console.error('Error al incrementar el contador de ayuda:', error);
    res.status(500).send('Error al incrementar el contador de ayuda');
  }
});

app.post('/alerts/:id/messages', async (req, res) => {
  const alertId = req.params.id;
  const { message } = req.body;

  try {
    const alertDocRef = admin.firestore().collection('alerts').doc(alertId);

    // Añadir el nuevo mensaje al array de mensajes
    await alertDocRef.update({
      messages: admin.firestore.FieldValue.arrayUnion(message),
    });

    res.status(200).json({ message: 'Mensaje agregado con éxito' });
  } catch (error) {
    console.error('Error al agregar mensaje:', error);
    res.status(500).send('Error al agregar mensaje');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
