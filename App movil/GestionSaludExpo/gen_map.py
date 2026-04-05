# -*- coding: utf-8 -*-
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

W, H = 1600, 1000
BG = (247, 250, 252)
img = Image.new('RGB', (W, H), BG)
draw = ImageDraw.Draw(img)
font = ImageFont.load_default()

def rounded_box(x0, y0, x1, y1, fill, outline="#2563eb", width=3, radius=20):
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill, outline=outline, width=width)
    return (x0 + x1) / 2, (y0 + y1) / 2

def text_center(text, cx, cy, color="#0f172a", font=font):
    bbox = draw.textbbox((0,0), text, font=font); w = bbox[2] - bbox[0]; h = bbox[3] - bbox[1]
    draw.text((cx - w / 2, cy - h / 2), text, fill=color, font=font)

text_center("Mapa de Navegación - GestionSalud", W / 2, 40, color="#0f172a")

login_labels = ["Login", "Registro", "Cambiar contraseña"]
start_x, start_y = 120, 120
box_w, box_h = 220, 80
for idx, label in enumerate(login_labels):
    x0 = start_x
    y0 = start_y + idx * (box_h + 20)
    x1 = x0 + box_w
    y1 = y0 + box_h
    cx, cy = rounded_box(x0, y0, x1, y1, fill="#e0f2fe")
    text_center(label, cx, cy)

mp_x0, mp_y0 = 450, 220
mp_x1, mp_y1 = 750, 320
rounded_box(mp_x0, mp_y0, mp_x1, mp_y1, fill="#dbeafe")
text_center("Menu Principal", (mp_x0 + mp_x1) / 2, (mp_y0 + mp_y1) / 2)
draw.line([(start_x + box_w, start_y + box_h), (mp_x0, (mp_y0 + mp_y1) / 2)], fill="#2563eb", width=4)

modules = [
    ("Expediente Gestión", "#fee2e2", 860, 100, 1200, 200),
    ("Paciente Resumen", "#e9d5ff", 860, 220, 1200, 320),
    ("Formularios", "#cffafe", 860, 340, 1200, 530),
    ("Recordatorios", "#fde68a", 860, 550, 1200, 690),
    ("Educación", "#fef9c3", 860, 710, 1200, 940),
]
for label, color, x0, y0, x1, y1 in modules:
    rounded_box(x0, y0, x1, y1, fill=color, outline="#0f172a", width=2)
    text_center(label, (x0 + x1) / 2, y0 + 24)

draw.line([(mp_x1, (mp_y0 + mp_y1) / 2), (modules[0][2], modules[0][3] + 30)], fill="#2563eb", width=4)

form_items = ["Paciente", "Consulta", "Cita", "Vacuna", "Medicacion", "Documentos", "Registro Dental"]
fx0, fy0, fx1, fy1 = modules[2][2:]
chip_y = fy0 + 50
for item in form_items:
    rounded_box(fx0 + 20, chip_y, fx1 - 20, chip_y + 34, fill="#ffffff", outline="#14b8a6", width=2, radius=12)
    text_center(item, (fx0 + fx1) / 2, chip_y + 17)
    chip_y += 38

rec_items = ["Crear recordatorio", "Lista de recordatorios"]
rx0, ry0, rx1, ry1 = modules[3][2:]
chip_y = ry0 + 60
for item in rec_items:
    rounded_box(rx0 + 20, chip_y, rx1 - 20, chip_y + 34, fill="#fff7ed", outline="#ea580c", width=2, radius=12)
    text_center(item, (rx0 + rx1) / 2, chip_y + 17)
    chip_y += 48

ex0, ey0, ex1, ey1 = modules[4][2:]
levels = {
    "Niños": ["Lavado de manos", "Cepillado", "Ejercicio/juego"],
    "Adolescentes": ["Salud mental", "Uso de pantallas", "Actividad física"],
    "Adultos": ["Chequéos médicos", "Control del estrés", "Primeros auxilios"],
}
level_y = ey0 + 50
for level, temas in levels.items():
    rounded_box(ex0 + 30, level_y, ex1 - 30, level_y + 44, fill="#e0f2fe", outline="#0ea5e9", radius=14)
    text_center(level, (ex0 + ex1) / 2, level_y + 22)
    topic_y = level_y + 54
    for tema in temas:
        rounded_box(ex0 + 50, topic_y, ex1 - 50, topic_y + 30, fill="#fff", outline="#0ea5e9", radius=10, width=2)
        text_center(tema, (ex0 + ex1) / 2, topic_y + 15)
        topic_y += 34
    level_y = topic_y + 20

out_path = Path("assets/educacion-navigation-map.png")
out_path.parent.mkdir(parents=True, exist_ok=True)
img.save(out_path)
print(out_path)
