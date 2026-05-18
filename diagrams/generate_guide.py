"""
Guía Definitiva de Programación — novedad-app (MAQUINOR)
Genera un PDF completo con paso a paso para backend y frontend.
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch
import io, os

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, Image, KeepTogether
)
from reportlab.platypus.flowables import Flowable
from reportlab.lib.colors import HexColor, white, black

# ── Paleta de colores ──────────────────────────────────────────────────────────
C_DARK    = HexColor("#1a1a2e")
C_BLUE    = HexColor("#1a73e8")
C_GREEN   = HexColor("#0f9d58")
C_ORANGE  = HexColor("#e65100")
C_PURPLE  = HexColor("#7b1fa2")
C_GRAY    = HexColor("#546e7a")
C_LIGHT   = HexColor("#f0f4ff")
C_BGCODE  = HexColor("#1e1e2e")
C_CODEGRN = HexColor("#a6e3a1")
C_CODEBLU = HexColor("#89b4fa")
C_CODEYEL = HexColor("#f9e2af")
C_CODEPNK = HexColor("#f38ba8")
C_CODECMT = HexColor("#6c7086")
C_CODETXT = HexColor("#cdd6f4")

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ── Estilos ────────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, **kw)

ST = {
    "h1": S("h1", fontSize=22, textColor=C_DARK, spaceAfter=6,
             fontName="Helvetica-Bold", spaceBefore=20),
    "h2": S("h2", fontSize=15, textColor=C_BLUE, spaceAfter=4,
             fontName="Helvetica-Bold", spaceBefore=14),
    "h3": S("h3", fontSize=12, textColor=C_GREEN, spaceAfter=3,
             fontName="Helvetica-Bold", spaceBefore=10),
    "h4": S("h4", fontSize=10, textColor=C_ORANGE, spaceAfter=2,
             fontName="Helvetica-Bold", spaceBefore=8),
    "body": S("body", fontSize=9.5, textColor=C_DARK, spaceAfter=4,
              fontName="Helvetica", leading=14, alignment=TA_JUSTIFY),
    "bullet": S("bullet", fontSize=9, textColor=C_DARK, spaceAfter=3,
                fontName="Helvetica", leading=13, leftIndent=14,
                bulletIndent=4),
    "code_inline": S("ci", fontSize=8.5, textColor=HexColor("#c0392b"),
                     fontName="Courier", spaceAfter=2),
    "caption": S("cap", fontSize=8, textColor=C_GRAY, spaceAfter=6,
                 fontName="Helvetica-Oblique", alignment=TA_CENTER),
    "step": S("step", fontSize=10, textColor=white, spaceAfter=0,
              fontName="Helvetica-Bold", leading=14),
    "note": S("note", fontSize=8.5, textColor=HexColor("#37474f"),
              fontName="Helvetica-Oblique", leading=12, spaceAfter=3),
}

# ── Helpers ────────────────────────────────────────────────────────────────────
def H(tag, text):
    return Paragraph(text, ST[tag])

def P(text):
    return Paragraph(text, ST["body"])

def B(text):
    return Paragraph(f"• {text}", ST["bullet"])

def SP(n=6):
    return Spacer(1, n)

def HR(color=C_BLUE, thickness=0.5):
    return HRFlowable(width="100%", thickness=thickness, color=color, spaceAfter=4, spaceBefore=4)

def NOTE(text):
    data = [[Paragraph(f"<b>ℹ</b>  {text}", ST["note"])]]
    t = Table(data, colWidths=[15.5*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), HexColor("#e3f2fd")),
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [HexColor("#e3f2fd")]),
        ("BOX", (0,0), (-1,-1), 0.5, C_BLUE),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ]))
    return t

def WARN(text):
    data = [[Paragraph(f"<b>⚠</b>  {text}", ST["note"])]]
    t = Table(data, colWidths=[15.5*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), HexColor("#fff8e1")),
        ("BOX", (0,0), (-1,-1), 0.5, HexColor("#f9a825")),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ]))
    return t

def STEP_BOX(n, title, color=C_BLUE):
    data = [[Paragraph(f"Paso {n} — {title}", ST["step"])]]
    t = Table(data, colWidths=[15.5*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), color),
        ("LEFTPADDING", (0,0), (-1,-1), 10),
        ("RIGHTPADDING", (0,0), (-1,-1), 10),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("ROUNDEDCORNERS", [4]),
    ]))
    return t

def CODE(lines, title=""):
    """Bloque de código estilo dark theme."""
    code_style = ParagraphStyle("code", fontName="Courier", fontSize=7.5,
                                textColor=C_CODETXT, leading=11, spaceAfter=0)
    rows = []
    if title:
        hdr_style = ParagraphStyle("hdr", fontName="Courier-Bold", fontSize=7.5,
                                   textColor=HexColor("#89dceb"), leading=11)
        rows.append([Paragraph(f"// {title}", hdr_style)])
    for line in lines:
        rows.append([Paragraph(line.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;"),
                               code_style)])
    t = Table(rows, colWidths=[15.5*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), C_BGCODE),
        ("LEFTPADDING", (0,0), (-1,-1), 10),
        ("RIGHTPADDING", (0,0), (-1,-1), 10),
        ("TOPPADDING", (0,0), (-1,-1), 2),
        ("BOTTOMPADDING", (0,0), (-1,-1), 2),
        ("TOPPADDING", (0,0), (0,0), 8),
        ("BOTTOMPADDING", (0,-1), (0,-1), 8),
    ]))
    return t

def TWO_COL(left_items, right_items, lw=7.5*cm, rw=7.5*cm):
    """Dos columnas de contenido."""
    data = [[left_items, right_items]]
    t = Table(data, colWidths=[lw, rw])
    t.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("LEFTPADDING", (0,0), (-1,-1), 4),
        ("RIGHTPADDING", (0,0), (-1,-1), 4),
    ]))
    return t

# ── Diagramas embebidos (matplotlib → bytes → Image) ──────────────────────────

def fig_to_img(fig, w_cm=15.5, h_cm=None):
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', dpi=130, facecolor=fig.get_facecolor())
    buf.seek(0)
    plt.close(fig)
    img = Image(buf)
    img.drawWidth  = w_cm * cm
    img.drawHeight = (h_cm * cm) if h_cm else (img.imageHeight * (w_cm * cm) / img.imageWidth)
    return img

def make_architecture_diagram():
    fig, ax = plt.subplots(figsize=(13, 6))
    ax.set_xlim(0, 13); ax.set_ylim(0, 6); ax.axis('off')
    fig.patch.set_facecolor('#f8faff')

    def box(x, y, w, h, label, sublabel="", fc="#1a73e8", tc="white", fs=9):
        rect = mpatches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.12",
                                       facecolor=fc, edgecolor="white", linewidth=1.5, zorder=2)
        ax.add_patch(rect)
        ax.text(x+w/2, y+h/2+(0.12 if sublabel else 0), label, ha='center', va='center',
                fontsize=fs, fontweight='bold', color=tc, zorder=3)
        if sublabel:
            ax.text(x+w/2, y+h/2-0.22, sublabel, ha='center', va='center',
                    fontsize=6.5, color=tc, alpha=0.85, zorder=3)

    def arr(x1,y1,x2,y2,label="",color="#555"):
        ax.annotate("", xy=(x2,y2), xytext=(x1,y1),
                    arrowprops=dict(arrowstyle='->', color=color, lw=1.3,
                                   connectionstyle='arc3,rad=0.0'), zorder=1)
        if label:
            mx,my = (x1+x2)/2, (y1+y2)/2
            ax.text(mx, my+0.12, label, ha='center', va='bottom', fontsize=6.5,
                    color=color, style='italic')

    # Capas
    # Browser / Cliente
    box(0.3, 4.5, 2.8, 1.1, "Navegador", "React 18 + Vite", fc="#1a73e8")
    # Auth Context
    box(0.3, 3.1, 1.3, 1.0, "AuthContext", "JWT / localStorage", fc="#8e24aa", fs=7.5)
    # API Client
    box(1.8, 3.1, 1.3, 1.0, "api/client.js", "axios + dispatch()", fc="#0f9d58", fs=7.5)

    # Flechas frontend internas
    arr(1.7, 4.5, 1.05, 4.1, color="#8e24aa")
    arr(2.45, 4.5, 2.45, 4.1, color="#0f9d58")

    # API Gateway
    box(4.2, 3.7, 2.5, 1.2, "Express API", "/api/*  +  /api/commands", fc="#e65100")
    arr(3.1, 3.7, 4.2, 4.1, "HTTPS + JWT", "#e65100")

    # Middleware
    box(4.2, 2.3, 1.1, 1.0, "requireAuth", "JWT verify", fc="#7b1fa2", fs=7.5)
    box(5.5, 2.3, 1.2, 1.0, "auditLog", "INSERT audit", fc="#546e7a", fs=7.5)
    arr(5.47, 3.7, 4.75, 3.3, color="#7b1fa2")
    arr(5.47, 3.7, 6.1, 3.3, color="#546e7a")

    # Command Bus
    box(7.3, 3.7, 2.2, 1.2, "Command Bus", "register / dispatch", fc="#1a73e8")
    arr(6.7, 4.3, 7.3, 4.3, "POST /commands", "#1a73e8")

    # Handlers
    box(7.3, 2.2, 1.0, 1.1, "Handlers", "lógica de\nnegocio", fc="#0f9d58", fs=7.5)
    arr(8.4, 4.0, 8.1, 3.3, color="#0f9d58")

    # Repos
    box(8.6, 2.2, 1.0, 1.1, "Repos", "SQL queries\nparamétricos", fc="#f4b400", fs=7.5, tc="#333")
    arr(8.3, 2.7, 8.6, 2.7, color="#f4b400")

    # DB
    box(10.2, 2.8, 2.4, 1.5, "PostgreSQL", "Neon Cloud", fc="#1a1a2e")
    arr(9.6, 2.7, 10.2, 3.2, "SQL", "#1a1a2e")

    # Rutas REST directas
    box(4.2, 4.9+0.1, 2.5, 0.7, "Rutas REST", "GET /employees, /absences…", fc="#e53935", fs=7.5)
    arr(5.47, 4.9+0.1, 7.3, 3.7+0.6, color="#e53935")

    # Labels de capas
    for (xx,yy,lbl) in [(0.05,5.7,"FRONTEND"), (4.0,5.7,"BACKEND"), (10.0,5.7,"BASE DE DATOS")]:
        ax.text(xx, yy, lbl, fontsize=7, color="#aaa", fontweight='bold')

    ax.set_title("Arquitectura completa — novedad-app", fontsize=10, fontweight='bold',
                 color='#1a1a2e', pad=8)
    return fig_to_img(fig, w_cm=15.5)

def make_flow_backend():
    """Flujo backend: petición → respuesta."""
    fig, ax = plt.subplots(figsize=(12, 3.5))
    ax.set_xlim(0,12); ax.set_ylim(0,3.5); ax.axis('off')
    fig.patch.set_facecolor('#fafafa')

    boxes = [
        (0.3,  1.1, 1.6, 1.1, "Cliente\n(Frontend)", "#1a73e8", "white"),
        (2.3,  1.1, 1.6, 1.1, "Ruta\nExpress", "#e65100", "white"),
        (4.3,  1.1, 1.6, 1.1, "Middleware\nAuth/Audit", "#7b1fa2", "white"),
        (6.3,  1.1, 1.6, 1.1, "Handler /\nCommand Bus", "#0f9d58", "white"),
        (8.3,  1.1, 1.6, 1.1, "Repository\n(SQL)", "#f4b400", "#333"),
        (10.3, 1.1, 1.4, 1.1, "DB\nNeon", "#1a1a2e", "white"),
    ]
    for (x,y,w,h,lbl,fc,tc) in boxes:
        r = mpatches.FancyBboxPatch((x,y),w,h, boxstyle="round,pad=0.1",
                                    facecolor=fc, edgecolor="white", lw=1.2, zorder=2)
        ax.add_patch(r)
        ax.text(x+w/2,y+h/2, lbl, ha='center',va='center',
                fontsize=8, fontweight='bold', color=tc, zorder=3, multialignment='center')

    for i in range(len(boxes)-1):
        x1 = boxes[i][0]+boxes[i][2]
        x2 = boxes[i+1][0]
        y  = boxes[i][1]+boxes[i][3]/2
        ax.annotate("",xy=(x2,y),xytext=(x1,y),
                    arrowprops=dict(arrowstyle='->',color="#555",lw=1.2))

    labels = ["HTTP req","routeHandler","next()","dispatch()","query()","rows[]"]
    for i,lbl in enumerate(labels):
        if i < len(boxes)-1:
            x1 = boxes[i][0]+boxes[i][2]
            x2 = boxes[i+1][0]
            mx = (x1+x2)/2
            y  = boxes[i][1]+boxes[i][3]/2+0.18
            ax.text(mx,y,lbl,ha='center',va='bottom',fontsize=6,color="#555",style='italic')

    ax.set_title("Flujo de petición — Backend", fontsize=9, fontweight='bold', color='#1a1a2e')
    return fig_to_img(fig, w_cm=15.5, h_cm=4.5)

def make_flow_frontend():
    fig, ax = plt.subplots(figsize=(12, 3.5))
    ax.set_xlim(0,12); ax.set_ylim(0,3.5); ax.axis('off')
    fig.patch.set_facecolor('#fafafa')

    boxes = [
        (0.2,  1.1, 2.0, 1.1, "Page\nComponent", "#1a73e8", "white"),
        (2.8,  1.1, 1.8, 1.1, "useCommand()\nhook", "#8e24aa", "white"),
        (5.2,  1.1, 1.8, 1.1, "dispatch()\napi/client.js", "#0f9d58", "white"),
        (7.6,  1.1, 1.8, 1.1, "axios\nPOST /commands", "#e65100", "white"),
        (10.0, 1.1, 1.8, 1.1, "API\nBackend", "#1a1a2e", "white"),
    ]
    for (x,y,w,h,lbl,fc,tc) in boxes:
        r = mpatches.FancyBboxPatch((x,y),w,h, boxstyle="round,pad=0.1",
                                    facecolor=fc, edgecolor="white", lw=1.2, zorder=2)
        ax.add_patch(r)
        ax.text(x+w/2,y+h/2, lbl, ha='center',va='center',
                fontsize=8, fontweight='bold', color=tc, zorder=3, multialignment='center')

    for i in range(len(boxes)-1):
        x1 = boxes[i][0]+boxes[i][2]
        x2 = boxes[i+1][0]
        y  = boxes[i][1]+boxes[i][3]/2
        ax.annotate("",xy=(x2,y),xytext=(x1,y),
                    arrowprops=dict(arrowstyle='->',color="#555",lw=1.2))

    labels = ["execute(payload)","dispatch(cmd,payload)","http.post()","JSON response"]
    for i,lbl in enumerate(labels):
        if i < len(boxes)-1:
            x1 = boxes[i][0]+boxes[i][2]
            x2 = boxes[i+1][0]
            mx = (x1+x2)/2
            ax.text(mx,boxes[i][1]+boxes[i][3]/2+0.18,lbl,
                    ha='center',va='bottom',fontsize=6,color="#555",style='italic')

    ax.set_title("Flujo de acción — Frontend", fontsize=9, fontweight='bold', color='#1a1a2e')
    return fig_to_img(fig, w_cm=15.5, h_cm=4.5)

def make_folder_tree():
    fig, ax = plt.subplots(figsize=(13, 7))
    ax.set_xlim(0,13); ax.set_ylim(0,7); ax.axis('off')
    fig.patch.set_facecolor('#1e1e2e')

    lines_be = [
        ("backend/", 0, "#f9e2af"),
        ("├── src/", 0, "#89b4fa"),
        ("│   ├── commands/", 1, "#a6e3a1"),
        ("│   │   ├── commandBus.js", 2, "#cdd6f4"),
        ("│   │   └── index.js", 2, "#cdd6f4"),
        ("│   ├── handlers/", 1, "#a6e3a1"),
        ("│   │   ├── absenceHandler.js", 2, "#cdd6f4"),
        ("│   │   └── employeeHandler.js", 2, "#cdd6f4"),
        ("│   ├── repositories/", 1, "#a6e3a1"),
        ("│   │   ├── absenceRepo.js", 2, "#cdd6f4"),
        ("│   │   └── employeeRepo.js", 2, "#cdd6f4"),
        ("│   ├── routes/", 1, "#a6e3a1"),
        ("│   │   ├── absences.js", 2, "#cdd6f4"),
        ("│   │   └── payroll/", 2, "#f38ba8"),
        ("│   ├── middleware/", 1, "#a6e3a1"),
        ("│   │   ├── auth.js", 2, "#cdd6f4"),
        ("│   │   └── auditLog.js", 2, "#cdd6f4"),
        ("│   └── core/payroll-engine/", 1, "#f38ba8"),
        ("└── index.js", 0, "#89dceb"),
    ]
    lines_fe = [
        ("frontend/src/", 0, "#f9e2af"),
        ("├── api/", 0, "#89b4fa"),
        ("│   ├── client.js", 1, "#cdd6f4"),
        ("│   └── payroll.js", 1, "#cdd6f4"),
        ("├── context/", 0, "#89b4fa"),
        ("│   └── AuthContext.jsx", 1, "#cdd6f4"),
        ("├── hooks/", 0, "#89b4fa"),
        ("│   └── useCommand.js", 1, "#cdd6f4"),
        ("├── components/", 0, "#89b4fa"),
        ("│   └── Layout.jsx", 1, "#cdd6f4"),
        ("├── pages/", 0, "#a6e3a1"),
        ("│   ├── absences/", 1, "#f9e2af"),
        ("│   │   └── AbsencesPage.jsx", 2, "#cdd6f4"),
        ("│   ├── employees/", 1, "#f9e2af"),
        ("│   │   └── EmployeesPage.jsx", 2, "#cdd6f4"),
        ("│   └── payroll/", 1, "#f38ba8"),
        ("└── App.jsx", 0, "#89dceb"),
    ]

    ax.text(1.0, 6.7, "BACKEND", fontsize=9, fontweight='bold',
            color='#89b4fa', fontfamily='monospace')
    ax.text(7.5, 6.7, "FRONTEND", fontsize=9, fontweight='bold',
            color='#a6e3a1', fontfamily='monospace')

    y0 = 6.35
    for i,(txt,indent,color) in enumerate(lines_be):
        ax.text(0.3 + indent*0.35, y0 - i*0.31, txt,
                fontsize=7.5, color=color, fontfamily='monospace', va='top')

    for i,(txt,indent,color) in enumerate(lines_fe):
        ax.text(6.8 + indent*0.35, y0 - i*0.36, txt,
                fontsize=7.5, color=color, fontfamily='monospace', va='top')

    ax.axvline(x=6.5, color='#444', lw=0.8, linestyle='--', alpha=0.5)
    ax.set_title("Estructura de carpetas del proyecto", fontsize=9, fontweight='bold',
                 color='#cdd6f4', pad=6)
    return fig_to_img(fig, w_cm=15.5, h_cm=8)

# ── Contenido del documento ────────────────────────────────────────────────────

def build_doc():
    path = os.path.join(OUT_DIR, "guia_programacion_novedad_app.pdf")
    doc  = SimpleDocTemplate(
        path, pagesize=A4,
        leftMargin=2.2*cm, rightMargin=2.2*cm,
        topMargin=2.2*cm, bottomMargin=2.2*cm,
        title="Guía de Programación — novedad-app",
        author="MAQUINOR / novedad-app",
    )

    story = []

    # ──────────────────────────────── PORTADA ────────────────────────────────
    story += [
        SP(60),
        Paragraph(
            '<font color="#1a73e8"><b>novedad-app</b></font>',
            ParagraphStyle("cover_title", fontSize=32, alignment=TA_CENTER,
                           fontName="Helvetica-Bold", textColor=C_BLUE, spaceAfter=4)
        ),
        Paragraph(
            "Guía Definitiva de Programación",
            ParagraphStyle("cover_sub", fontSize=18, alignment=TA_CENTER,
                           fontName="Helvetica-Bold", textColor=C_DARK, spaceAfter=6)
        ),
        HR(C_BLUE, 1.5),
        SP(8),
        Paragraph(
            "Paso a paso para agregar funciones y módulos al Backend y al Frontend",
            ParagraphStyle("cover_desc", fontSize=12, alignment=TA_CENTER,
                           fontName="Helvetica", textColor=C_GRAY, spaceAfter=4)
        ),
        SP(16),
        Paragraph(
            "Sistema de novedades de empleados · MAQUINOR · 2026",
            ParagraphStyle("cover_foot", fontSize=9, alignment=TA_CENTER,
                           fontName="Helvetica-Oblique", textColor=C_GRAY)
        ),
        PageBreak(),
    ]

    # ──────────────────────────── ÍNDICE ─────────────────────────────────────
    story += [
        H("h1", "Contenido"),
        HR(),
        SP(4),
    ]
    toc_items = [
        ("1.", "Arquitectura del sistema",               "3"),
        ("2.", "Stack tecnológico",                       "4"),
        ("3.", "Estructura de carpetas",                  "5"),
        ("4.", "Agregar un módulo al BACKEND",            "6"),
        ("  4.1", "Crear la tabla (migración)",           "6"),
        ("  4.2", "Crear el repositorio",                 "7"),
        ("  4.3", "Crear el handler (mutaciones)",        "8"),
        ("  4.4", "Registrar el comando",                 "9"),
        ("  4.5", "Crear la ruta REST",                   "9"),
        ("  4.6", "Registrar la ruta en index.js",        "10"),
        ("5.", "Agregar un módulo al FRONTEND",           "11"),
        ("  5.1", "Crear las funciones de API",           "11"),
        ("  5.2", "Crear el componente de página",        "12"),
        ("  5.3", "Registrar la ruta en App.jsx",         "15"),
        ("  5.4", "Agregar al menú lateral (Layout)",     "15"),
        ("6.", "Ejemplo completo: módulo Vacaciones",     "16"),
        ("7.", "Patrones de uso frecuente",               "20"),
        ("8.", "Comandos útiles de desarrollo",           "22"),
        ("9.", "Reglas de oro",                           "23"),
    ]
    toc_data = [[
        Paragraph(f"<b>{n}</b>", ParagraphStyle("ti", fontSize=9, fontName="Helvetica-Bold",
                                                 textColor=C_DARK)),
        Paragraph(t, ParagraphStyle("tit", fontSize=9, fontName="Helvetica", textColor=C_DARK)),
        Paragraph(p, ParagraphStyle("tp", fontSize=9, fontName="Helvetica", textColor=C_GRAY,
                                    alignment=TA_CENTER)),
    ] for n,t,p in toc_items]
    toc_table = Table(toc_data, colWidths=[1.2*cm, 12.5*cm, 1.5*cm])
    toc_table.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING", (0,0), (-1,-1), 3),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ("LINEBELOW", (0,-1), (-1,-1), 0.3, C_GRAY),
    ]))
    story += [toc_table, PageBreak()]

    # ──────────────────────────── 1. ARQUITECTURA ─────────────────────────────
    story += [
        H("h1", "1. Arquitectura del sistema"),
        HR(),
        SP(4),
        P("novedad-app sigue una arquitectura <b>cliente-servidor</b> desacoplada. "
          "El frontend React se comunica con el backend Express mediante HTTP. "
          "Las <b>mutaciones</b> (crear, modificar) pasan por un <b>Command Bus</b>; "
          "las <b>consultas</b> (listar, obtener) van directo a rutas REST."),
        SP(6),
        make_architecture_diagram(),
        Paragraph("Diagrama de arquitectura completa — novedad-app", ST["caption"]),
        SP(8),
        H("h2", "Dos patrones de comunicación"),
        NOTE("Regla clave: usa el Command Bus para operaciones que <b>modifican estado</b> "
             "(crear, actualizar, dar de baja). Usa rutas REST directas para <b>consultas</b> (GET)."),
        SP(6),
    ]

    patterns = [
        ["Patrón", "Cuándo usarlo", "Endpoint", "Ejemplo"],
        ["Command Bus", "Crear / Modificar / Borrar", "POST /api/commands", "RegisterAbsence, OnboardEmployee"],
        ["REST directo", "Consultar / Listar / Exportar", "GET /api/recurso", "GET /api/absences, GET /api/employees"],
    ]
    pt = Table(patterns, colWidths=[2.8*cm, 4.5*cm, 3.5*cm, 4.5*cm])
    pt.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), C_BLUE),
        ("TEXTCOLOR", (0,0), (-1,0), white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 8),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [HexColor("#f0f4ff"), white]),
        ("GRID", (0,0), (-1,-1), 0.3, C_GRAY),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 6),
    ]))
    story += [pt, SP(8),
              make_flow_backend(),
              Paragraph("Flujo de una petición en el backend", ST["caption"]),
              SP(6),
              make_flow_frontend(),
              Paragraph("Flujo de una acción en el frontend", ST["caption"]),
              PageBreak()]

    # ──────────────────────────── 2. STACK ───────────────────────────────────
    story += [H("h1", "2. Stack tecnológico"), HR(), SP(4)]
    stack = [
        ["Capa", "Tecnología", "Versión", "Deploy"],
        ["Frontend", "React + Vite + Tailwind CSS", "React 18 / Vite 5 / TW 4", "Vercel"],
        ["Routing", "React Router", "v6", "—"],
        ["HTTP cliente", "axios", "—", "—"],
        ["Backend", "Node.js + Express", "Node 20 / Express 4", "Render"],
        ["Base de datos", "PostgreSQL (sin ORM)", "—", "Neon Cloud"],
        ["Auth", "JWT + bcryptjs", "—", "—"],
        ["Build tool", "Vite (frontend)", "—", "—"],
    ]
    st_tbl = Table(stack, colWidths=[2.8*cm, 5.5*cm, 3.5*cm, 3.5*cm])
    st_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), C_GREEN),
        ("TEXTCOLOR", (0,0), (-1,0), white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 8.5),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [HexColor("#f0fff4"), white]),
        ("GRID", (0,0), (-1,-1), 0.3, C_GRAY),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 6),
    ]))
    story += [st_tbl, SP(10),
              NOTE("Los repos de frontend y backend están <b>separados</b>: "
                   "cada uno tiene su propio <b>.git</b> y se despliega independientemente."),
              PageBreak()]

    # ──────────────────────────── 3. ESTRUCTURA ──────────────────────────────
    story += [H("h1", "3. Estructura de carpetas"), HR(), SP(4),
              make_folder_tree(),
              Paragraph("Árbol de carpetas — backend (izq.) y frontend (der.)", ST["caption"]),
              SP(8)]
    story += [
        H("h2", "Archivos clave que debes conocer"),
        SP(4),
    ]
    key_files = [
        ["Archivo", "Rol"],
        ["backend/src/commands/commandBus.js", "Registro y despacho de comandos"],
        ["backend/src/commands/index.js", "Registra todos los comandos del sistema"],
        ["backend/src/middleware/auth.js", "requireAuth + requireRole"],
        ["backend/src/db/client.js", "Pool de conexiones a PostgreSQL (Neon)"],
        ["backend/index.js", "App Express: monta todas las rutas"],
        ["frontend/src/api/client.js", "axios + dispatch() para commands"],
        ["frontend/src/api/payroll.js", "Todas las llamadas REST de nómina"],
        ["frontend/src/hooks/useCommand.js", "Hook para ejecutar comandos con estado"],
        ["frontend/src/context/AuthContext.jsx", "Login, logout, token JWT"],
        ["frontend/src/App.jsx", "Rutas y componentes del SPA"],
        ["frontend/src/components/Layout.jsx", "Shell con menú lateral"],
    ]
    kf_tbl = Table(key_files, colWidths=[8.5*cm, 7.0*cm])
    kf_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), C_DARK),
        ("TEXTCOLOR", (0,0), (-1,0), white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 8),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [HexColor("#f8f9fa"), white]),
        ("GRID", (0,0), (-1,-1), 0.3, C_GRAY),
        ("FONTNAME", (0,1), (0,-1), "Courier"),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 6),
    ]))
    story += [kf_tbl, PageBreak()]

    # ──────────────────────────── 4. BACKEND ─────────────────────────────────
    story += [H("h1", "4. Agregar un módulo al BACKEND"), HR(), SP(4),
              P("Ejemplo: módulo <b>Permisos de trabajo</b> (<i>work_permits</i>). "
                "Sigue estos 6 pasos en orden."),
              SP(6)]

    # 4.1 Migración
    story += [
        STEP_BOX("4.1", "Crear la tabla — Migración SQL", C_BLUE),
        SP(4),
        P("Crea un archivo en <b>backend/</b> llamado <code>migrate_work_permits.js</code>:"),
        SP(4),
        CODE([
            "// backend/migrate_work_permits.js",
            "require('dotenv').config()",
            "const { query } = require('./src/db/client')",
            "",
            "async function migrate() {",
            "  await query(`",
            "    CREATE TABLE IF NOT EXISTS work_permits (",
            "      id          SERIAL PRIMARY KEY,",
            "      employee_id INTEGER NOT NULL REFERENCES employees(id),",
            "      type        VARCHAR(50) NOT NULL,",
            "      start_date  DATE NOT NULL,",
            "      end_date    DATE,",
            "      reason      TEXT,",
            "      created_by  INTEGER REFERENCES users(id),",
            "      created_at  TIMESTAMPTZ DEFAULT NOW()",
            "    )",
            "  `)",
            "  console.log('Tabla work_permits creada')",
            "  process.exit(0)",
            "}",
            "",
            "migrate().catch(e => { console.error(e); process.exit(1) })",
        ], "migrate_work_permits.js"),
        SP(4),
        P("Agrega el script en <b>package.json</b> del backend:"),
        SP(4),
        CODE([
            '"migrate:work-permits": "node migrate_work_permits.js"',
        ], "backend/package.json — scripts"),
        SP(4),
        P("Ejecuta la migración:"),
        CODE([
            "cd backend",
            "npm run migrate:work-permits",
        ], "Terminal"),
        SP(8),
    ]

    # 4.2 Repositorio
    story += [
        STEP_BOX("4.2", "Crear el repositorio", C_GREEN),
        SP(4),
        P("Crea <b>backend/src/repositories/workPermitRepo.js</b>. "
          "Sólo SQL puro — sin lógica de negocio:"),
        SP(4),
        CODE([
            "// backend/src/repositories/workPermitRepo.js",
            "const { query } = require('../db/client')",
            "",
            "const workPermitRepo = {",
            "  async create(d) {",
            "    const { rows } = await query(",
            "      `INSERT INTO work_permits",
            "       (employee_id, type, start_date, end_date, reason, created_by)",
            "       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,",
            "      [d.employeeId, d.type, d.startDate, d.endDate, d.reason, d.createdBy]",
            "    )",
            "    return rows[0]",
            "  },",
            "",
            "  async findAll() {",
            "    const { rows } = await query(`",
            "      SELECT wp.*, e.name AS employee_name",
            "      FROM work_permits wp",
            "      JOIN employees e ON e.id = wp.employee_id",
            "      ORDER BY wp.created_at DESC",
            "    `)",
            "    return rows",
            "  },",
            "",
            "  async findById(id) {",
            "    const { rows } = await query(",
            "      'SELECT * FROM work_permits WHERE id = $1', [id]",
            "    )",
            "    return rows[0] || null",
            "  },",
            "}",
            "",
            "module.exports = workPermitRepo",
        ], "workPermitRepo.js"),
        SP(8),
    ]

    # 4.3 Handler
    story += [
        STEP_BOX("4.3", "Crear el handler (lógica de negocio)", C_ORANGE),
        SP(4),
        P("El handler valida los datos de entrada y llama al repositorio. "
          "Crea <b>backend/src/handlers/workPermitHandler.js</b>:"),
        SP(4),
        CODE([
            "// backend/src/handlers/workPermitHandler.js",
            "const workPermitRepo = require('../repositories/workPermitRepo')",
            "",
            "async function registerWorkPermit(payload, context) {",
            "  const { employeeId, type, startDate, endDate, reason } = payload",
            "",
            "  // Validación de campos requeridos",
            "  if (!employeeId || !type || !startDate) {",
            "    const e = new Error('employeeId, type y startDate son requeridos')",
            "    e.status = 400",
            "    throw e",
            "  }",
            "",
            "  return workPermitRepo.create({",
            "    employeeId, type, startDate, endDate, reason,",
            "    createdBy: context.userId,",
            "  })",
            "}",
            "",
            "module.exports = { registerWorkPermit }",
        ], "workPermitHandler.js"),
        SP(8),
    ]

    # 4.4 Registrar comando
    story += [
        STEP_BOX("4.4", "Registrar el comando en commands/index.js", C_PURPLE),
        SP(4),
        P("Abre <b>backend/src/commands/index.js</b> y agrega dos líneas:"),
        SP(4),
        CODE([
            "// backend/src/commands/index.js",
            "const { register } = require('./commandBus')",
            "const { registerAbsence }    = require('../handlers/absenceHandler')",
            "const { registerAccident }   = require('../handlers/accidentHandler')",
            "const { changeShift }        = require('../handlers/shiftHandler')",
            "const { onboardEmployee }    = require('../handlers/employeeHandler')",
            "",
            "// ↓ AGREGAR ESTAS DOS LÍNEAS",
            "const { registerWorkPermit } = require('../handlers/workPermitHandler')",
            "",
            "register('RegisterAbsence',   registerAbsence)",
            "register('RegisterAccident',  registerAccident)",
            "register('ChangeShift',       changeShift)",
            "register('OnboardEmployee',   onboardEmployee)",
            "",
            "// ↓ AGREGAR ESTA LÍNEA",
            "register('RegisterWorkPermit', registerWorkPermit)",
        ], "commands/index.js"),
        SP(8),
    ]

    # 4.5 Ruta REST
    story += [
        STEP_BOX("4.5", "Crear la ruta REST", C_GRAY),
        SP(4),
        P("Crea <b>backend/src/routes/workPermits.js</b> para las consultas (GET):"),
        SP(4),
        CODE([
            "// backend/src/routes/workPermits.js",
            "const router             = require('express').Router()",
            "const repo               = require('../repositories/workPermitRepo')",
            "const { requireAuth }    = require('../middleware/auth')",
            "const { auditRead }      = require('../middleware/auditLog')",
            "",
            "// GET /api/work-permits — lista todos",
            "router.get('/', requireAuth, auditRead('WorkPermits'), async (req, res, next) => {",
            "  try {",
            "    res.json({ data: await repo.findAll() })",
            "  } catch (err) { next(err) }",
            "})",
            "",
            "// GET /api/work-permits/:id — obtiene uno",
            "router.get('/:id', requireAuth, async (req, res, next) => {",
            "  try {",
            "    const permit = await repo.findById(req.params.id)",
            "    if (!permit) return res.status(404).json({ error: 'No encontrado' })",
            "    res.json({ data: permit })",
            "  } catch (err) { next(err) }",
            "})",
            "",
            "module.exports = router",
        ], "routes/workPermits.js"),
        SP(8),
    ]

    # 4.6 Registrar ruta
    story += [
        STEP_BOX("4.6", "Registrar la ruta en backend/index.js", C_DARK),
        SP(4),
        P("Abre <b>backend/index.js</b> y agrega el require + app.use:"),
        SP(4),
        CODE([
            "// backend/index.js  (fragmento relevante)",
            "const absencesRouter     = require('./src/routes/absences')",
            "const accidentsRouter    = require('./src/routes/accidents')",
            "const employeesRouter    = require('./src/routes/employees')",
            "",
            "// ↓ AGREGAR",
            "const workPermitsRouter  = require('./src/routes/workPermits')",
            "",
            "// ...",
            "",
            "app.use('/api/absences',     requireAuth, absencesRouter)",
            "app.use('/api/accidents',    requireAuth, accidentsRouter)",
            "app.use('/api/employees',    requireAuth, employeesRouter)",
            "",
            "// ↓ AGREGAR",
            "app.use('/api/work-permits', requireAuth, workPermitsRouter)",
        ], "backend/index.js"),
        SP(4),
        NOTE("El backend ya está listo. Prueba con: "
             "<b>POST /api/commands</b> body: "
             '<code>{"command":"RegisterWorkPermit","payload":{...}}</code> '
             "y <b>GET /api/work-permits</b>."),
        PageBreak(),
    ]

    # ──────────────────────────── 5. FRONTEND ────────────────────────────────
    story += [H("h1", "5. Agregar un módulo al FRONTEND"), HR(), SP(4),
              P("Continuando con el ejemplo de <b>Permisos de trabajo</b>. "
                "Sigue estos 4 pasos para tener la página funcional."),
              SP(6)]

    # 5.1 API
    story += [
        STEP_BOX("5.1", "Crear las funciones de API", C_BLUE),
        SP(4),
        P("Si el módulo no es de nómina, créalo como archivo nuevo. "
          "Si es de nómina, agrégalo a <b>frontend/src/api/payroll.js</b>. "
          "Para este ejemplo crea <b>frontend/src/api/workPermits.js</b>:"),
        SP(4),
        CODE([
            "// frontend/src/api/workPermits.js",
            "import http, { dispatch } from './client'",
            "",
            "export const workPermits = {",
            "  // Consultas → GET directo",
            "  list: () =>",
            "    http.get('/work-permits').then(r => r.data.data),",
            "",
            "  get: (id) =>",
            "    http.get(`/work-permits/${id}`).then(r => r.data.data),",
            "",
            "  // Mutaciones → Command Bus",
            "  create: (payload) =>",
            "    dispatch('RegisterWorkPermit', payload),",
            "}",
        ], "api/workPermits.js"),
        SP(8),
    ]

    # 5.2 Componente
    story += [
        STEP_BOX("5.2", "Crear el componente de página", C_GREEN),
        SP(4),
        P("Crea la carpeta y el archivo "
          "<b>frontend/src/pages/workPermits/WorkPermitsPage.jsx</b>. "
          "La estructura estándar de una página tiene 4 secciones:"),
        SP(4),
        CODE([
            "// frontend/src/pages/workPermits/WorkPermitsPage.jsx",
            "import { useState, useEffect } from 'react'",
            "import { workPermits } from '../../api/workPermits'",
            "import { useCommand }  from '../../hooks/useCommand'",
            "",
            "// ── 1. ESTADO ─────────────────────────────────────────────────",
            "export default function WorkPermitsPage() {",
            "  const [permits, setPermits]   = useState([])",
            "  const [loading, setLoading]   = useState(true)",
            "  const [showModal, setModal]   = useState(false)",
            "  const [form, setForm]         = useState({",
            "    employeeId: '', type: '', startDate: '', endDate: '', reason: '',",
            "  })",
            "",
            "  const createCmd = useCommand('RegisterWorkPermit')",
            "",
            "  // ── 2. CARGA INICIAL ──────────────────────────────────────",
            "  useEffect(() => { load() }, [])",
            "",
            "  async function load() {",
            "    setLoading(true)",
            "    try   { setPermits(await workPermits.list()) }",
            "    finally { setLoading(false) }",
            "  }",
            "",
            "  // ── 3. ACCIONES ───────────────────────────────────────────",
            "  async function handleSubmit(e) {",
            "    e.preventDefault()",
            "    await createCmd.execute(form)",
            "    setModal(false)",
            "    setForm({ employeeId:'',type:'',startDate:'',endDate:'',reason:'' })",
            "    load()",
            "  }",
            "",
            "  // ── 4. RENDER ─────────────────────────────────────────────",
            "  return (",
            "    <div className='p-6'>",
            "      <div className='flex justify-between items-center mb-4'>",
            "        <h1 className='text-2xl font-bold'>Permisos de Trabajo</h1>",
            "        <button onClick={() => setModal(true)}",
            "          className='bg-blue-600 text-white px-4 py-2 rounded'>",
            "          + Nuevo permiso",
            "        </button>",
            "      </div>",
            "",
            "      {/* Tabla */}",
            "      {loading ? <p>Cargando...</p> : (",
            "        <table className='w-full border-collapse text-sm'>",
            "          <thead>",
            "            <tr className='bg-gray-100'>",
            "              <th className='p-2 text-left'>Empleado</th>",
            "              <th className='p-2 text-left'>Tipo</th>",
            "              <th className='p-2 text-left'>Inicio</th>",
            "              <th className='p-2 text-left'>Fin</th>",
            "            </tr>",
            "          </thead>",
            "          <tbody>",
            "            {permits.map(p => (",
            "              <tr key={p.id} className='border-b'>",
            "                <td className='p-2'>{p.employee_name}</td>",
            "                <td className='p-2'>{p.type}</td>",
            "                <td className='p-2'>{p.start_date?.slice(0,10)}</td>",
            "                <td className='p-2'>{p.end_date?.slice(0,10) || '—'}</td>",
            "              </tr>",
            "            ))}",
            "          </tbody>",
            "        </table>",
            "      )}",
            "",
            "      {/* Modal */}",
            "      {showModal && (",
            "        <div className='fixed inset-0 bg-black/40 flex items-center justify-center'>",
            "          <form onSubmit={handleSubmit}",
            "            className='bg-white rounded-xl p-6 w-[460px] space-y-4'>",
            "            <h2 className='text-lg font-bold'>Nuevo permiso</h2>",
            "            <input type='number' placeholder='ID Empleado'",
            "              className='border rounded p-2 w-full'",
            "              value={form.employeeId}",
            "              onChange={e => setForm({...form, employeeId: e.target.value})} />",
            "            <input type='text' placeholder='Tipo'",
            "              className='border rounded p-2 w-full'",
            "              value={form.type}",
            "              onChange={e => setForm({...form, type: e.target.value})} />",
            "            <input type='date'",
            "              className='border rounded p-2 w-full'",
            "              value={form.startDate}",
            "              onChange={e => setForm({...form, startDate: e.target.value})} />",
            "            <div className='flex gap-2 justify-end'>",
            "              <button type='button' onClick={() => setModal(false)}",
            "                className='px-4 py-2 border rounded'>Cancelar</button>",
            "              <button type='submit'",
            "                disabled={createCmd.loading}",
            "                className='px-4 py-2 bg-blue-600 text-white rounded'>",
            "                {createCmd.loading ? 'Guardando...' : 'Guardar'}",
            "              </button>",
            "            </div>",
            "            {createCmd.error && (",
            "              <p className='text-red-500 text-sm'>{createCmd.error}</p>",
            "            )}",
            "          </form>",
            "        </div>",
            "      )}",
            "    </div>",
            "  )",
            "}",
        ], "WorkPermitsPage.jsx"),
        SP(8),
    ]

    # 5.3 Registrar ruta
    story += [
        STEP_BOX("5.3", "Registrar la ruta en App.jsx", C_ORANGE),
        SP(4),
        P("Abre <b>frontend/src/App.jsx</b> y agrega el import y la ruta:"),
        SP(4),
        CODE([
            "// frontend/src/App.jsx — solo las líneas nuevas",
            "",
            "// ↓ AGREGAR el import",
            "import WorkPermitsPage from './pages/workPermits/WorkPermitsPage'",
            "",
            "// ↓ AGREGAR dentro de <Routes>",
            "<Route",
            "  path='/work-permits'",
            "  element={<PrivateRoute><WorkPermitsPage /></PrivateRoute>}",
            "/>",
        ], "App.jsx"),
        SP(8),
    ]

    # 5.4 Menú lateral
    story += [
        STEP_BOX("5.4", "Agregar al menú lateral (Layout.jsx)", C_PURPLE),
        SP(4),
        P("Abre <b>frontend/src/components/Layout.jsx</b> y agrega el enlace al menú:"),
        SP(4),
        CODE([
            "// frontend/src/components/Layout.jsx — fragmento del menú",
            "import { Link } from 'react-router-dom'",
            "",
            "// Dentro del array de items de navegación, agrega:",
            "{ path: '/work-permits', label: 'Permisos', icon: '📋' },",
            "",
            "// O si el menú es JSX directo, agrega un <Link> en la lista:",
            "<Link to='/work-permits'",
            "  className='flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100'>",
            "  <span>📋</span>",
            "  {!collapsed && <span>Permisos</span>}",
            "</Link>",
        ], "Layout.jsx"),
        SP(4),
        NOTE("Con estos 4 pasos el módulo está completo. "
             "El frontend puede crear permisos (vía Command Bus) y listarlos (vía GET REST)."),
        PageBreak(),
    ]

    # ──────────────────────────── 6. EJEMPLO COMPLETO ────────────────────────
    story += [
        H("h1", "6. Ejemplo completo — módulo Vacaciones"),
        HR(), SP(4),
        P("A continuación se muestra el checklist completo de todos los archivos "
          "que debes crear o modificar para un módulo nuevo, usando <b>Vacaciones</b> "
          "como ejemplo real. Marca cada ítem al completarlo."),
        SP(6),
    ]

    checklist = [
        ["☐", "CREAR", "backend/migrate_vacations.js", "Tabla vacations en PostgreSQL"],
        ["☐", "CREAR", "backend/src/repositories/vacationRepo.js", "create, findAll, findByEmployee"],
        ["☐", "CREAR", "backend/src/handlers/vacationHandler.js", "registerVacation(payload, ctx)"],
        ["☐", "EDITAR", "backend/src/commands/index.js", "require + register('RegisterVacation', ...)"],
        ["☐", "CREAR", "backend/src/routes/vacations.js", "GET / y GET /:id"],
        ["☐", "EDITAR", "backend/index.js", "app.use('/api/vacations', ...)"],
        ["☐", "CREAR", "frontend/src/api/vacations.js", "list(), get(), create()"],
        ["☐", "CREAR", "frontend/src/pages/vacations/VacationsPage.jsx", "Página con tabla + modal"],
        ["☐", "EDITAR", "frontend/src/App.jsx", "import + <Route path='/vacations' .../>"],
        ["☐", "EDITAR", "frontend/src/components/Layout.jsx", "Link al menú"],
        ["☐", "EJECUTAR", "npm run migrate:vacations", "Crear la tabla en Neon"],
        ["☐", "PROBAR", "POST /api/commands + GET /api/vacations", "Verificar en Postman o el browser"],
    ]
    cl_tbl = Table(checklist, colWidths=[0.6*cm, 1.5*cm, 6.2*cm, 7.0*cm])
    cl_tbl.setStyle(TableStyle([
        ("FONTSIZE", (0,0), (-1,-1), 8),
        ("FONTNAME", (0,0), (0,-1), "Helvetica-Bold"),
        ("FONTNAME", (1,0), (1,-1), "Helvetica-Bold"),
        ("TEXTCOLOR", (1,0), (1,-1), C_GREEN),
        ("FONTNAME", (2,0), (2,-1), "Courier"),
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [HexColor("#f8f9fa"), white]),
        ("GRID", (0,0), (-1,-1), 0.3, C_GRAY),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 5),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ]))
    story += [cl_tbl, SP(10)]

    # Código del handler de vacaciones
    story += [
        H("h3", "Handler completo — vacationHandler.js"),
        SP(4),
        CODE([
            "const vacationRepo = require('../repositories/vacationRepo')",
            "",
            "async function registerVacation(payload, context) {",
            "  const { employeeId, startDate, endDate, days } = payload",
            "  if (!employeeId || !startDate || !endDate) {",
            "    const e = new Error('employeeId, startDate y endDate requeridos')",
            "    e.status = 400; throw e",
            "  }",
            "  return vacationRepo.create({",
            "    employeeId, startDate, endDate, days,",
            "    createdBy: context.userId,",
            "  })",
            "}",
            "",
            "module.exports = { registerVacation }",
        ], "vacationHandler.js"),
        SP(8),
    ]

    story += [
        H("h3", "Repositorio — vacationRepo.js"),
        SP(4),
        CODE([
            "const { query } = require('../db/client')",
            "",
            "const vacationRepo = {",
            "  async create(d) {",
            "    const { rows } = await query(",
            "      `INSERT INTO vacations (employee_id,start_date,end_date,days,created_by)",
            "       VALUES ($1,$2,$3,$4,$5) RETURNING *`,",
            "      [d.employeeId, d.startDate, d.endDate, d.days, d.createdBy]",
            "    )",
            "    return rows[0]",
            "  },",
            "  async findAll() {",
            "    const { rows } = await query(`",
            "      SELECT v.*, e.name AS employee_name",
            "      FROM vacations v JOIN employees e ON e.id = v.employee_id",
            "      ORDER BY v.start_date DESC`,",
            "    )",
            "    return rows",
            "  },",
            "  async findByEmployee(employeeId) {",
            "    const { rows } = await query(",
            "      'SELECT * FROM vacations WHERE employee_id=$1 ORDER BY start_date DESC',",
            "      [employeeId]",
            "    )",
            "    return rows",
            "  },",
            "}",
            "module.exports = vacationRepo",
        ], "vacationRepo.js"),
        PageBreak(),
    ]

    # ──────────────────────────── 7. PATRONES ────────────────────────────────
    story += [H("h1", "7. Patrones de uso frecuente"), HR(), SP(4)]

    story += [
        H("h2", "7.1 useCommand — ejecutar una mutación con feedback"),
        CODE([
            "// En cualquier página del frontend:",
            "import { useCommand } from '../../hooks/useCommand'",
            "",
            "const cmd = useCommand('NombreDelComando')",
            "",
            "// Al enviar el formulario:",
            "await cmd.execute({ campo1: valor1, campo2: valor2 })",
            "",
            "// Propiedades disponibles:",
            "cmd.loading  // true mientras espera respuesta",
            "cmd.error    // string con el mensaje de error, o null",
        ], "Patrón useCommand"),
        SP(8),

        H("h2", "7.2 Llamadas GET directas desde un efecto"),
        CODE([
            "import http from '../../api/client'",
            "import { useState, useEffect } from 'react'",
            "",
            "const [data, setData] = useState([])",
            "",
            "useEffect(() => {",
            "  http.get('/employees')",
            "    .then(r => setData(r.data.data))",
            "    .catch(console.error)",
            "}, [])",
        ], "Patrón GET con useEffect"),
        SP(8),

        H("h2", "7.3 requireRole — proteger rutas del backend por rol"),
        CODE([
            "// backend/src/routes/miRuta.js",
            "const { requireAuth, requireRole } = require('../middleware/auth')",
            "",
            "// Solo accesible para admins:",
            "router.delete('/:id',",
            "  requireAuth,",
            "  requireRole('admin'),",
            "  async (req, res, next) => {",
            "    // ...",
            "  }",
            ")",
        ], "Patrón requireRole"),
        SP(8),

        H("h2", "7.4 AdminRoute — proteger páginas del frontend por rol"),
        CODE([
            "// frontend/src/App.jsx",
            "// Ya tienes AdminRoute definido. Úsalo así:",
            "<Route",
            "  path='/mi-pagina-admin'",
            "  element={<AdminRoute><MiPaginaAdmin /></AdminRoute>}",
            "/>",
        ], "Patrón AdminRoute"),
        SP(8),

        H("h2", "7.5 Errores estandarizados en handlers"),
        CODE([
            "// Siempre lanza errores con .status para que Express los maneje:",
            "if (!payload.campo) {",
            "  const e = new Error('Descripción clara del error')",
            "  e.status = 400   // 400 Bad Request, 404 Not Found, 403 Forbidden",
            "  throw e",
            "}",
        ], "Patrón de errores"),
        SP(8),

        H("h2", "7.6 Agregar un parámetro configurable a payroll_settings"),
        CODE([
            "-- En la DB, inserta el nuevo parámetro:",
            "INSERT INTO payroll_settings (key, value, description)",
            "VALUES ('mi_parametro', '0.05', 'Descripción del parámetro');",
            "",
            "-- En el motor de nómina (backend/src/core/payroll-engine/pipeline/loadSettings.js):",
            "// Ya se carga todo: ctx.settings.mi_parametro estará disponible",
            "",
            "-- En la UI, ya aparece automáticamente en /payroll/settings",
        ], "Patrón payroll_settings"),
        PageBreak(),
    ]

    # ──────────────────────────── 8. COMANDOS ────────────────────────────────
    story += [H("h1", "8. Comandos útiles de desarrollo"), HR(), SP(4)]

    cmds = [
        ["Contexto", "Comando", "Descripción"],
        ["Backend",  "cd backend && npm run dev",            "Iniciar servidor (puerto 3001)"],
        ["Backend",  "npm run migrate:nombre",               "Ejecutar una migración específica"],
        ["Backend",  "npm run seed:settings",                "Actualizar payroll_settings"],
        ["Frontend", "cd frontend && npm run dev",           "Iniciar Vite (puerto 5173)"],
        ["Frontend", "npm run build",                        "Build de producción"],
        ["Git BE",   "git add . && git commit && git push",  "Commit y push del backend"],
        ["Git FE",   "git add . && git commit && git push",  "Commit y push del frontend"],
        ["DB",       "psql $DATABASE_URL",                   "Conexión directa a Neon"],
        ["DB",       "\\dt",                                 "Listar tablas (en psql)"],
        ["Test API", "curl -X POST localhost:3001/api/commands -H 'Content-Type: application/json' -d '{\"command\":\"RegisterAbsence\",\"payload\":{}}'",
                     "Probar un comando"],
    ]
    cmd_tbl = Table(cmds, colWidths=[2.0*cm, 8.0*cm, 5.5*cm])
    cmd_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), C_DARK),
        ("TEXTCOLOR", (0,0), (-1,0), white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 7.5),
        ("FONTNAME", (0,1), (1,-1), "Courier"),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [HexColor("#f8f9fa"), white]),
        ("GRID", (0,0), (-1,-1), 0.3, C_GRAY),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 5),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("TEXTCOLOR", (0,1), (0,-1), C_BLUE),
        ("FONTNAME", (0,1), (0,-1), "Helvetica-Bold"),
    ]))
    story += [cmd_tbl, SP(10),
              WARN("Nunca hagas <b>git push --force</b> a main. "
                   "Cada subcarpeta (frontend/, backend/) tiene su propio repositorio."),
              PageBreak()]

    # ──────────────────────────── 9. REGLAS DE ORO ───────────────────────────
    story += [H("h1", "9. Reglas de oro"), HR(), SP(4),
              P("Estas reglas mantienen el proyecto consistente y fácil de mantener:"),
              SP(6)]

    rules = [
        ("01", C_BLUE,   "Command Bus solo para mutaciones",
         "Crear, actualizar y borrar van por POST /api/commands con {command, payload}. "
         "Las consultas (GET) van directo al router de Express."),
        ("02", C_GREEN,  "Sin ORM — SQL puro en los repos",
         "Los repositorios usan query() de db/client.js con parámetros posicionales ($1, $2...). "
         "Nunca concatenes strings con datos de usuario."),
        ("03", C_ORANGE, "Los parámetros de nómina van en payroll_settings",
         "Tasas, límites y valores configurables se leen de la tabla payroll_settings. "
         "Nunca los hardcodees en el código del motor."),
        ("04", C_PURPLE, "Validación en los handlers, no en las rutas",
         "El handler valida el payload y lanza errores con .status. La ruta solo llama next(err)."),
        ("05", C_GRAY,   "useCommand para mutaciones, useEffect+http para consultas",
         "En el frontend, sigue este patrón para que el estado de loading/error sea automático."),
        ("06", C_DARK,   "Repos separados — commit a la subcarpeta correcta",
         "frontend/ y backend/ tienen cada uno su .git. No hagas git en la raíz del proyecto."),
        ("07", C_BLUE,   "Tailwind para estilos — sin CSS custom",
         "Usa clases utilitarias de Tailwind. Si necesitas algo muy específico usa style={}."),
        ("08", C_GREEN,  "Migra antes de codificar",
         "Crea y ejecuta la migración antes de escribir el repo o el handler. "
         "La tabla debe existir en Neon antes de cualquier query."),
    ]

    for num, color, title, desc in rules:
        rule_data = [[
            Paragraph(f"<b>{num}</b>", ParagraphStyle("rn", fontSize=18, fontName="Helvetica-Bold",
                                                       textColor=color, alignment=TA_CENTER)),
            [Paragraph(f"<b>{title}</b>",
                       ParagraphStyle("rt", fontSize=10, fontName="Helvetica-Bold",
                                      textColor=color, spaceAfter=2)),
             Paragraph(desc, ParagraphStyle("rd", fontSize=8.5, fontName="Helvetica",
                                            textColor=C_DARK, leading=12))],
        ]]
        rt = Table(rule_data, colWidths=[1.2*cm, 14.3*cm])
        rt.setStyle(TableStyle([
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
            ("LEFTPADDING", (0,0), (0,0), 4),
            ("LEFTPADDING", (1,0), (1,0), 8),
            ("TOPPADDING", (0,0), (-1,-1), 8),
            ("BOTTOMPADDING", (0,0), (-1,-1), 8),
            ("LINEBELOW", (0,0), (-1,-1), 0.4, HexColor("#e0e0e0")),
        ]))
        story.append(KeepTogether([rt, SP(2)]))

    # Pie final
    story += [
        SP(20),
        HR(C_BLUE, 1),
        Paragraph(
            "novedad-app · MAQUINOR · Guía generada automáticamente desde el código fuente · 2026",
            ParagraphStyle("footer", fontSize=7.5, alignment=TA_CENTER,
                           fontName="Helvetica-Oblique", textColor=C_GRAY)
        ),
    ]

    doc.build(story)
    return path

# ── Main ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    path = build_doc()
    print(f"PDF generado: {path}")
