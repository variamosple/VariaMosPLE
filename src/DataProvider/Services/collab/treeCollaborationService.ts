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
    console.log(`[TreeCollaboration] 🚀 Inicializando sincronización del tree para proyecto: ${projectId}`);

    // Si ya está inicializado para el mismo proyecto, no hacer nada
    if (this.isInitialized && this.projectId === projectId) {
      console.log(`[TreeCollaboration] ✅ Ya inicializado para proyecto: ${projectId}`);
      return true;
    }

    // Si está inicializado para otro proyecto, limpiar primero
    if (this.isInitialized && this.projectId !== projectId) {
      console.log(`[TreeCollaboration] 🧹 Limpiando colaboración anterior (${this.projectId}) antes de inicializar nueva (${projectId})`);
      this.cleanup();
    }

    try {
      // Verificar que el proyecto tenga estado colaborativo
      const projectState = getProjectState(projectId);
      if (!projectState) {
        console.log(`[TreeCollaboration] ❌ No se encontró estado colaborativo para proyecto: ${projectId}`);
        return false;
      }

      // Verificar que el provider esté conectado
      const provider = getProjectProvider(projectId);
      if (!provider) {
        console.log(`[TreeCollaboration] ❌ No se encontró provider para proyecto: ${projectId}`);
        return false;
      }

      this.projectId = projectId;

      // Obtener o crear el estado del tree en YJS
      let treeState = projectState.get('treeState') as Y.Map<any>;
      if (!treeState) {
        treeState = new Y.Map<any>();
        projectState.set('treeState', treeState);
        console.log(`[TreeCollaboration] ✅ Estado del tree creado en YJS`);
      } else {
        console.log(`[TreeCollaboration] ✅ Estado del tree encontrado en YJS`);
      }

      this.treeState = treeState;
      this.isInitialized = true;

      // Iniciar limpieza automática
      this.scheduleAutoCleanup();

      // Log del estado actual
      console.log(`[TreeCollaboration] 📊 Estado actual del tree:`, this.treeState.toJSON());

      return true;
    } catch (error) {
      console.error(`[TreeCollaboration] ❌ Error inicializando sincronización:`, error);
      return false;
    }
  }

  /**
   * Sincroniza el estado actual del proyecto al tree colaborativo
   */
  syncCurrentProjectState(projectService: any): void {
    if (!this.isInitialized || !this.treeState) {
      console.log(`[TreeCollaboration] ⚠️ Tree collaboration no inicializado`);
      return;
    }

    console.log(`[TreeCollaboration] 🔄 Sincronizando estado actual del proyecto...`);

    try {
      const project = projectService.getProject();
      if (!project) {
        console.log(`[TreeCollaboration] ⚠️ No hay proyecto para sincronizar`);
        return;
      }

      // Crear snapshot del estado actual del tree
      const treeSnapshot = {
        timestamp: Date.now(),
        productLines: project.productLines?.map((pl: any) => ({
          id: pl.id,
          name: pl.name,
          type: pl.type,
          domain: pl.domain,
          applications: pl.applications?.map((app: any) => ({
            id: app.id,
            name: app.name,
            adaptations: app.adaptations?.map((adapt: any) => ({
              id: adapt.id,
              name: adapt.name
            })) || []
          })) || [],
          models: pl.models?.map((model: any) => ({
            id: model.id,
            name: model.name,
            type: model.type,
            languageId: model.languageId
          })) || []
        })) || []
      };

      // Guardar en YJS
      this.treeState.set('currentState', treeSnapshot);

      // Establecer timestamp inicial para evitar procesar operaciones históricas
      if (this.lastProcessedTimestamp === 0) {
        this.lastProcessedTimestamp = Date.now();
        console.log(`[TreeCollaboration] ⏰ Timestamp inicial establecido para evitar historial: ${this.lastProcessedTimestamp}`);
      }

      console.log(`[TreeCollaboration] ✅ Estado del proyecto sincronizado:`, {
        productLinesCount: treeSnapshot.productLines.length,
        timestamp: new Date(treeSnapshot.timestamp).toISOString()
      });

    } catch (error) {
      console.error(`[TreeCollaboration] ❌ Error sincronizando estado:`, error);
    }
  }

  /**
   * Observa cambios en el tree colaborativo
   */
  observeTreeChanges(callback: (changes: any) => void): (() => void) | null {
    if (!this.isInitialized || !this.treeState) {
      console.log(`[TreeCollaboration] ⚠️ Tree collaboration no inicializado para observar cambios`);
      return null;
    }

    console.log(`[TreeCollaboration] 👀 Iniciando observación de cambios en el tree`);

    const observer = (event: any) => {
      console.log(`[TreeCollaboration] 🔔 Cambio detectado en el tree:`, event);

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

        console.log(`[TreeCollaboration] 📥 Procesando ${Object.keys(newOperations).length} operaciones nuevas`);

        callback({
          type: 'tree-operations',
          data: newOperations,
          event: event
        });

        // Limpiar operaciones antiguas periódicamente
        this.cleanupOldOperations();
      } else {
        console.log(`[TreeCollaboration] ⏭️ No hay operaciones nuevas para procesar`);
      }
    };

    this.treeState.observe(observer);

    // Retornar función de cleanup
    return () => {
      console.log(`[TreeCollaboration] 🛑 Deteniendo observación de cambios en el tree`);
      this.treeState?.unobserve(observer);
    };
  }

  /**
   * Obtiene el estado actual del tree desde YJS
   */
  getCurrentTreeState(): any {
    if (!this.isInitialized || !this.treeState) {
      return null;
    }

    return this.treeState.get('currentState');
  }

  /**
   * Verifica si la colaboración está inicializada
   */
  isCollaborationActive(): boolean {
    return this.isInitialized && this.treeState !== null;
  }

  /**
   * Verifica si la conexión WebSocket está activa
   */
  isWebSocketConnected(): boolean {
    if (!this.projectId) return false;

    try {
      const provider = getProjectProvider(this.projectId);
      return provider?.wsconnected || false;
    } catch (error) {
      console.error(`[TreeCollaboration] Error verificando conexión WebSocket:`, error);
      return false;
    }
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
      console.error(`[TreeCollaboration] Error obteniendo estado de conexión:`, error);
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

      console.log(`[TreeCollaboration] 🧹 Eliminadas ${toDelete.length} operaciones antiguas`);
    }
  }

  /**
   * Programa limpieza automática del tree si no hay actividad
   */
  private scheduleAutoCleanup(): void {
    // Cancelar timer anterior si existe
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
    }

    // Programar limpieza en 10 minutos
    this.cleanupTimer = setTimeout(() => {
      console.log(`[TreeCollaboration] 🧹 Ejecutando limpieza automática por inactividad`);
      this.cleanupOldOperations();

      // Reprogramar para la próxima limpieza
      this.scheduleAutoCleanup();
    }, 10 * 60 * 1000); // 10 minutos

    console.log(`[TreeCollaboration] ⏰ Limpieza automática programada en 10 minutos`);
  }

  /**
   * Limpia la colaboración
   */
  cleanup(): void {
    console.log(`[TreeCollaboration] 🧹 Limpiando colaboración del tree`);

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
  syncAddModelOperation(modelData: any): void {
    if (!this.isInitialized || !this.treeState) {
      console.log(`[TreeCollaboration] ⚠️ Tree collaboration no inicializado, no se puede sincronizar operación`);
      return;
    }

    const operation = {
      type: 'ADD_MODEL',
      timestamp: Date.now(),
      operationId: `add_model_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      data: modelData
    };

    console.log(`[TreeCollaboration] 📤 Sincronizando operación ADD_MODEL:`, operation);

    // Marcar como operación propia para no procesarla cuando la recibamos
    this.ownOperations.add(operation.operationId);

    // Agregar la operación a YJS
    this.treeState.set(operation.operationId, operation);
  }

  /**
   * Sincroniza una operación de eliminar modelo
   */
  syncDeleteModelOperation(modelData: any): void {
    if (!this.isInitialized || !this.treeState) {
      console.log(`[TreeCollaboration] ⚠️ Tree collaboration no inicializado, no se puede sincronizar operación`);
      return;
    }

    const operation = {
      type: 'DELETE_MODEL',
      timestamp: Date.now(),
      operationId: `delete_model_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      data: modelData
    };

    console.log(`[TreeCollaboration] 📤 Sincronizando operación DELETE_MODEL:`, operation);

    // Marcar como operación propia para no procesarla cuando la recibamos
    this.ownOperations.add(operation.operationId);

    // Agregar la operación a YJS
    this.treeState.set(operation.operationId, operation);
  }

  /**
   * Sincroniza una operación de editar/renombrar elemento
   */
  syncEditItemOperation(itemData: any): void {
    if (!this.isInitialized || !this.treeState) {
      console.log(`[TreeCollaboration] ⚠️ Tree collaboration no inicializado, no se puede sincronizar operación`);
      return;
    }

    const operation = {
      type: 'EDIT_ITEM',
      timestamp: Date.now(),
      operationId: `edit_item_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      data: itemData
    };

    console.log(`[TreeCollaboration] 📤 Sincronizando operación EDIT_ITEM:`, operation);

    // Marcar como operación propia para no procesarla cuando la recibamos
    this.ownOperations.add(operation.operationId);

    // Agregar la operación a YJS
    this.treeState.set(operation.operationId, operation);
  }

  /**
   * Log del estado actual para debugging
   */
  logCurrentState(): void {
    if (!this.isInitialized || !this.treeState) {
      console.log(`[TreeCollaboration] ⚠️ No hay estado para mostrar`);
      return;
    }

    const state = this.getCurrentTreeState();
    console.log(`[TreeCollaboration] 📊 Estado actual del tree:`, state);
  }
}

// Exportar instancia singleton
export const treeCollaborationService = new TreeCollaborationService();
export default treeCollaborationService;
