import { getProjectProvider } from './collaborationService';

interface CatalogUserAction {
  type: 'viewing' | 'editing' | 'idle';
  productId?: string;
  productName?: string;
  timestamp: string;
}

interface CatalogUserAwareness {
  name: string;
  color: string;
  action?: CatalogUserAction;
  modelId: string;
}

/**
 * Servicio de awareness específico para el catálogo de productos
 */
class CatalogAwarenessService {
  private currentProjectId: string | null = null;
  private currentModelId: string | null = null;
  private currentUser: { name: string; color: string } | null = null;

  /**
   * Inicializa el awareness para el catálogo de productos
   */
  initializeCatalogAwareness(
    projectId: string, 
    modelId: string, 
    user: { name: string; color: string }
  ): void {
    console.log(`[CatalogAwareness] 🚀 Inicializando awareness para catálogo:`, { projectId, modelId, user });
    
    this.currentProjectId = projectId;
    this.currentModelId = modelId;
    this.currentUser = user;

    const provider = getProjectProvider(projectId);
    if (provider && provider.awareness) {
      // Establecer estado inicial del usuario
      provider.awareness.setLocalStateField("user", {
        name: user.name,
        color: user.color,
        action: {
          type: 'idle',
          timestamp: new Date().toISOString()
        },
        modelId: modelId
      });

    } 
  }

  /**
   * Actualiza la acción del usuario cuando está editando un producto
   */
  setUserEditingProduct(productId: string, productName: string): void {
    if (!this.currentProjectId || !this.currentModelId || !this.currentUser) {
      console.warn(`[CatalogAwareness] ⚠️ Awareness no inicializado`);
      return;
    }

    const provider = getProjectProvider(this.currentProjectId);
    if (provider && provider.awareness) {
      const current = provider.awareness.getLocalState();
      if (current?.user) {
        provider.awareness.setLocalStateField("user", {
          ...current.user,
          action: {
            type: 'editing',
            productId,
            productName,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  }

  /**
   * Actualiza la acción del usuario cuando deja de hacer hover
   */
  setUserIdle(): void {
    if (!this.currentProjectId || !this.currentModelId || !this.currentUser) {
      return;
    }

    const provider = getProjectProvider(this.currentProjectId);
    if (provider && provider.awareness) {
      const current = provider.awareness.getLocalState();
      if (current?.user) {
        provider.awareness.setLocalStateField("user", {
          ...current.user,
          action: {
            type: 'idle',
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  }

  /**
   * Actualiza la acción del usuario cuando está viendo un producto específico
   */
  setUserViewingProduct(productId: string, productName: string): void {
    if (!this.currentProjectId || !this.currentModelId || !this.currentUser) {
      return;
    }

    const provider = getProjectProvider(this.currentProjectId);
    if (provider && provider.awareness) {
      const current = provider.awareness.getLocalState();
      if (current?.user) {
        provider.awareness.setLocalStateField("user", {
          ...current.user,
          action: {
            type: 'viewing',
            productId,
            productName,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  }

  /**
   * Observa cambios en el awareness de otros usuarios
   */
  observeCatalogAwareness(callback: (users: CatalogUserAwareness[]) => void): (() => void) | null {
    if (!this.currentProjectId || !this.currentModelId) {
      console.warn(`No se puede observar awareness sin inicializar`);
      return null;
    }

    const provider = getProjectProvider(this.currentProjectId);
    if (!provider || !provider.awareness) {
      console.warn(`No se pudo obtener provider para observar awareness`);
      return null;
    }

    const handler = () => {
      const awarenessStates = provider.awareness.getStates();
      const currentUserId = this.currentUser?.name;

      const users: CatalogUserAwareness[] = Array.from(awarenessStates.entries())
        .map(([clientId, state]: [number, any]) => {
          if (!state.user || !state.user.name) return null;
          
          // Filtrar el usuario actual
          if (state.user.name === currentUserId) return null;
          
          // Solo incluir usuarios que están en el mismo modelo
          if (state.user.modelId !== this.currentModelId) return null;

          return {
            name: state.user.name,
            color: state.user.color || '#6c757d',
            action: state.user.action,
            modelId: state.user.modelId
          };
        })
        .filter(user => user !== null) as CatalogUserAwareness[];

      callback(users);
    };

    provider.awareness.on("change", handler);
    
    // Llamar inmediatamente para obtener el estado actual
    handler();

    // Retornar función de limpieza
    return () => {
      provider.awareness.off("change", handler);
    };
  }

  /**
   * Limpia el awareness cuando se cierra el catálogo
   */
  cleanup(): void {
    if (this.currentProjectId && this.currentUser) {
      const provider = getProjectProvider(this.currentProjectId);
      if (provider && provider.awareness) {
        // Establecer como idle antes de limpiar
        this.setUserIdle();
      }
    }

    this.currentProjectId = null;
    this.currentModelId = null;
    this.currentUser = null;
  }

  /**
   * Obtiene el estado actual del awareness
   */
  getCurrentAwarenessState(): CatalogUserAwareness[] {
    if (!this.currentProjectId || !this.currentModelId) {
      return [];
    }

    const provider = getProjectProvider(this.currentProjectId);
    if (!provider || !provider.awareness) {
      return [];
    }

    const awarenessStates = provider.awareness.getStates();
    const currentUserId = this.currentUser?.name;

    return Array.from(awarenessStates.entries())
      .map(([clientId, state]: [number, any]) => {
        if (!state.user || !state.user.name) return null;
        
        // Filtrar el usuario actual
        if (state.user.name === currentUserId) return null;
        
        // Solo incluir usuarios que están en el mismo modelo
        if (state.user.modelId !== this.currentModelId) return null;

        return {
          name: state.user.name,
          color: state.user.color || '#6c757d',
          action: state.user.action,
          modelId: state.user.modelId
        };
      })
      .filter(user => user !== null) as CatalogUserAwareness[];
  }
}

// Instancia singleton
const catalogAwarenessService = new CatalogAwarenessService();

export default catalogAwarenessService;
export type { CatalogUserAction, CatalogUserAwareness };
