<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="Iterum Banner" width="800" />
  <h1>ITERUM</h1>
  <p><strong>Productividad para el 1% que busca la excelencia</strong></p>
</div>

---

## 🚀 Sobre Iterum

Iterum no es solo otra aplicación de lista de tareas. Es un sistema de forja personal diseñado para convertir la intención en disciplina y el progreso en maestría. Inspirado en el estoicismo y la psicología del alto rendimiento, Iterum te ayuda a "ordenar la casa" para luego conquistar tus objetivos más ambiciosos.

## ✨ Características Principales

- **Arquitectura 100% local y offline:** Puedes abrir ITERUM y usarla inmediatamente sin registrarte. Tareas, hábitos, objetivos, diario y progreso quedan guardados en `localStorage`.
- **Persistencia adaptable:** La app ya expone un `IterumStorageAdapter` para poder reemplazar `localStorage` cuando integres ITERUM dentro de un proyecto mayor.
- **Jugo Sensorial (Sensory UX):** La app recompensa cada acción positiva con un motor de feedback propio (sonidos sintetizados vía Web Audio API, animaciones interactivas usando Motion, micro haptics y explosiones de confetti) optimizado para no sumar un solo KB de dependencias innecesarias.
- **Gestión de Hábitos:** Seguimiento cuantitativo y cualitativo de tus rutinas diarias con sistema de rachas (streaks) y recordatorios predictivos.
- **Objetivos y Hitos:** Define metas a largo plazo y divídelas en pasos accionables, acumulando progresión de forma gamificada.
- **Modo Foco:** Interfaz inmersiva para bloquear distracciones durante la ejecución de las tareas críticas.
- **Diario y Cierre de Día:** Espacio para la introspección nocturna guiada.

## 🛠️ Tech Stack & Ingeniería

- **Frontend:** React 19 + TypeScript + Vite 6
- **Animaciones y Estilos:** Tailwind CSS 4 + Lucide Icons + Framer Motion
- **Estado Global:** Zustand (Stores segmentados para hábitos, tareas y objetivos + persistence middleware)
- **Persistencia:** Zustand + `localStorage` mediante un adapter configurable
- **Confiabilidad:** ErrorBoundaries globales, stores rehidratables y API pública de módulo (`IterumModule`, `IterumProvider`, `createLocalStorageAdapter`)
- **DevOps y QA:** ESLint 9 + Prettier + Vitest + Husky

## 💻 Desarrollo Local

### Requisitos
- Node.js (v18+)
- npm / yarn / pnpm

### Pasos
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Juno002/ITERUM.git
   cd ITERUM
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

## 📦 Uso Como Módulo

ITERUM también puede consumirse como feature React embebible:

```tsx
import { IterumModule, IterumProvider } from 'iterum';

export function ProductivityFeature() {
  return (
    <IterumProvider>
      <IterumModule initialView="today" />
    </IterumProvider>
  );
}
```

API pública disponible:

- `IterumModule`
- `IterumProvider`
- `createLocalStorageAdapter`
- `IterumStorageAdapter`

## 🗺️ Roadmap de Evolución

### ✅ Fase 1: Cimientos y Estándares
- Refactorización de componentes monolíticos.
- Implementación de estándares de código.
- Limpieza masiva de dependencias.

### ✅ Fase 2: Persistencia Offline
- Stores locales rehidratables sin cuenta ni backend.
- Adapter de persistencia configurable para integración futura.
- Eliminación de dependencias runtime de cuenta, backend y sincronización remota.

### ✅ Fase 3: Fiabilidad y Resiliencia
- `ErrorBoundary` global para eliminar blank-screens.
- Refactor para shell local simple y portable.
- Interfaz gráfica estandarizada (Toasts) para feedback de producto.
- Setup de `Vitest` con primera batería de unit testing en core utilities.

### ✅ Fase 4: "El Jugo Sensorial" (UX Elevada)
- Desarrollo de API de feedback táctil, auditiva y visual (`feedback.ts`).
- Sonido 100% sintetizado (0 archivos pesados introducidos).
- Confetti renderizado sobre Canvas en celebraciones de rachas o 'Level Ups'.
- Animaciones interactivas ("spring pops" de Motion) respondiendo al swipe/completado.

---

<div align="center">
  <p><i>"Aquel que conquista sus días, conquista su destino."</i></p>
</div>
