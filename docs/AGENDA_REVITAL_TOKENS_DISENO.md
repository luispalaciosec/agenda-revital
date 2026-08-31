# Agenda Revital — Tokens de diseño

**Anexo de `AGENDA_REVITAL_ESPECIFICACION.md`**
Versión 1.0 · 30 de agosto de 2026

Este archivo define la identidad visual del sistema. Claude Code lo consume directo: los valores van a `globals.css` y `tailwind.config.ts` tal como están escritos.

---

## 1. La marca de Revital

El logotipo es una **cruz médica formada por cuatro hojas** que se abrazan, en verde y turquesa, sobre un wordmark azul marino. Es un símbolo de cuidado, no de urgencia: formas redondeadas, sin ángulos duros, sin el rojo del sector.

**Eso define la dirección del producto.** La interfaz debe sentirse tranquila y ordenada, no clínica ni alarmante. Alguien que agenda una cita médica ya llega con algo de tensión; la pantalla no debería sumar.

---

## 2. Paleta

### 2.1 Colores de marca

```
Azul marino   #3c4c69   Color principal. Texto, encabezados, acciones.
Verde         #9fc868   Marca. Superficies y acentos decorativos.
Turquesa      #79c5c0   Marca. Superficies y acentos decorativos.
```

### 2.2 ⚠️ Los colores de marca no sirven para texto ni botones

Medí el contraste. Sobre blanco:

| Color | Contraste | Veredicto |
|---|---|---|
| Azul marino `#3c4c69` | **8.64 : 1** | ✅ Excelente para texto |
| Verde `#9fc868` | **1.92 : 1** | ❌ Falla. Mínimo WCAG AA: 4.5:1 |
| Turquesa `#79c5c0` | **1.99 : 1** | ❌ Falla |

Un botón verde `#9fc868` con texto blanco es prácticamente ilegible, y el público de Revital incluye adultos mayores. Por eso el sistema usa **variantes oscurecidas para todo lo interactivo**, y reserva los tonos originales de marca para fondos, ilustración y elementos decorativos, donde funcionan muy bien.

Esto no traiciona la identidad. El logo mantiene sus colores exactos y la marca se reconoce igual.

### 2.3 Tokens completos

```css
:root {
  /* --- Marca, valores exactos del logo --- */
  --rv-navy:            #3c4c69;
  --rv-green:           #9fc868;
  --rv-teal:            #79c5c0;

  /* --- Variantes accesibles para elementos interactivos --- */
  --rv-green-deep:      #4e7523;  /* 5.39:1 sobre blanco */
  --rv-teal-deep:       #2f6560;  /* 6.66:1 sobre blanco */
  --rv-navy-deep:       #2b3850;  /* estados hover y pressed */

  /* --- Superficies --- */
  --rv-surface:         #ffffff;
  --rv-surface-sunken:  #f4f7f9;  /* fondo de página */
  --rv-surface-brand:   #eef6e6;  /* verde 12%, tarjetas destacadas */
  --rv-surface-teal:    #e8f4f3;  /* turquesa 12%, avisos informativos */

  /* --- Texto --- */
  --rv-text:            #3c4c69;  /* el azul de marca ES el color de texto */
  --rv-text-muted:      #5a6675;  /* 5.85:1 */
  --rv-text-inverse:    #ffffff;

  /* --- Líneas --- */
  --rv-border:          #d8dee6;
  --rv-border-strong:   #b4c0cf;
  --rv-focus:           #2f6560;  /* anillo de foco, 3px */

  /* --- Estados --- */
  --rv-success:         #4e7523;
  --rv-warning:         #8a5a00;  /* 5.93:1 */
  --rv-danger:          #b3261e;  /* 6.54:1 */
  --rv-info:            #2f6560;

  --rv-success-bg:      #eef6e6;
  --rv-warning-bg:      #fdf4e3;
  --rv-danger-bg:       #fdeceb;
  --rv-info-bg:         #e8f4f3;
}
```

### 2.4 Estados de la cita

Cada estado del §4.1 de la especificación necesita un color propio. **Nunca solo color**: siempre acompañado de texto o ícono, porque un daltónico no distingue verde de rojo y en una agenda médica eso importa.

```css
--estado-solicitada:   #8a5a00;   /* ámbar: esperando */
--estado-en-gestion:   #8a5a00;
--estado-confirmada:   #4e7523;   /* verde: todo bien */
--estado-atendida:     #2f6560;   /* turquesa: cerrada */
--estado-no-show:      #b3261e;   /* rojo */
--estado-cancelada:    #5a6675;   /* gris: sin drama */
--estado-reprogramada: #3c4c69;
```

---

## 3. Tipografía

**Una sola familia: Inter.** Es gratuita, se lee bien en pantallas pequeñas, y sus números tienen ancho fijo, algo que importa cuando una agenda muestra columnas de horas.

Dos tipografías serían decoración en un producto cuyo trabajo es que alguien no se equivoque de hora.

```css
--rv-font: 'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif;
```

**Numerales tabulares obligatorios** en horas, precios y cédulas:

```css
.tabular { font-variant-numeric: tabular-nums; }
```

Sin esto, "10:20" y "11:40" tienen anchos distintos y la columna de horarios se ve torcida.

### Escala

| Rol | Tamaño | Peso | Interlineado |
|---|---|---|---|
| Título de página | 30 px | 600 | 1.2 |
| Sección | 22 px | 600 | 1.3 |
| Subtítulo | 18 px | 600 | 1.4 |
| Cuerpo | 16 px | 400 | 1.55 |
| Cuerpo grande (web pública) | 18 px | 400 | 1.6 |
| Secundario | 14 px | 400 | 1.5 |
| Mínimo absoluto | 13 px | 500 | 1.4 |

**Nada por debajo de 13 px.** Ni en el panel.

Línea de texto: máximo 70 caracteres.

---

## 4. Forma y espaciado

El logo son formas redondeadas que se abrazan. Los radios lo acompañan sin exagerar.

```css
--rv-radius-sm:  6px;    /* campos, etiquetas */
--rv-radius:     10px;   /* botones, tarjetas */
--rv-radius-lg:  16px;   /* modales, contenedores grandes */
--rv-radius-full: 999px; /* píldoras de estado */
```

Espaciado en múltiplos de 4: `4 8 12 16 24 32 48 64`.

**Sombras casi nulas.** Una sombra suave para modales y menús desplegables, nada más. La jerarquía se construye con espacio y líneas, no con capas flotantes.

```css
--rv-shadow: 0 4px 12px rgba(60, 76, 105, 0.10);
```

---

## 5. Botones

```
Primario     fondo --rv-navy · texto blanco · radius 10px
             hover --rv-navy-deep
             Uso: la acción principal de cada pantalla. Una sola por vista.

Secundario   fondo blanco · borde --rv-border-strong · texto --rv-navy

Confirmar    fondo --rv-green-deep · texto blanco
             Uso exclusivo: confirmar cita, aprobar solicitud, marcar atendida.

Destructivo  fondo blanco · borde --rv-danger · texto --rv-danger
             Cancelar y eliminar nunca son rojo sólido: se ven demasiado
             parecidos al botón principal y se tocan por error.
```

**Altura mínima 48 px en la web pública**, 40 px en el panel. El público incluye adultos mayores usando el celular.

---

## 6. Dos productos, una marca

| | Web pública y bot | Panel |
|---|---|---|
| Densidad | Amplia, mucho aire | Compacta |
| Cuerpo | 18 px | 16 px |
| Botones | 48 px de alto | 40 px |
| Color | Superficies de marca a la vista | Casi todo neutro |
| Objetivo | Que nadie se equivoque | Que se vea mucho de un vistazo |

Es la misma marca, con dos densidades. Un paciente entra tres veces al año; una admisionista pasa ocho horas al día ahí.

---

## 7. Reglas de uso del color

**El acento señala dónde tocar.** Si el color de marca está en todas partes, deja de indicar nada. En una pantalla típica de agendamiento debería haber **un solo elemento con color saturado**: el botón que continúa el flujo.

**El verde y el turquesa van a superficies, no a texto.** Un fondo `#eef6e6` con texto `#3c4c69` encima se ve como Revital y se lee perfecto. Texto verde sobre blanco, no.

**Sin degradados.** El logo es de color plano. Un degradado en la interfaz sería un elemento que la marca no tiene.

**Rojo solo para errores y no-show.** Nunca decorativo. En un contexto médico, el rojo comunica urgencia y hay que reservarlo.

---

## 8. Accesibilidad

Requisitos, no sugerencias:

- Texto normal: contraste mínimo **4.5:1**. Texto de 18px+ o 14px en negrita: **3:1**.
- **Anillo de foco visible de 3px** en `--rv-focus` en todo elemento navegable por teclado. Nunca `outline: none`.
- Área táctil mínima **44 × 44 px**.
- Ningún estado comunicado solo por color.
- `prefers-reduced-motion` respetado.
- Todo campo con `<label>` real, no solo placeholder.
- Errores anunciados con `aria-live`.

### Modo texto grande

Botón visible en la web pública que activa una clase raíz:

```css
.texto-grande { font-size: 118%; }
```

Se guarda en `localStorage`. **No viene activo por defecto** — la interfaz sale con tamaños normales y quien lo necesita lo enciende.

---

## 9. Movimiento

Casi nada. Transiciones de 150 ms en hover y foco, y la aparición de modales y avisos.

**Sin animaciones de entrada al hacer scroll.** Una agenda médica no es una landing page: la información tiene que estar ahí cuando la persona mira, no aparecer cuando el navegador decide.

---

## 10. El logo

- **Formato:** SVG. `[PENDIENTE]` — el proporcionado es PNG. Para la web hace falta el vectorial con fondo transparente.
- **Marca completa** (isotipo + wordmark) en el encabezado de la web pública.
- **Solo el isotipo** (la cruz de cuatro hojas) en el panel, el favicon y espacios reducidos.
- Ancho mínimo del wordmark: 140 px. Por debajo de eso, isotipo solo.
- Área de respeto alrededor: la altura del isotipo dividida entre dos.
- Nunca recolorear, rotar, deformar ni ponerle sombra.
- Sobre fondo oscuro, versión con wordmark en blanco.

---

## 11. Tailwind

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      navy:   { DEFAULT: '#3c4c69', deep: '#2b3850' },
      green:  { DEFAULT: '#9fc868', deep: '#4e7523', surface: '#eef6e6' },
      teal:   { DEFAULT: '#79c5c0', deep: '#2f6560', surface: '#e8f4f3' },
      surface:{ DEFAULT: '#ffffff', sunken: '#f4f7f9' },
      line:   { DEFAULT: '#d8dee6', strong: '#b4c0cf' },
      danger: '#b3261e',
      warning:'#8a5a00',
    },
    fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    borderRadius: { DEFAULT: '10px', lg: '16px', sm: '6px' },
    boxShadow: { DEFAULT: '0 4px 12px rgba(60,76,105,0.10)' },
  }
}
```

---

## 12. Configurable desde el panel

Según §11 de la especificación, el admin puede cambiar sin programador:

- Logo (carga de archivo)
- Color primario, de confirmación y de acento
- Nombre visible del sistema
- Datos de contacto del centro

Los tokens se leen de la tabla `configuracion`, no van fijos en código. **Con validación de contraste al guardar**: si el admin elige un color que falla WCAG AA sobre su fondo, el panel lo advierte antes de aplicarlo.
