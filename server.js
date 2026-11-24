
const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const path = require('path'); // Importa path para manejar rutas

const app = express();
app.use(express.json());
app.use(cors());

// --- ESTO ES LO QUE FALTA ---
// Permite servir archivos estáticos (HTML, CSS, JS) desde la carpeta actual o una carpeta 'public'
app.use(express.static(path.join(__dirname))); 
// -----------------------------

const client = new MercadoPagoConfig({ 
  accessToken: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' 
});


app.post('/create_preference', async (req, res) => {
  try {
    const { title, price } = req.body;
    console.log("Recibiendo petición para:", title, price); // Para depurar en consola

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            title: title,
            unit_price: Number(price),
            quantity: 1,
            currency_id: 'MXN'
          }
        ],
        back_urls: {
          success: 'https://tusitio.com/exito',
          failure: 'https://tusitio.com/fallo',
          pending: 'https://tusitio.com/pendiente'
        },
        auto_return: 'approved'
      }
    });

    res.json({ id: result.id });
  } catch (error) {
    // Esto imprimirá el error real de la API de Mercado Pago en tu terminal de Node
    console.error('DETALLE DEL ERROR DE MERCADO PAGO:', error);
    res.status(500).json({ error: error.message || 'Error al crear la preferencia' });
  }
});

app.listen(3000, () => {
  console.log('Servidor corriendo en el puerto 3000');
});

