# Mini proyecto para probar `harrispatil/food_calorie_detector`

## Estructura

```text
food-detector-test/
├─ package.json
├─ server.js\([gradio.app](https://www.gradio.app/docs/js-client?utm_source=chatgpt.com)) 1) package.json

```json
{
  "name": "food-detector-test",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "@gradio/client": "^1.19.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.2",
    "multer": "^1.4.5-lts.1"
  }
}
```

## 2) .env

```env
PORT=3000
HF_TOKEN=
```

Deja `HF_TOKEN` vacío si el Space es público. Si te da error de acceso o límites, pon tu token de Hugging Face.

## 3) server.js

```javascript
import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Client } from "@gradio/client";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    cb(null, unique);
  },
});

const upload = multer({ storage });

let client;

async function getClient() {
  if (client) return client;

  const options = {};
  if (process.env.HF_TOKEN) {
    options.hf_token = process.env.HF_TOKEN;
  }

  client = await Client.connect("harrispatil/food_calorie_detector", options);
  return client;
}

app.get("/", (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Prueba Food Detector</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 40px auto;
          padding: 0 16px;
        }
        .card {
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 20px;
        }
        input, button {
          margin-top: 10px;
        }
        img {
          max-width: 100%;
          border-radius: 12px;
          margin-top: 16px;
          border: 1px solid #ddd;
        }
        .row {
          display: flex;
          gap: 12px;
          margin-top: 10px;
          flex-wrap: wrap;
        }
        .field {
          display: flex;
          flex-direction: column;
        }
        #status {
          margin-top: 12px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Prueba Food Calorie Detector</h1>
        <p>Sube una imagen de comida y envíala al Space de Hugging Face.</p>

        <input type="file" id="image" accept="image/*" />

        <div class="row">
          <div class="field">
            <label for="conf">Confidence Threshold</label>
            <input type="number" id="conf" min="0" max="1" step="0.01" value="0.25" />
          </div>

          <div class="field">
            <label for="iou">IoU Threshold</label>
            <input type="number" id="iou" min="0" max="1" step="0.01" value="0.45" />
          </div>
        </div>

        <br />
        <button onclick="sendImage()">Probar</button>
        <div id="status"></div>
        <div id="result"></div>
      </div>

      <script>
        async function sendImage() {
          const fileInput = document.getElementById('image');
          const conf = document.getElementById('conf').value;
          const iou = document.getElementById('iou').value;
          const status = document.getElementById('status');
          const result = document.getElementById('result');

          if (!fileInput.files.length) {
            alert('Selecciona una imagen');
            return;
          }

          const formData = new FormData();
          formData.append('image', fileInput.files[0]);
          formData.append('conf_threshold', conf);
          formData.append('iou_threshold', iou);

          status.textContent = 'Procesando...';
          result.innerHTML = '';

          try {
            const response = await fetch('/detect', {
              method: 'POST',
              body: formData
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || 'Error procesando imagen');
            }

            status.textContent = 'Listo';

            result.innerHTML = `
              <h3>Respuesta cruda</h3>
              <pre style="white-space: pre-wrap; background:#f7f7f7; padding:12px; border-radius:10px; border:1px solid #ddd;">${JSON.stringify(data.raw, null, 2)}</pre>
              ${data.outputImage ? `<h3>Imagen devuelta</h3><img src="${data.outputImage}" alt="Resultado" />` : '<p>No se pudo renderizar una imagen directamente, pero sí llegó una respuesta.</p>'}
            `;
          } catch (error) {
            status.textContent = 'Error';
            result.innerHTML = `<p style="color:red;">${error.message}</p>`;
          }
        }
      </script>
    </body>
    </html>
  `);
});

app.post("/detect", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se envió ninguna imagen" });
    }

    const confThreshold = Number(req.body.conf_threshold ?? 0.25);
    const iouThreshold = Number(req.body.iou_threshold ?? 0.45);

    const gradio = await getClient();
    const imageBuffer = fs.readFileSync(req.file.path);

    const prediction = await gradio.predict("/detect_and_overlay_nutrition", {
      image: imageBuffer,
      conf_threshold: confThreshold,
      iou_threshold: iouThreshold,
    });

    const raw = prediction.data;
    let outputImage = null;

    if (Array.isArray(raw) && raw.length > 0) {
      const first = raw[0];

      if (typeof first === "string") {
        outputImage = first;
      } else if (first?.url) {
        outputImage = first.url;
      } else if (first?.path) {
        outputImage = first.path;
      }
    }

    return res.json({
      message: "Imagen procesada correctamente",
      outputImage,
      raw,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Error interno",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
```

## 4) Cómo instalar y probar

```bash
npm install
npm run dev
```

Luego abre en tu navegador:

```text
http://localhost:3000
```

## 5) Qué hace este proyecto

- Muestra una página simple para subir una imagen.
- Envía la imagen a tu backend en Node.js.
- El backend llama al Space `harrispatil/food_calorie_detector` con `@gradio/client`.
- Devuelve la respuesta cruda del modelo.
- Si la respuesta incluye una URL o ruta de imagen, intenta mostrarla en pantalla.

## 6) Posibles errores normales

### Error de acceso
Si sale algo como acceso denegado o autorización, llena `HF_TOKEN` en `.env`.

### Error por límite
Si el Space está saturado o limitado, puede tardar, fallar o devolver errores temporales.

### La imagen no se muestra
Algunos Spaces devuelven formatos distintos. Por eso el proyecto también te enseña `raw` para ver exactamente qué regresó la API.

## 7) Mejora siguiente

Si este ejemplo te funciona, el siguiente paso sería convertirlo a:

- backend en NestJS
- endpoint `/food/analyze`
- subida de imagen con `FileInterceptor`
- respuesta JSON más limpia para usarla en tu app

