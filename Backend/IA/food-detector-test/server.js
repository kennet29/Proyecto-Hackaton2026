import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const OPENAI_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o";

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

function buildPrompt(goal, description) {
  const normalizedGoal = goal || "Maintain weight";
  const descriptionBlock = description ? `User meal description: ${description}\n` : "";
  return `Analyze the food items in this image and provide the nutritional information in the following JSON format only:
{
  "identified_foods": [
    "food item 1",
    "food item 2"
  ],
  "macronutrients": {
    "carbohydrates": number,
    "protein": number,
    "fat": number,
    "calories": number,
    "sugar": number
  },
  "micronutrients": {
    "vitamin_a": number,
    "vitamin_c": number,
    "calcium": number,
    "iron": number,
    "fiber": number
  },
  "improvements": {
    "suggestions": [
      "Great choice on including [positive aspect]!",
      "Keep up the good work with [healthy element]!",
      "Consider adding [suggestion] to boost nutrition."
    ],
    "context": "Start with encouraging feedback about the healthy aspects of the meal, then provide constructive suggestions tailored to the user's goal."
  },
  "additional_info": {
    "serving_size": "text",
    "total_weight": number,
    "dietary_restrictions": "text",
    "allergens": "text"
  }
}
Always relate your suggestions to the user's goal: ${normalizedGoal}.
${descriptionBlock}
Return strictly valid JSON with double quotes and no extra commentary.`;
}

function extractTextFromResponse(response) {
  if (!response?.output) return "";
  const chunks = [];
  for (const item of response.output) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

function sanitizeJsonText(text) {
  if (!text) return "";
  return text.replace(/```json|```/gi, "").trim();
}

function safeJsonParse(text) {
  const cleaned = sanitizeJsonText(text);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("La respuesta del modelo no contiene JSON valido.");
  }
  const jsonSnippet = cleaned.slice(start, end + 1);
  return JSON.parse(jsonSnippet);
}

async function analyzeImageWithOpenAI(imagePath, goal, description) {
  if (!openaiClient) {
    throw new Error("OPENAI_API_KEY no esta configurada.");
  }

  const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });
  const response = await openaiClient.responses.create({
    model: OPENAI_MODEL,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: buildPrompt(goal, description) },
          { type: "input_image", image_base64: imageBase64 },
        ],
      },
    ],
    max_output_tokens: 900,
  });

  const textOutput = extractTextFromResponse(response);
  return safeJsonParse(textOutput);
}

app.get("/", (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>FoodNutrition-AI Preview</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 960px;
          margin: 40px auto;
          padding: 0 16px;
        }
        .card {
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 24px;
          background: #fff;
        }
        input, button, textarea, select {
          margin-top: 10px;
          font-family: inherit;
        }
        textarea {
          resize: vertical;
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
          flex: 1;
          min-width: 220px;
        }
        #status {
          margin-top: 12px;
          font-weight: bold;
        }
        .analysis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-top: 24px;
        }
        .analysis-card {
          border: 1px solid #e1e1e1;
          border-radius: 12px;
          padding: 16px;
          background: #fafafa;
        }
        .analysis-card h3 {
          margin: 0 0 10px;
        }
        .pill-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pill-list li {
          background: #eef2ff;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 0.9rem;
        }
        .kv {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 0.95rem;
          padding: 4px 0;
          border-top: 1px solid #ededed;
        }
        .kv:first-of-type {
          border-top: none;
        }
        .kv-key {
          color: #555;
          font-weight: 600;
        }
        .kv-value {
          flex: 1;
          text-align: right;
        }
        .kv-block {
          flex-direction: column;
          gap: 6px;
        }
        .kv-block .kv-value {
          text-align: left;
        }
        .json-chunk {
          white-space: pre-wrap;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 8px;
          margin-top: 8px;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>FoodNutrition-AI Preview</h1>
        <p>Este demo usa el mismo formato del Space ankit5566/FoodNutrition-AI, pero llama directamente a OpenAI.</p>

        <input type="file" id="image" accept="image/*" />

        <div class="row">
          <div class="field">
            <label for="goal">Objetivo nutricional</label>
            <select id="goal">
              <option value="Maintain weight">Mantener peso</option>
              <option value="Fat loss">Perdida de grasa</option>
              <option value="Weight gain">Aumento de peso</option>
              <option value="Muscle Gain">Ganancia muscular</option>
              <option value="Pregnancy">Embarazo</option>
              <option value="Body Building Competition">Competencia de fisicoculturismo</option>
              <option value="Marathon Training">Entrenamiento para maraton</option>
              <option value="Endurance Training">Entrenamiento de resistencia</option>
              <option value="Senior Citizen">Adulto mayor</option>
              <option value="Diabetic Patient">Paciente diabetico</option>
              <option value="Kidney Patient">Paciente renal</option>
            </select>
          </div>

          <div class="field">
            <label for="description">Descripcion del platillo (opcional)</label>
            <textarea id="description" rows="4" placeholder="Ej: Bowl con avena, frutos rojos y mantequilla de mani."></textarea>
          </div>
        </div>

        <br />
        <button onclick="sendImage()">Analizar</button>
        <div id="status"></div>
        <div id="result"></div>
      </div>

      <script>
        function escapeHtml(str) {
          return String(str).replace(/[&<>"']/g, (m) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
          })[m]);
        }

        function renderValue(value) {
          if (value === null || value === undefined) {
            return '<em>N/A</em>';
          }
          if (typeof value === 'string' && value.startsWith('http')) {
            const safe = escapeHtml(value);
            return '<a href="' + safe + '" target="_blank" rel="noopener noreferrer">' + safe + '</a>';
          }
          if (typeof value === 'object') {
            return '<pre class="json-chunk">' + escapeHtml(JSON.stringify(value, null, 2)) + '</pre>';
          }
          return escapeHtml(String(value));
        }

        function renderRow(key, value) {
          const isBlock = value && typeof value === 'object';
          const valueHtml = renderValue(value);
          if (isBlock) {
            return '<div class="kv kv-block"><div class="kv-key">' + escapeHtml(key) + '</div><div class="kv-value">' + valueHtml + '</div></div>';
          }
          return '<div class="kv"><span class="kv-key">' + escapeHtml(key) + '</span><span class="kv-value">' + valueHtml + '</span></div>';
        }

        function renderAnalysisSummary(analysis) {
          if (!analysis || typeof analysis !== 'object') return '';

          const cards = [];
          if (Array.isArray(analysis.identified_foods) && analysis.identified_foods.length) {
            const pills = analysis.identified_foods.map((item) => '<li>' + escapeHtml(item) + '</li>').join('');
            cards.push('<div class="analysis-card"><h3>Alimentos identificados</h3><ul class="pill-list">' + pills + '</ul></div>');
          }
          if (analysis.macronutrients && typeof analysis.macronutrients === 'object') {
            const rows = Object.entries(analysis.macronutrients).map(([key, value]) => renderRow(key, value)).join('');
            cards.push('<div class="analysis-card"><h3>Macronutrientes</h3>' + rows + '</div>');
          }
          if (analysis.micronutrients && typeof analysis.micronutrients === 'object') {
            const rows = Object.entries(analysis.micronutrients).map(([key, value]) => renderRow(key, value)).join('');
            cards.push('<div class="analysis-card"><h3>Micronutrientes</h3>' + rows + '</div>');
          }
          if (analysis.improvements && typeof analysis.improvements === 'object') {
            const suggestions = Array.isArray(analysis.improvements.suggestions)
              ? analysis.improvements.suggestions.map((s) => '<li>' + escapeHtml(s) + '</li>').join('')
              : '';
            const context = analysis.improvements.context ? '<p>' + escapeHtml(analysis.improvements.context) + '</p>' : '';
            cards.push('<div class="analysis-card"><h3>Sugerencias</h3>' + (suggestions ? '<ul>' + suggestions + '</ul>' : '') + context + '</div>');
          }
          if (analysis.additional_info && Object.keys(analysis.additional_info).length) {
            const rows = Object.entries(analysis.additional_info).map(([key, value]) => renderRow(key, value)).join('');
            cards.push('<div class="analysis-card"><h3>Informacion adicional</h3>' + rows + '</div>');
          }

          return cards.length ? '<h3>Resumen del modelo</h3><div class="analysis-grid">' + cards.join('') + '</div>' : '';
        }

        function renderExtraInfo(raw) {
          if (!raw) return '';

          if (Array.isArray(raw)) {
            const cards = raw.map((item, idx) => {
              if (item && typeof item === 'object') {
                const rows = Object.entries(item).map(([key, value]) => renderRow(key, value)).join('');
                return '<div class="analysis-card"><h3>Elemento ' + (idx + 1) + '</h3>' + rows + '</div>';
              }
              return '<div class="analysis-card"><h3>Elemento ' + (idx + 1) + '</h3>' + renderValue(item) + '</div>';
            }).join('');
            return cards ? '<h3>Detalles detectados</h3><div class="analysis-grid">' + cards + '</div>' : '';
          }

          if (typeof raw === 'object') {
            const rows = Object.entries(raw).map(([key, value]) => renderRow(key, value)).join('');
            return rows ? '<h3>Detalles detectados</h3><div class="analysis-grid">' + rows + '</div>' : '';
          }

          return '<h3>Detalles detectados</h3>' + renderValue(raw);
        }

        async function sendImage() {
          const fileInput = document.getElementById('image');
          const goal = document.getElementById('goal').value;
          const description = document.getElementById('description').value;
          const status = document.getElementById('status');
          const result = document.getElementById('result');

          if (!fileInput.files.length) {
            alert('Selecciona una imagen');
            return;
          }

          const formData = new FormData();
          formData.append('image', fileInput.files[0]);
          formData.append('goal', goal);
          formData.append('meal_description', description);

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
            const analysisSummary = renderAnalysisSummary(data.analysis || data.raw);
            const extraInfo = renderExtraInfo(data.raw);

            result.innerHTML = ` + "`" + `
              ${analysisSummary}
              <h3>Respuesta cruda</h3>
              <pre style="white-space: pre-wrap; background:#f7f7f7; padding:12px; border-radius:10px; border:1px solid #ddd;">${JSON.stringify(data.raw, null, 2)}</pre>
              <p>Este modelo entrega informacion textual, no genera una imagen anotada.</p>
              ${extraInfo}
            ` + "`" + `;
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
      return res.status(400).json({ error: "No se envio ninguna imagen" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "Configura OPENAI_API_KEY en el archivo .env para usar este modelo.",
      });
    }

    const goal = req.body.goal || "Maintain weight";
    const description = req.body.meal_description || "";
    const analysis = await analyzeImageWithOpenAI(req.file.path, goal, description);

    return res.json({
      message: "Imagen procesada correctamente",
      analysis,
      raw: analysis,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Error interno",
    });
  } finally {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
