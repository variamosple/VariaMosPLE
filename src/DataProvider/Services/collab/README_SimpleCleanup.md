# Sistema Simple de Limpieza Automática YJS

Sistema básico y directo para limpiar automáticamente la memoria del sistema colaborativo cuando no hay usuarios conectados.

## 🎯 Funcionalidad Principal

**Si no hay usuarios en un proyecto durante 10 minutos, se limpia automáticamente el proyecto y sus modelos.**

## 🔧 Qué se implementó

### 1. Limpieza automática de proyectos (`collaborationService.ts`)
- **Detección de usuarios**: Monitorea cuántos usuarios están conectados a cada proyecto
- **Timer de 10 minutos**: Cuando no hay usuarios (userCount = 0), programa limpieza en 10 minutos
- **Limpieza automática**: Elimina el documento YJS, desconecta WebSocket y libera memoria
- **Cancelación inteligente**: Si llegan usuarios antes de los 10 minutos, cancela la limpieza

### 2. Limpieza automática de awareness (`collaborationAwarenessService.ts`)
- **Timer de 5 minutos**: Cada awareness se limpia automáticamente después de 5 minutos sin actividad
- **Actividad detectada**: Cualquier acción (cursor, edición) reinicia el timer
- **Limpieza automática**: Elimina awareness maps inactivos

### 3. Limpieza automática del tree (`treeCollaborationService.ts`)
- **Limpieza periódica**: Cada 10 minutos limpia operaciones históricas antiguas
- **Límite de operaciones**: Mantiene máximo 50 operaciones históricas
- **Timer automático**: Se programa automáticamente al inicializar

## 📝 Uso Básico

### Limpieza automática al cerrar la aplicación

```typescript
// En App.tsx o componente principal
import { cleanupCollaborativeSystem } from './DataProvider/Services/collab/simpleMemoryCleanup';

function App() {
  useEffect(() => {
    return () => {
      // Limpiar todo al cerrar la aplicación
      cleanupCollaborativeSystem();
    };
  }, []);

  return <div>Tu aplicación</div>;
}
```

### Ver estadísticas (opcional)

```typescript
import { logCurrentStats } from './DataProvider/Services/collab/simpleMemoryCleanup';

// En cualquier momento para ver el estado
logCurrentStats();
// Output: [SimpleCleanup] 📊 Estadísticas actuales: { projects: 2, awareness: 3, ... }
```

### Forzar limpieza manual (opcional)

```typescript
import { forceCleanupSpecificProject } from './DataProvider/Services/collab/simpleMemoryCleanup';

// Limpiar un proyecto específico inmediatamente
forceCleanupSpecificProject('project-123');
```

## 🔄 Cómo Funciona

### Flujo de Limpieza de Proyectos

1. **Usuario se conecta** → `userCount++` → Cancela timer de limpieza
2. **Usuario se desconecta** → `userCount--` → Si llega a 0, programa limpieza en 10 min
3. **10 minutos sin usuarios** → Limpia proyecto automáticamente
4. **Nuevo usuario antes de 10 min** → Cancela limpieza programada

### Flujo de Limpieza de Awareness

1. **Actividad de usuario** (cursor, edición) → Reinicia timer de 5 minutos
2. **5 minutos sin actividad** → Limpia awareness automáticamente
3. **Nueva actividad** → Crea nuevo awareness si es necesario

### Flujo de Limpieza del Tree

1. **Inicialización** → Programa limpieza cada 10 minutos
2. **Cada 10 minutos** → Limpia operaciones históricas antiguas (mantiene últimas 50)
3. **Al cerrar** → Cancela timer automáticamente

## 📊 Logs del Sistema

El sistema genera logs claros para monitoreo:

```
[AutoCleanup] 👥 No hay usuarios en proyecto project-123, programando limpieza...
[AutoCleanup] ⏰ Limpieza programada para proyecto project-123 en 10 minutos
[AutoCleanup] 🧹 Limpiando proyecto project-123 por inactividad
[AwarenessCleanup] 🧹 Limpiando awareness inactivo: project-123:model-456
[TreeCollaboration] 🧹 Eliminadas 25 operaciones antiguas
```

## ⚙️ Configuración

Los timeouts están definidos como constantes simples:

```typescript
// collaborationService.ts
const CLEANUP_TIMEOUT = 10 * 60 * 1000; // 10 minutos para proyectos

// collaborationAwarenessService.ts  
const AWARENESS_CLEANUP_TIMEOUT = 5 * 60 * 1000; // 5 minutos para awareness

// treeCollaborationService.ts
private readonly MAX_OPERATIONS_HISTORY = 50; // Máximo operaciones históricas
```

Para cambiar los tiempos, simplemente modifica estas constantes.

## 🚨 Importante

- **Automático**: Todo funciona automáticamente, no necesitas hacer nada especial
- **Seguro**: Solo limpia cuando realmente no hay usuarios conectados
- **Eficiente**: No bloquea la UI, todo se ejecuta en background
- **Conservador**: Usa períodos de gracia para evitar limpiezas prematuras
- **Reversible**: Si llegan usuarios, cancela las limpiezas programadas

## 🔍 Debugging

Para ver qué está pasando, busca en la consola logs con estos prefijos:
- `[AutoCleanup]` - Limpieza de proyectos
- `[AwarenessCleanup]` - Limpieza de awareness  
- `[TreeCollaboration]` - Limpieza del tree
- `[SimpleCleanup]` - Funciones de utilidad

¡Eso es todo! El sistema funciona automáticamente en background. 🎉
