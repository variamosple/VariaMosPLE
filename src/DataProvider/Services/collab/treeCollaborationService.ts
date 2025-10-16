import * as Y from "yjs";
import { getProjectState, getProjectProvider } from './collaborationService';

/**
 * Servicio para manejar la colaboración del TreeExplorer
 * Sincroniza el estado del árbol del proyecto usando YJS
 */
class TreeCollaborationService {
  private projectId: string | null = null;
  private treeState: Y.Map<any> | null = null;
  private isInitialized: boolean = false;
  private ownOperations: Set<string> = new Set(); // Para trackear operaciones propias
  private lastProcessedTimestamp: number = 0; // Para procesar solo cambios nuevos
  private readonly MAX_OPERATIONS_HISTORY = 50; // Límite de operaciones históricas
  private cleanupTimer: NodeJS.Timeout | null = null; // Timer para limpieza automática

  /**
   * Inicializa la sincronización del tree para un proyecto colaborativo
   */
  async initializeTreeSync(projectId: string): Promise<boolean> {
    // Si ya está inicializado para el mismo proyecto, no hacer nada
    if (this.isInitialized && this.projectId === projectId) {
      return true;
    }

    // Si está inicializado para otro proyecto, limpiar primero
    if (this.isInitialized && this.projectId !== projectId) {
      this.cleanup();
    }

    try {
      // Verificar que el proyecto tenga estado colaborativo
      const projectState = getProjectState(projectId);
      if (!projectState) {
        return false;
      }

      // Verificar que el provider esté conectado
      const provider = getProjectProvider(projectId);
      if (!provider) {
        return false;
      }

      this.projectId = projectId;

      // Obtener o crear el estado del tree en YJS
      let treeState = projectState.get('treeState') as Y.Map<any>;
      if (!treeState) {
        treeState = new Y.Map<any>();
        projectState.set('treeState', treeState);
      }
      this.treeState = treeState;
      this.isInitialized = true;

      // Iniciar limpieza automática
      this.scheduleAutoCleanup();

      // Log del estado actual

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verifica si existe un estado previo del tree y lo retorna para aplicar
   * Esto es crucial para que nuevos usuarios vean el estado existente
   */
  getExistingTreeState(): any {
    if (!this.isInitialized || !this.treeState) {
      return null;
    }

    const currentState = this.treeState.get('currentState');
    if (currentState && currentState.productLines && currentState.productLines.length > 0) {
      return currentState;
    }

    return null;
  }

  /**
   * Sincroniza el estado actual del proyecto al tree colaborativo
   */
  syncCurrentProjectState(projectService: any): void {
    if (!this.isInitialized || !this.treeState) {
      return;
    }

    try {
      const project = projectService.getProject();
      if (!project) {
        return;
      }

      // Crear snapshot del estado actual del tree
      const treeSnapshot = {
        timestamp: Date.now(),
        productLines: project.productLines?.map((pl: any) => {
          // Recopilar todos los modelos de las diferentes secciones
          const allModels: any[] = [];

          // Modelos de scope
          if (pl.scope?.models) {
            pl.scope.models.forEach((model: any) => {
              allModels.push({
                id: model.id,
                name: model.name,
                type: 'scope',
                languageId: model.languageId,
                languageName: model.type // El nombre del lenguaje está en model.type
              });
            });
          }

          // Modelos de domain engineering
          if (pl.domainEngineering?.models) {
            pl.domainEngineering.models.forEach((model: any) => {
              allModels.push({
                id: model.id,
                name: model.name,
                type: 'domainEngineering',
                languageId: model.languageId,
                languageName: model.type // El nombre del lenguaje está en model.type
              });
            });
          }

          // Modelos de application engineering
          if (pl.applicationEngineering?.models) {
            pl.applicationEngineering.models.forEach((model: any) => {
              allModels.push({
                id: model.id,
                name: model.name,
                type: 'applicationEngineering',
                languageId: model.languageId,
                languageName: model.type // El nombre del lenguaje está en model.type
              });
            });
          }

          return {
            id: pl.id,
            name: pl.name,
            type: pl.type,
            domain: pl.domain,
            applications: pl.applicationEngineering?.applications?.map((app: any) => ({
              id: app.id,
              name: app.name,
              adaptations: app.adaptations?.map((adapt: any) => ({
                id: adapt.id,
                name: adapt.name
              })) || []
            })) || [],
            models: allModels
          };
        }) || []
      };

      // Guardar en YJS
      this.treeState.set('currentState', treeSnapshot);

      // Establecer timestamp inicial para evitar procesar operaciones históricas
      if (this.lastProcessedTimestamp === 0) {
        this.lastProcessedTimestamp = Date.now();
      }

      // Log detallado del estado sincronizado
      const totalModels = treeSnapshot.productLines.reduce((total: number, pl: any) => total + pl.models.length, 0);
      const totalApplications = treeSnapshot.productLines.reduce((total: number, pl: any) => total + pl.applications.length, 0);

    } catch (error) {
      console.error(`Error sincronizando estado:`, error);
    }
  }

  /**
   * Observa cambios en el tree colaborativo
   */
  observeTreeChanges(callback: (changes: any) => void): (() => void) | null {
    if (!this.isInitialized || !this.treeState) {
      return null;
    }


    const observer = (event: any) => {
      // Obtener todas las operaciones del tree
      const allOperations = this.treeState?.toJSON();

      // Filtrar solo las operaciones nuevas (posteriores al último timestamp procesado)
      const newOperations: any = {};
      let hasNewOperations = false;

      if (allOperations) {
        Object.keys(allOperations).forEach(key => {
          if (key !== 'currentState' &&
              allOperations[key].type &&
              !this.ownOperations.has(key) &&
              (allOperations[key].timestamp || 0) > this.lastProcessedTimestamp) {
            newOperations[key] = allOperations[key];
            hasNewOperations = true;
          }
        });
      }

      // Solo procesar si hay operaciones nuevas
      if (hasNewOperations) {
        // Actualizar timestamp de última operación procesada
        const timestamps = Object.values(newOperations).map((op: any) => op.timestamp || 0);
        this.lastProcessedTimestamp = Math.max(...timestamps);

        callback({
          type: 'tree-operations',
          data: newOperations,
          event: event
        });

        // Limpiar operaciones antiguas periódicamente
        this.cleanupOldOperations();
      } 
    };

    this.treeState.observe(observer);

    // Retornar función de cleanup
    return () => {
      this.treeState?.unobserve(observer);
    };
  }

  /**
   * Verifica si la colaboración está inicializada
   */
  isCollaborationActive(): boolean {
    return this.isInitialized && this.treeState !== null;
  }
  
  /**
   * Obtiene información detallada del estado de conexión
   */
  getConnectionStatus(): { connected: boolean, synced: boolean, userCount: number } {
    if (!this.projectId) {
      return { connected: false, synced: false, userCount: 0 };
    }

    try {
      const provider = getProjectProvider(this.projectId);
      const connected = provider?.wsconnected || false;
      const synced = provider?.synced || false;
      const userCount = provider?.awareness?.getStates().size || 0;

      return { connected, synced, userCount };
    } catch (error) {
      return { connected: false, synced: false, userCount: 0 };
    }
  }

  /**
   * Limpia operaciones antiguas para mantener el rendimiento
   */
  private cleanupOldOperations(): void {
    if (!this.treeState) return;

    const allOperations = this.treeState.toJSON();
    const operationKeys = Object.keys(allOperations).filter(key =>
      key !== 'currentState' && allOperations[key].type
    );

    // Si hay más operaciones que el límite, eliminar las más antiguas
    if (operationKeys.length > this.MAX_OPERATIONS_HISTORY) {
      // Ordenar por timestamp (más antiguas primero)
      operationKeys.sort((a, b) =>
        (allOperations[a].timestamp || 0) - (allOperations[b].timestamp || 0)
      );

      // Eliminar las operaciones más antiguas
      const toDelete = operationKeys.slice(0, operationKeys.length - this.MAX_OPERATIONS_HISTORY);
      toDelete.forEach(key => {
        this.treeState?.delete(key);
        this.ownOperations.delete(key); // También limpiar del tracking
      });

    }
  }

   // Programa limpieza automática del tree si no hay actividad
  private scheduleAutoCleanup(): void {
    // Cancelar timer anterior si existe
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
    }

    // Programar limpieza en 10 minutos
    this.cleanupTimer = setTimeout(() => {
      this.cleanupOldOperations();

      // Reprogramar para la próxima limpieza
      this.scheduleAutoCleanup();
    }, 10 * 60 * 1000); // 10 minutos

  }

  /**
   * Limpia la colaboración
   */
  cleanup(): void {
    // Cancelar timer de limpieza automática
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.projectId = null;
    this.treeState = null;
    this.isInitialized = false;
    this.ownOperations.clear();
    this.lastProcessedTimestamp = 0;
  }

  /**
   * Sincroniza una operación de agregar modelo
   */
  syncAddModelOperation(modelData: any, projectService?: any): void {
    if (!this.isInitialized || !this.treeState) {
      return;
    }

    const operation = {
      type: 'ADD_MODEL',
      timestamp: Date.now(),
      operationId: `add_model_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      data: modelData
    };

    // Marcar como operación propia para no procesarla cuando la recibamos
    this.ownOperations.add(operation.operationId);

    // Agregar la operación a YJS
    this.treeState.set(operation.operationId, operation);

    // IMPORTANTE: Actualizar el currentState después de la operación
    if (projectService) {
      this.updateCurrentStateAfterOperation(projectService);
    }
  }

  /**
   * Sincroniza una operación de eliminar modelo
   */
  syncDeleteModelOperation(modelData: any, projectService?: any): void {
    if (!this.isInitialized || !this.treeState) {
      return;
    }

    const operation = {
      type: 'DELETE_MODEL',
      timestamp: Date.now(),
      operationId: `delete_model_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      data: modelData
    };

    // Marcar como operación propia para no procesarla cuando la recibamos
    this.ownOperations.add(operation.operationId);

    // Agregar la operación a YJS
    this.treeState.set(operation.operationId, operation);

    // IMPORTANTE: Actualizar el currentState después de la operación
    if (projectService) {
      this.updateCurrentStateAfterOperation(projectService);
    }
  }

  /**
   * Actualiza el currentState después de una operación para mantener sincronizado el estado
   */
  private updateCurrentStateAfterOperation(projectService: any): void {
    if (!this.isInitialized || !this.treeState) {
      return;
    }

    // Usar la función existente para sincronizar el estado actual
    this.syncCurrentProjectState(projectService);
  }

  /**
   * Sincroniza una operación de editar/renombrar elemento
   */
  syncEditItemOperation(itemData: any): void {
    if (!this.isInitialized || !this.treeState) {
      return;
    }

    const operation = {
      type: 'EDIT_ITEM',
      timestamp: Date.now(),
      operationId: `edit_item_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      data: itemData
    };

    // Marcar como operación propia para no procesarla cuando la recibamos
    this.ownOperations.add(operation.operationId);

    // Agregar la operación a YJS
    this.treeState.set(operation.operationId, operation);
  }

   // Sincroniza una operación de actualizar scope (Technical Metrics)
  syncUpdateScopeOperation(scopeData: any, projectService?: any): void {
    if (!this.isInitialized || !this.treeState) {
      return;
    }

    const operation = {
      type: 'UPDATE_SCOPE',
      timestamp: Date.now(),
      operationId: `update_scope_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      data: scopeData
    };

    // Marcar como operación propia para no procesarla cuando la recibamos
    this.ownOperations.add(operation.operationId);

    // Agregar la operación a YJS
    this.treeState.set(operation.operationId, operation);

    // IMPORTANTE: Actualizar el currentState después de la operación
    if (projectService) {
      this.updateCurrentStateAfterOperation(projectService);
    }
  }
}

// Exportar instancia singleton
export const treeCollaborationService = new TreeCollaborationService();
export default treeCollaborationService;
