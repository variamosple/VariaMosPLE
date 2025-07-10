import * as Y from "yjs";
import { getProjectState, getProjectProvider } from './collaborationService';

/**
 * Servicio para manejar la colaboración de configuraciones en BillOfMaterialsEditor
 * Sincroniza el estado de las configuraciones de productos usando YJS
 */
class ConfigurationsCollaborationService {
  private projectId: string | null = null;
  private configurationsState: Y.Map<any> | null = null;
  private isInitialized: boolean = false;
  private ownOperations: Set<string> = new Set(); // Para trackear operaciones propias
  private lastProcessedTimestamp: number = 0; // Para procesar solo cambios nuevos

  /**
   * Inicializa la sincronización de configuraciones para un proyecto colaborativo
   */
  async initializeConfigurationsSync(projectId: string): Promise<boolean> {
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
        // Intentar inicializar la colaboración base
        try {
          const { setupProjectSync } = await import('./collaborationService');
          await setupProjectSync(projectId);

          // Intentar obtener el estado nuevamente
          const newProjectState = getProjectState(projectId);
          if (!newProjectState) {
            return false;
          }

          // Continuar con el nuevo estado
        } catch (initError) {
          console.error(`Error inicializando colaboración base:`, initError);
          return false;
        }
      }

      // Verificar que el provider esté conectado
      const provider = getProjectProvider(projectId);
      if (!provider) {
        return false;
      }

      this.projectId = projectId;

      // Obtener el estado final (puede ser el original o el recién inicializado)
      const finalProjectState = getProjectState(projectId);
      if (!finalProjectState) {
        return false;
      }

      // Obtener o crear el mapa de configuraciones en YJS
      let configurationsMap = finalProjectState.get('productConfigurations') as Y.Map<any>;

      if (!configurationsMap) {
        configurationsMap = new Y.Map<any>();
        finalProjectState.set('productConfigurations', configurationsMap);
      } 

      // IMPORTANTE: Asegurar que this.configurationsState apunte al mismo mapa que está en projectState
      this.configurationsState = finalProjectState.get('productConfigurations') as Y.Map<any>;

      // Verificar que ambos mapas son el mismo objeto
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error(`Error inicializando sincronización:`, error);
      return false;
    }
  }

  /**
   * Observa cambios en las configuraciones colaborativas
   */
  observeConfigurationsChanges(callback: (changes: any) => void): (() => void) | null {
    if (!this.isInitialized || !this.configurationsState) {
      return null;
    }

    const observer = (event: any) => {
      // Obtener todas las operaciones de configuraciones
      const allOperations = this.configurationsState?.toJSON();
      // Filtrar solo las operaciones nuevas (posteriores al último timestamp procesado)
      const newOperations: any = {};
      let hasNewOperations = false;

      if (allOperations) {
        Object.keys(allOperations).forEach(key => {
          const operation = allOperations[key];
          const isNotCurrentConfigs = key !== 'currentConfigurations';
          const hasType = operation.type;
          const isNotOwnOperation = !this.ownOperations.has(key);
          const isNewTimestamp = (operation.timestamp || 0) > this.lastProcessedTimestamp;

          if (isNotCurrentConfigs && hasType && isNotOwnOperation && isNewTimestamp) {
            newOperations[key] = operation;
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
          type: 'configurations-operations',
          data: newOperations,
          event: event
        });
      } 
    };

    this.configurationsState.observe(observer);

    // Retornar función de cleanup
    return () => {
      this.configurationsState?.unobserve(observer);
    };
  }

  /**
   * Sincroniza una operación de eliminar del modelo base (eliminar funcionalidades)
   */
  syncModelDeletionOperation(deletionData: any): void {

    if (!this.isInitialized || !this.configurationsState) {
      console.log(`[ConfigurationsCollaboration] ⚠️ Configurations collaboration no inicializado, no se puede sincronizar eliminación del modelo`);
      console.log(`[ConfigurationsCollaboration] 🔍 Detalles del error:`, {
        isInitialized: this.isInitialized,
        configurationsState: !!this.configurationsState
      });
      return;
    }

    const operation = {
      type: 'MODEL_DELETED',
      timestamp: Date.now(),
      operationId: `model_del_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      data: deletionData
    };

    // Marcar como operación propia para no procesarla cuando la recibamos
    this.ownOperations.add(operation.operationId);

    // Agregar la operación a YJS usando la misma lógica que otras operaciones
    try {
      // Obtener la referencia fresca del projectState para asegurar consistencia
      const projectState = getProjectState(this.projectId!);
      const freshConfigurationsMap = projectState?.get('productConfigurations') as Y.Map<any>;

      // Usar la referencia fresca para asegurar que estamos escribiendo en el mapa correcto
      const targetMap = freshConfigurationsMap || this.configurationsState;
      if (!targetMap) {
        throw new Error('No se encontró mapa de configuraciones válido para eliminación del modelo');
      }

      targetMap.set(operation.operationId, operation);

      // Verificar que se agregó correctamente
      const verificacionFresh = freshConfigurationsMap?.get(operation.operationId);
      const verificacionStored = this.configurationsState?.get(operation.operationId);

    } catch (error) {
      console.error(`Error agregando operación de eliminación del modelo a YJS:`, error);
    }
  }

  /**
   * Sincroniza una operación de modificar el modelo base (agregar funcionalidades)
   */
  syncModelModificationOperation(modelData: any): void {

    if (!this.isInitialized || !this.configurationsState) {
      console.log(`[ConfigurationsCollaboration] ⚠️ Configurations collaboration no inicializado, no se puede sincronizar modificación del modelo`);
      console.log(`[ConfigurationsCollaboration] 🔍 Detalles del error:`, {
        isInitialized: this.isInitialized,
        configurationsState: !!this.configurationsState
      });
      return;
    }

    const operation = {
      type: 'MODEL_MODIFIED',
      timestamp: Date.now(),
      operationId: `model_mod_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      data: modelData
    };

    // Marcar como operación propia para no procesarla cuando la recibamos
    this.ownOperations.add(operation.operationId);
    // Agregar la operación a YJS usando la misma lógica que otras operaciones
    try {
      // Obtener la referencia fresca del projectState para asegurar consistencia
      const projectState = getProjectState(this.projectId!);
      const freshConfigurationsMap = projectState?.get('productConfigurations') as Y.Map<any>;
      // Usar la referencia fresca para asegurar que estamos escribiendo en el mapa correcto
      const targetMap = freshConfigurationsMap || this.configurationsState;
      if (!targetMap) {
        throw new Error('No se encontró mapa de configuraciones válido para modificación del modelo');
      }

      targetMap.set(operation.operationId, operation);
      console.log(`[ConfigurationsCollaboration] ✅ Operación de modificación del modelo agregada a YJS exitosamente`);

    } catch (error) {
      console.error(`Error agregando operación de modificación del modelo a YJS:`, error);
    }
  }

  /**
   * Sincroniza una operación de editar configuración completa (crear nueva + eliminar anterior)
   */
  syncEditConfigurationOperation(editData: any): void {
  
    if (!this.isInitialized || !this.configurationsState) {
      return;
    }

    // Para edición de configuración, enviamos dos operaciones separadas:
    // 1. CREATE_PRODUCT para la nueva configuración
    // 2. DELETE_CONFIGURATION para la configuración anterior

    const timestamp = Date.now();
    const baseId = `edit_config_${timestamp}_${Math.random().toString(36).substring(2, 11)}`;

    // Operación 1: Crear nueva configuración
    const createOperation = {
      type: 'CREATE_PRODUCT',
      timestamp: timestamp,
      operationId: `${baseId}_create`,
      data: {
        type: 'PRODUCT_CREATED',
        configurationData: editData.newConfigurationData,
        modelId: editData.modelId || 'unknown',
        isPartOfEdit: true,
        editContext: {
          originalConfigurationId: editData.originalConfigurationId,
          editOperationId: baseId
        }
      }
    };

    // Operación 2: Eliminar configuración anterior
    const deleteOperation = {
      type: 'DELETE_CONFIGURATION',
      timestamp: timestamp + 1, // Ligeramente posterior para asegurar orden
      operationId: `${baseId}_delete`,
      data: {
        type: 'CONFIGURATION_DELETED',
        configurationId: editData.originalConfigurationId,
        configurationName: editData.originalConfigurationName,
        isPartOfEdit: true,
        editContext: {
          newConfigurationId: editData.newConfigurationData.id,
          editOperationId: baseId
        }
      }
    };

    try {
      const projectState = getProjectState(this.projectId!);
      const freshConfigurationsMap = projectState?.get('productConfigurations') as Y.Map<any>;
      const targetMap = freshConfigurationsMap || this.configurationsState;

      if (!targetMap) {
        throw new Error('No se encontró mapa de configuraciones válido para edición de configuración');
      }

      // Marcar ambas operaciones como propias
      this.ownOperations.add(createOperation.operationId);
      this.ownOperations.add(deleteOperation.operationId);

      // Agregar ambas operaciones a YJS
      targetMap.set(createOperation.operationId, createOperation);
      targetMap.set(deleteOperation.operationId, deleteOperation);

    } catch (error) {
      console.error(`Error agregando operaciones de edición de configuración a YJS:`, error);
    }
  }

  /**
   * Sincroniza una operación de editar producto/funcionalidad
   */
  syncEditProductOperation(editData: any): void {

    if (!this.isInitialized || !this.configurationsState) {
      return;
    }

    const operation = {
      type: 'EDIT_PRODUCT',
      timestamp: Date.now(),
      operationId: `edit_product_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      data: editData
    };

    // Marcar como operación propia para no procesarla cuando la recibamos
    this.ownOperations.add(operation.operationId);
    // Agregar la operación a YJS usando la misma lógica que otras operaciones
    try {
      // Obtener la referencia fresca del projectState para asegurar consistencia
      const projectState = getProjectState(this.projectId!);
      const freshConfigurationsMap = projectState?.get('productConfigurations') as Y.Map<any>;

      // Usar la referencia fresca para asegurar que estamos escribiendo en el mapa correcto
      const targetMap = freshConfigurationsMap || this.configurationsState;
      if (!targetMap) {
        throw new Error('No se encontró mapa de configuraciones válido para edición');
      }

      targetMap.set(operation.operationId, operation);
      // Verificar que se agregó correctamente
      const verificacionFresh = freshConfigurationsMap?.get(operation.operationId);
      const verificacionStored = this.configurationsState?.get(operation.operationId);

    } catch (error) {
      console.error(`Error agregando operación de edición a YJS:`, error);
    }
  }

  /**
   * Sincroniza una operación de eliminar configuración completa
   */
  syncDeleteConfigurationOperation(deletionData: any): void {

    if (!this.isInitialized || !this.configurationsState) {
      return;
    }

    const operation = {
      type: 'DELETE_CONFIGURATION',
      timestamp: Date.now(),
      operationId: `delete_config_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      data: deletionData
    };

    // Marcar como operación propia para no procesarla cuando la recibamos
    this.ownOperations.add(operation.operationId);
    // Agregar la operación a YJS
    try {
      const projectState = getProjectState(this.projectId!);
      const freshConfigurationsMap = projectState?.get('productConfigurations') as Y.Map<any>;
      const targetMap = freshConfigurationsMap || this.configurationsState;

      if (!targetMap) {
        throw new Error('No se encontró mapa de configuraciones válido para eliminación de configuración');
      }

      targetMap.set(operation.operationId, operation);
    } catch (error) {
      console.error(`[ConfigurationsCollaboration] ❌ Error agregando operación de eliminación de configuración a YJS:`, error);
    }
  }

  /**
   * Sincroniza una operación de eliminar producto/funcionalidad
   */
  syncDeleteProductOperation(deletionData: any): void {
    if (!this.isInitialized || !this.configurationsState) {
      return;
    }

    const operation = {
      type: 'DELETE_PRODUCT',
      timestamp: Date.now(),
      operationId: `delete_product_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      data: deletionData
    };

    // Marcar como operación propia para no procesarla cuando la recibamos
    this.ownOperations.add(operation.operationId);
    // Agregar la operación a YJS usando la misma lógica que CREATE_PRODUCT
    try {
      // Obtener la referencia fresca del projectState para asegurar consistencia
      const projectState = getProjectState(this.projectId!);
      const freshConfigurationsMap = projectState?.get('productConfigurations') as Y.Map<any>;

      // Usar la referencia fresca para asegurar que estamos escribiendo en el mapa correcto
      const targetMap = freshConfigurationsMap || this.configurationsState;
      if (!targetMap) {
        throw new Error('No se encontró mapa de configuraciones válido para eliminación');
      }

      targetMap.set(operation.operationId, operation);

    } catch (error) {
      console.error(`Error agregando operación de eliminación a YJS:`, error);
    }
  }

  /**
   * Sincroniza una operación de crear producto
   */
  syncCreateProductOperation(productData: any): void {

    if (!this.isInitialized || !this.configurationsState) {
      return;
    }

    const operation = {
      type: 'CREATE_PRODUCT',
      timestamp: Date.now(),
      operationId: `create_product_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      data: productData
    };

    // Marcar como operación propia para no procesarla cuando la recibamos
    this.ownOperations.add(operation.operationId);
    // Agregar la operación a YJS
    try {
      // Obtener la referencia fresca del projectState para asegurar consistencia
      const projectState = getProjectState(this.projectId!);
      const freshConfigurationsMap = projectState?.get('productConfigurations') as Y.Map<any>;

      // Usar la referencia fresca para asegurar que estamos escribiendo en el mapa correcto
      const targetMap = freshConfigurationsMap || this.configurationsState;
      if (!targetMap) {
        throw new Error('No se encontró mapa de configuraciones válido');
      }

      targetMap.set(operation.operationId, operation);
      // Verificar que se agregó correctamente en ambos mapas
      const verificacionFresh = freshConfigurationsMap?.get(operation.operationId);
      const verificacionStored = this.configurationsState?.get(operation.operationId);

      // Verificar el estado del proyecto también
      const currentProjectState = getProjectState(this.projectId!);
      if (currentProjectState) {
        const configMap = currentProjectState.get('productConfigurations');
      }

      // Forzar un pequeño delay y verificar nuevamente
      setTimeout(() => {
        const verificacionTardiaStored = this.configurationsState?.get(operation.operationId);
        const verificacionTardiaFresh = getProjectState(this.projectId!)?.get('productConfigurations')?.get(operation.operationId);

        if (!verificacionTardiaStored && !verificacionTardiaFresh) {
        } else if (!verificacionTardiaStored) {
        }
      }, 100);

    } catch (error) {
      console.error(`Error agregando operación a YJS:`, error);
    }
  }

  /**
   * Limpia el estado de colaboración
   */
  cleanup(): void {
    this.projectId = null;
    this.configurationsState = null;
    this.isInitialized = false;
    this.ownOperations.clear();
    this.lastProcessedTimestamp = 0;
  }

  /**
   * Verifica si la colaboración está inicializada
   */
  isCollaborationInitialized(): boolean {
    return this.isInitialized;
  }
}

// Exportar instancia singleton
const configurationsCollaborationService = new ConfigurationsCollaborationService();
export default configurationsCollaborationService;
