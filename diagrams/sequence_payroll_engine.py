"""
Diagrama de Secuencia — Motor de Nómina novedad-app (MAQUINOR)
Genera un PDF con el diagrama completo.
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch
from reportlab.lib.pagesizes import A3, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
import io, os

# ── Participantes ──────────────────────────────────────────────────────────────
ACTORS = [
    "Cliente\n(API /calculate)",
    "PayrollEngine",
    "loadSettings",
    "loadEmployees",
    "loadSchedules",
    "loadNovelties",
    "applyConcepts",
    "applyRules",
    "calculateTotals",
    "persistPayroll",
    "DB\n(Neon)",
]

# Posición X de cada participante (columnas)
N = len(ACTORS)
COL_W = 1.0 / (N + 1)
COLS = [(i + 1) * COL_W for i in range(N)]

# ── Mensajes ───────────────────────────────────────────────────────────────────
# (from_idx, to_idx, label, is_return, color)
MESSAGES = [
    # Paso 0: entrada
    (0, 1,  "POST /api/payroll/calculate\n{periodId}",        False, "#1a73e8"),
    (1, 2,  "loadSettings(periodId)",                          False, "#1a73e8"),
    (2, 10, "SELECT payroll_settings\nSMMLV, tasas, aux_trans",False, "#555"),
    (10, 2, "settings{}",                                      True,  "#888"),
    (2, 1,  "→ settings{}",                                    True,  "#1a73e8"),

    # Paso 1: empleados
    (1, 3,  "loadEmployees(periodId)",                         False, "#0f9d58"),
    (3, 10, "SELECT employees\n(activos en período)",          False, "#555"),
    (10, 3, "employees[]",                                     True,  "#888"),
    (3, 1,  "→ employees[]",                                   True,  "#0f9d58"),

    # Paso 2: horarios
    (1, 4,  "loadSchedules(periodId, employees)",              False, "#f4b400"),
    (4, 10, "SELECT work_schedule\n(por empleado y período)",  False, "#555"),
    (10, 4, "schedules{}",                                     True,  "#888"),
    (4, 1,  "→ schedules{}",                                   True,  "#f4b400"),

    # Paso 3: novedades
    (1, 5,  "loadNovelties(periodId, employees)",              False, "#e53935"),
    (5, 10, "SELECT absences, accidents\n(del período)",       False, "#555"),
    (10, 5, "novelties{}",                                     True,  "#888"),
    (5, 1,  "→ novelties{}",                                   True,  "#e53935"),

    # Paso 4: conceptos
    (1, 6,  "applyConcepts(employees, schedules,\nsettings)",  False, "#8e24aa"),
    (6, 1,  "→ conceptRows[]\nHORAS_ORD, EXT, NOC, DOM…",     True,  "#8e24aa"),

    # Paso 5: reglas
    (1, 7,  "applyRules(conceptRows, novelties,\nsettings)",   False, "#e65100"),
    (7, 1,  "→ ruleRows[]\nSalud, Pensión, DESC_AUSENCIA,\nAUX_TRANS, Solidaridad",
                                                               True,  "#e65100"),

    # Paso 6: totales
    (1, 8,  "calculateTotals(conceptRows, ruleRows)",          False, "#00838f"),
    (8, 1,  "→ payrollRows[]\n{devengado, deducciones, neto}", True,  "#00838f"),

    # Paso 7: persistir
    (1, 9,  "persistPayroll(payrollRows, periodId)",           False, "#37474f"),
    (9, 10, "INSERT payroll_records\nUPDATE period → closed",  False, "#555"),
    (10, 9, "OK",                                              True,  "#888"),
    (9, 1,  "→ {saved: N}",                                    True,  "#37474f"),

    # Respuesta final
    (1, 0,  "200 OK\n{periodId, employees: N,\ntotal_neto}",   True,  "#1a73e8"),
]

# ── Figura ─────────────────────────────────────────────────────────────────────
FIG_W, FIG_H = 28, 22
fig, ax = plt.subplots(figsize=(FIG_W, FIG_H))
ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
ax.axis('off')
fig.patch.set_facecolor('#fafafa')

TOP_Y = 0.96
BOX_H = 0.04
LINE_BOTTOM = 0.04

ACTOR_COLORS = [
    "#1a73e8", "#34a853", "#0f9d58", "#f4b400",
    "#e53935", "#8e24aa", "#e65100", "#00838f",
    "#37474f", "#546e7a", "#555555",
]

# Cabeceras de participantes
for i, (x, name, color) in enumerate(zip(COLS, ACTORS, ACTOR_COLORS)):
    rect = mpatches.FancyBboxPatch(
        (x - COL_W * 0.42, TOP_Y - BOX_H),
        COL_W * 0.84, BOX_H,
        boxstyle="round,pad=0.005",
        linewidth=1.2, edgecolor=color, facecolor=color + "22",
        transform=ax.transAxes, zorder=3,
    )
    ax.add_patch(rect)
    ax.text(x, TOP_Y - BOX_H / 2, name,
            ha='center', va='center', fontsize=6.5, fontweight='bold',
            color=color, transform=ax.transAxes, zorder=4,
            multialignment='center')

# Líneas de vida
for x, color in zip(COLS, ACTOR_COLORS):
    ax.plot([x, x], [TOP_Y - BOX_H, LINE_BOTTOM],
            color=color, linewidth=0.8, linestyle='--', alpha=0.5,
            transform=ax.transAxes, zorder=1)

# Calcular paso Y por mensaje
N_MSG = len(MESSAGES)
Y_START = TOP_Y - BOX_H - 0.03
Y_END   = LINE_BOTTOM + 0.01
Y_STEP  = (Y_START - Y_END) / (N_MSG + 1)

ARROW_KW = dict(arrowstyle='->', mutation_scale=8, lw=1.0)

for idx, (frm, to, label, is_ret, color) in enumerate(MESSAGES):
    y = Y_START - (idx + 1) * Y_STEP
    x0, x1 = COLS[frm], COLS[to]

    style = 'dashed' if is_ret else 'solid'
    ax.annotate(
        "", xy=(x1, y), xytext=(x0, y),
        xycoords='axes fraction', textcoords='axes fraction',
        arrowprops=dict(**ARROW_KW, color=color,
                        linestyle=style,
                        connectionstyle='arc3,rad=0.0'),
        zorder=2,
    )

    mid_x = (x0 + x1) / 2
    v_offset = 0.008
    ax.text(mid_x, y + v_offset, label,
            ha='center', va='bottom', fontsize=5.5,
            color=color, style='italic' if is_ret else 'normal',
            transform=ax.transAxes, zorder=5,
            multialignment='center')

# Número de paso en el margen izquierdo
STEP_LABELS = [
    "① Settings", "","","",
    "② Empleados","","","",
    "③ Horarios","","","",
    "④ Novedades","","","",
    "⑤ Conceptos","",
    "⑥ Reglas SS","",
    "⑦ Totales","",
    "⑧ Persistir","","","",
    "Respuesta",
]
for idx, lbl in enumerate(STEP_LABELS):
    if not lbl:
        continue
    y = Y_START - (idx + 1) * Y_STEP
    ax.text(0.002, y, lbl, ha='left', va='center', fontsize=5.5,
            color='#333', fontweight='bold', transform=ax.transAxes)

# Título y pie
ax.text(0.5, 0.995, "Diagrama de Secuencia — Motor de Nómina · novedad-app (MAQUINOR)",
        ha='center', va='top', fontsize=10, fontweight='bold',
        color='#1a1a2e', transform=ax.transAxes)
ax.text(0.5, 0.002, "novedad-app © MAQUINOR 2026  |  pipeline: loadSettings → loadEmployees → loadSchedules → loadNovelties → applyConcepts → applyRules → calculateTotals → persistPayroll",
        ha='center', va='bottom', fontsize=5, color='#888', transform=ax.transAxes)

out_dir = os.path.dirname(os.path.abspath(__file__))
out_path = os.path.join(out_dir, "sequence_payroll_engine.pdf")
fig.savefig(out_path, format='pdf', bbox_inches='tight', dpi=150,
            facecolor='#fafafa')
plt.close(fig)
print(f"PDF generado: {out_path}")
