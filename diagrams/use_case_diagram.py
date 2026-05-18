"""
Diagrama de Casos de Uso — novedad-app (MAQUINOR)
Genera un PDF con los actores y casos de uso del sistema.
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import Ellipse, FancyArrowPatch
import os

# ── Actores y sus casos de uso ─────────────────────────────────────────────────
ACTORS = {
    "Administrador": {
        "color": "#1a73e8",
        "x": 0.08,
        "use_cases": [
            "Gestionar usuarios",
            "Asignar roles",
            "Ver auditoría",
            "Configurar SMMLV / tasas",
            "Configurar tipos de ausencia",
            "Configurar conceptos de nómina",
            "Importar horarios (Excel)",
            "Gestionar períodos",
            "Calcular nómina",
            "Exportar nómina",
        ],
    },
    "Supervisor\nRRHH": {
        "color": "#0f9d58",
        "x": 0.08,
        "use_cases": [
            "Registrar ausencia",
            "Registrar accidente",
            "Consultar horario",
            "Ver dashboard KPIs",
            "Consultar empleados",
            "Ver récord de nómina",
        ],
    },
    "Empleado\n(futuro)": {
        "color": "#f4b400",
        "x": 0.92,
        "use_cases": [
            "Ver su desprendible",
            "Consultar sus ausencias",
        ],
    },
    "Sistema\nNeon (DB)": {
        "color": "#555",
        "x": 0.92,
        "use_cases": [
            "Persistir nómina calculada",
            "Almacenar horarios",
            "Almacenar novedades",
        ],
    },
}

# Posición manual de cada caso de uso [x, y] en axes fraction
USE_CASE_POSITIONS = {
    # Administrador
    "Gestionar usuarios":          (0.40, 0.92),
    "Asignar roles":               (0.55, 0.92),
    "Ver auditoría":               (0.70, 0.92),
    "Configurar SMMLV / tasas":    (0.40, 0.82),
    "Configurar tipos de ausencia":(0.55, 0.82),
    "Configurar conceptos de nómina": (0.70, 0.82),
    "Importar horarios (Excel)":   (0.40, 0.72),
    "Gestionar períodos":          (0.55, 0.72),
    "Calcular nómina":             (0.70, 0.72),
    "Exportar nómina":             (0.40, 0.62),
    # RRHH
    "Registrar ausencia":          (0.40, 0.50),
    "Registrar accidente":         (0.55, 0.50),
    "Consultar horario":           (0.70, 0.50),
    "Ver dashboard KPIs":          (0.40, 0.40),
    "Consultar empleados":         (0.55, 0.40),
    "Ver récord de nómina":        (0.70, 0.40),
    # Empleado futuro
    "Ver su desprendible":         (0.55, 0.28),
    "Consultar sus ausencias":     (0.70, 0.28),
    # Sistema DB
    "Persistir nómina calculada":  (0.40, 0.16),
    "Almacenar horarios":          (0.55, 0.16),
    "Almacenar novedades":         (0.70, 0.16),
}

# Posición Y de cada actor (centrado en su grupo de casos de uso)
ACTOR_Y = {
    "Administrador":    0.77,
    "Supervisor\nRRHH": 0.45,
    "Empleado\n(futuro)": 0.28,
    "Sistema\nNeon (DB)": 0.16,
}

# ── Dibujo ─────────────────────────────────────────────────────────────────────
FIG_W, FIG_H = 22, 26
fig, ax = plt.subplots(figsize=(FIG_W, FIG_H))
ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
ax.axis('off')
fig.patch.set_facecolor('#fafafa')

# Rectángulo del sistema
sys_rect = mpatches.FancyBboxPatch(
    (0.22, 0.08), 0.56, 0.88,
    boxstyle="round,pad=0.01",
    linewidth=2, edgecolor="#1a1a2e", facecolor="#f0f4ff",
    transform=ax.transAxes, zorder=0,
)
ax.add_patch(sys_rect)
ax.text(0.50, 0.975, "«sistema»  novedad-app",
        ha='center', va='center', fontsize=9, color='#1a1a2e',
        fontweight='bold', transform=ax.transAxes)

# Casos de uso (elipses)
UC_W, UC_H = 0.13, 0.030
for uc, (ux, uy) in USE_CASE_POSITIONS.items():
    e = Ellipse((ux, uy), UC_W, UC_H,
                linewidth=1.2, edgecolor='#1a1a2e', facecolor='white',
                transform=ax.transAxes, zorder=2)
    ax.add_patch(e)
    ax.text(ux, uy, uc, ha='center', va='center',
            fontsize=5.5, color='#1a1a2e',
            transform=ax.transAxes, zorder=3, multialignment='center')

def draw_actor(ax, x, y, name, color):
    """Dibuja un actor (stickman) en posición axes fraction."""
    # cabeza
    head = plt.Circle((x, y + 0.042), 0.014,
                       color=color, fill=True, zorder=4,
                       transform=ax.transAxes)
    ax.add_patch(head)
    # cuerpo
    ax.plot([x, x], [y + 0.028, y - 0.010],
            color=color, lw=1.8, transform=ax.transAxes, zorder=4)
    # brazos
    ax.plot([x - 0.020, x + 0.020], [y + 0.010, y + 0.010],
            color=color, lw=1.8, transform=ax.transAxes, zorder=4)
    # piernas
    ax.plot([x, x - 0.018], [y - 0.010, y - 0.032],
            color=color, lw=1.8, transform=ax.transAxes, zorder=4)
    ax.plot([x, x + 0.018], [y - 0.010, y - 0.032],
            color=color, lw=1.8, transform=ax.transAxes, zorder=4)
    # etiqueta
    ax.text(x, y - 0.045, name, ha='center', va='top',
            fontsize=6.5, color=color, fontweight='bold',
            transform=ax.transAxes, multialignment='center')

# Actores + flechas a sus casos de uso
for actor_name, info in ACTORS.items():
    ax_x = info["x"]
    ax_y = ACTOR_Y[actor_name]
    draw_actor(ax, ax_x, ax_y, actor_name, info["color"])

    for uc in info["use_cases"]:
        ux, uy = USE_CASE_POSITIONS[uc]
        # punto de partida: extremo del elipse más cercano al actor
        dx = ux - ax_x
        edge_x = ux - (UC_W / 2) * (1 if dx > 0 else -1)
        ax.annotate(
            "", xy=(edge_x, uy), xytext=(ax_x, ax_y),
            xycoords='axes fraction', textcoords='axes fraction',
            arrowprops=dict(
                arrowstyle='-',
                color=info["color"],
                lw=0.9, alpha=0.7,
            ),
            zorder=1,
        )

# Título y pie
ax.text(0.5, 0.998,
        "Diagrama de Casos de Uso — novedad-app (MAQUINOR)",
        ha='center', va='top', fontsize=11, fontweight='bold',
        color='#1a1a2e', transform=ax.transAxes)
ax.text(0.5, 0.002,
        "novedad-app © MAQUINOR 2026  |  Actores: Administrador · Supervisor RRHH · Empleado (futuro) · Sistema DB",
        ha='center', va='bottom', fontsize=5.5, color='#888',
        transform=ax.transAxes)

out_dir = os.path.dirname(os.path.abspath(__file__))
out_path = os.path.join(out_dir, "use_case_diagram.pdf")
fig.savefig(out_path, format='pdf', bbox_inches='tight', dpi=150,
            facecolor='#fafafa')
plt.close(fig)
print(f"PDF generado: {out_path}")
