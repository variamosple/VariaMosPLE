/**
 * Sistema simple de limpieza automática de memoria para YJS
 * 
 * Este archivo proporciona funciones simples para gestionar la memoria
 * del sistema colaborativo sin complejidad adicional.
 */

import { 
  cleanupAllProjects, 
  getProjectStats, 
  forceCleanupProject,
  updateProjectUserCount 
} from './collaborationService';

import { 
  cleanupAllAwareness, 
  getAwarenessStats 
} from './collaborationAwarenessService';

/**
 * Limpia completamente todo el sistema colaborativo
 * Útil para llamar al cerrar la aplicación
 */
export const cleanupCollaborativeSystem = (): void => {
  console.log(`[SimpleCleanup] 🧹 Limpiando sistema colaborativo completo...`);
  
  cleanupAllProjects();
  cleanupAllAwareness();
  
  console.log(`[SimpleCleanup] ✅ Sistema colaborativo limpiado completamente`);
};

/**
 * Obtiene estadísticas simples del sistema
 */
export const getSimpleStats = () => {
  const projectStats = getProjectStats();
  const awarenessStats = getAwarenessStats();
  
  return {
    projects: projectStats.totalProjects,
    awareness: awarenessStats.totalAwareness,
    scheduledCleanups: awarenessStats.scheduledCleanups,
    details: projectStats.projects
  };
};

/**
 * Fuerza la limpieza de un proyecto específico
 */
export const forceCleanupSpecificProject = (projectId: string): void => {
  console.log(`[SimpleCleanup] 🧹 Forzando limpieza del proyecto: ${projectId}`);
  forceCleanupProject(projectId);
};

/**
 * Actualiza manualmente el conteo de usuarios de un proyecto
 * Útil cuando se detecta cambio de usuarios desde otros componentes
 */
export const updateUsersInProject = (projectId: string, userCount: number): void => {
  console.log(`[SimpleCleanup] 👥 Actualizando usuarios en proyecto ${projectId}: ${userCount}`);
  updateProjectUserCount(projectId, userCount);
};

/**
 * Hook simple para React que limpia al desmontar
 */
export const useSimpleCleanup = () => {
  // Para usar en useEffect cleanup
  return cleanupCollaborativeSystem;
};

/**
 * Función para mostrar estadísticas en consola (útil para debugging)
 */
export const logCurrentStats = (): void => {
  const stats = getSimpleStats();
  console.log(`[SimpleCleanup] 📊 Estadísticas actuales:`, stats);
};

// Ejemplo de uso:
/*
// En tu componente principal (App.tsx):
import { cleanupCollaborativeSystem, logCurrentStats } from './DataProvider/Services/collab/simpleMemoryCleanup';

function App() {
  useEffect(() => {
    // Opcional: log estadísticas cada 5 minutos
    const interval = setInterval(logCurrentStats, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      // Limpiar todo al cerrar la aplicación
      cleanupCollaborativeSystem();
    };
  }, []);

  return <div>Tu aplicación</div>;
}

// Para forzar limpieza manual:
import { forceCleanupSpecificProject, updateUsersInProject } from './DataProvider/Services/collab/simpleMemoryCleanup';

// Limpiar proyecto específico
forceCleanupSpecificProject('project-123');

// Actualizar conteo de usuarios manualmente
updateUsersInProject('project-123', 0); // Esto activará la limpieza automática en 10 minutos
*/
