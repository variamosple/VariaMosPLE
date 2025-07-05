import React, { Component } from 'react';
import ProjectService from '../../../Application/Project/ProjectService';
import { getProjectProvider } from '../../../DataProvider/Services/collab/collaborationService';
import './ProjectAwareness.css';

interface Props {
  projectService: ProjectService;
}

interface State {
  connectedUsers: Array<{
    id: string;
    name: string;
    color: string;
    lastActivity: string;
    currentModel?: string;
    currentModelName?: string;
    isInSpecificModel: boolean;
  }>;
  isCollaborative: boolean;
  isConnected: boolean;
  totalUsers: number;
  usersInModels: number;
  isExpanded: boolean;
}

class ProjectAwareness extends Component<Props, State> {
  private awarenessInterval: NodeJS.Timeout | null = null;
  private currentProjectId: string | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      connectedUsers: [],
      isCollaborative: false,
      isConnected: false,
      totalUsers: 0,
      usersInModels: 0,
      isExpanded: false,
    };
  }

  componentDidMount() {
    console.log('[ProjectAwareness] 🚀 ComponentDidMount - Inicializando...');
    this.updateProjectInfo();
    this.props.projectService.addUpdateProjectListener(this.handleProjectChange.bind(this));
  }

  componentWillUnmount() {
    this.cleanup();
  }

  cleanup = () => {
    if (this.awarenessInterval) {
      clearInterval(this.awarenessInterval);
      this.awarenessInterval = null;
    }
  };

  handleProjectChange = (e: any) => {
    console.log('[ProjectAwareness] 🔄 handleProjectChange triggered');
    this.updateProjectInfo();
  };

  updateProjectInfo = () => {
    const projectInfo = this.props.projectService.getProjectInformation();
    const newProjectId = projectInfo?.project?.id || null;

    // Si cambió el proyecto, limpiar y reinicializar
    if (newProjectId !== this.currentProjectId) {
      this.cleanup();
      this.currentProjectId = newProjectId;

      if (projectInfo?.is_collaborative && newProjectId) {
        console.log('[ProjectAwareness] Inicializando proyecto colaborativo:', newProjectId);
        this.setState({
          isCollaborative: true,
          isConnected: false,
          connectedUsers: []
        });
        // Agregar un delay inicial para asegurar que el sistema de colaboración esté listo
        setTimeout(() => {
          this.startAwarenessMonitoring(newProjectId);
        }, 1000);
      } else {
        this.setState({
          isCollaborative: false,
          isConnected: false,
          connectedUsers: []
        });
      }
    }
  };

  startAwarenessMonitoring = (projectId: string) => {
    // Verificar cada 2 segundos el estado de awareness
    this.awarenessInterval = setInterval(() => {
      this.updateAwarenessState(projectId);
    }, 2000);

    // Actualizar inmediatamente
    this.updateAwarenessState(projectId);
  };

  updateAwarenessState = (projectId: string) => {
    try {
      const provider = getProjectProvider(projectId);
      if (!provider || !provider.awareness) {
        this.setState({
          isConnected: false,
          connectedUsers: []
        });
        return;
      }

      const isConnected = provider.wsconnected || false;
      const awarenessStates = provider.awareness.getStates();
      const currentUserId = this.props.projectService.getUser();

      const connectedUsers = Array.from(awarenessStates.entries())
        .map(([clientId, state]: [number, any]) => {
          if (!state.user) return null;

          // Buscar el colaborador correspondiente
          const projectInfo = this.props.projectService.getProjectInformation();
          const collaborator = projectInfo?.collaborators?.find(
            (c: any) => c.name === state.user.name
          );

          // Filtrar el usuario actual
          if (collaborator && collaborator.id !== currentUserId) {
            const currentModelId = state.user.modelId || null;
            const isInSpecificModel = currentModelId && currentModelId !== 'none';

            // Obtener el nombre del modelo si está en uno específico
            let currentModelName = null;
            if (isInSpecificModel && currentModelId) {
              const project = this.props.projectService.getProject();
              const model = this.props.projectService.findModelById(project, currentModelId);
              currentModelName = model?.name || `Model ${currentModelId.substring(0, 8)}...`;
            }

            return {
              id: collaborator.id,
              name: state.user.name,
              color: state.user.color || '#6c757d',
              lastActivity: state.user.action?.timestamp || new Date().toISOString(),
              currentModel: currentModelId,
              currentModelName: currentModelName,
              isInSpecificModel: isInSpecificModel
            };
          }
          return null;
        })
        .filter(user => user !== null) as Array<{
          id: string;
          name: string;
          color: string;
          lastActivity: string;
          currentModel?: string;
          currentModelName?: string;
          isInSpecificModel: boolean;
        }>;

      const totalUsers = connectedUsers.length;
      const usersInModels = connectedUsers.filter(user => user.isInSpecificModel).length;

      this.setState({
        isConnected,
        connectedUsers,
        totalUsers,
        usersInModels
      });

    } catch (error) {
      console.error('[ProjectAwareness] Error updating awareness state:', error);
      this.setState({
        isConnected: false,
        connectedUsers: []
      });
    }
  };

  formatLastActivity = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);

      if (diffSeconds < 30) {
        return 'now';
      } else if (diffSeconds < 60) {
        return `${diffSeconds}s ago`;
      } else if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
      } else {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch {
      return 'unknown';
    }
  };

  toggleExpanded = () => {
    this.setState(prevState => ({
      isExpanded: !prevState.isExpanded
    }));
  };

  openUserModel = (user: any) => {
    if (!user.isInSpecificModel || !user.currentModel) {
      console.log(`[ProjectAwareness] ⚠️ Usuario ${user.name} no está en un modelo específico`);
      return;
    }

    console.log(`[ProjectAwareness] 🚀 Abriendo modelo de ${user.name}: ${user.currentModelName} (ID: ${user.currentModel})`);

    try {
      // Buscar el modelo en el proyecto y determinar su ubicación
      const project = this.props.projectService.getProject();
      const modelLocation = this.findModelLocation(project, user.currentModel);

      if (modelLocation) {
        // Usar el método apropiado según el tipo de modelo
        switch (modelLocation.type) {
          case 'scope':
            this.props.projectService.modelScopeSelected(modelLocation.plIndex, modelLocation.modelIndex);
            break;
          case 'domainEngineering':
            this.props.projectService.modelDomainSelected(modelLocation.plIndex, modelLocation.modelIndex);
            break;
          case 'applicationEngineering':
            this.props.projectService.modelApplicationEngSelected(modelLocation.plIndex, modelLocation.modelIndex);
            break;
          case 'application':
            this.props.projectService.modelApplicationSelected(
              modelLocation.plIndex,
              modelLocation.appIndex!,
              modelLocation.modelIndex
            );
            break;
          case 'adaptation':
            this.props.projectService.modelAdaptationSelected(
              modelLocation.plIndex,
              modelLocation.appIndex!,
              modelLocation.adaptIndex!,
              modelLocation.modelIndex
            );
            break;
          default:
            console.log(`[ProjectAwareness] ❌ Tipo de modelo no soportado: ${modelLocation.type}`);
            return;
        }

        this.props.projectService.saveProject();
        console.log(`[ProjectAwareness] ✅ Modelo abierto exitosamente: ${user.currentModelName}`);
      } else {
        console.log(`[ProjectAwareness] ❌ No se encontró el modelo: ${user.currentModel}`);
        alert(`Model "${user.currentModelName}" not found in the project.`);
      }
    } catch (error) {
      console.error(`[ProjectAwareness] ❌ Error abriendo modelo:`, error);
      alert(`Error opening model "${user.currentModelName}"`);
    }
  };

  // Función auxiliar para encontrar la ubicación exacta de un modelo
  findModelLocation = (project: any, modelId: string) => {
    for (let plIndex = 0; plIndex < project.productLines.length; plIndex++) {
      const productLine = project.productLines[plIndex];

      // Buscar en scope
      if (productLine.scope?.models) {
        for (let modelIndex = 0; modelIndex < productLine.scope.models.length; modelIndex++) {
          if (productLine.scope.models[modelIndex].id === modelId) {
            return { type: 'scope', plIndex, modelIndex };
          }
        }
      }

      // Buscar en domainEngineering
      if (productLine.domainEngineering?.models) {
        for (let modelIndex = 0; modelIndex < productLine.domainEngineering.models.length; modelIndex++) {
          if (productLine.domainEngineering.models[modelIndex].id === modelId) {
            return { type: 'domainEngineering', plIndex, modelIndex };
          }
        }
      }

      // Buscar en applicationEngineering
      if (productLine.applicationEngineering?.models) {
        for (let modelIndex = 0; modelIndex < productLine.applicationEngineering.models.length; modelIndex++) {
          if (productLine.applicationEngineering.models[modelIndex].id === modelId) {
            return { type: 'applicationEngineering', plIndex, modelIndex };
          }
        }
      }

      // Buscar en applications
      if (productLine.applicationEngineering?.applications) {
        for (let appIndex = 0; appIndex < productLine.applicationEngineering.applications.length; appIndex++) {
          const application = productLine.applicationEngineering.applications[appIndex];

          if (application.models) {
            for (let modelIndex = 0; modelIndex < application.models.length; modelIndex++) {
              if (application.models[modelIndex].id === modelId) {
                return { type: 'application', plIndex, appIndex, modelIndex };
              }
            }
          }

          // Buscar en adaptations
          if (application.adaptations) {
            for (let adaptIndex = 0; adaptIndex < application.adaptations.length; adaptIndex++) {
              const adaptation = application.adaptations[adaptIndex];

              if (adaptation.models) {
                for (let modelIndex = 0; modelIndex < adaptation.models.length; modelIndex++) {
                  if (adaptation.models[modelIndex].id === modelId) {
                    return { type: 'adaptation', plIndex, appIndex, adaptIndex, modelIndex };
                  }
                }
              }
            }
          }
        }
      }
    }

    return null;
  };

  renderExpandedView = () => {
    const { connectedUsers } = this.state;

    return (
      <div className="awareness-expanded">
        <div className="expanded-header">
          <h4>👥 Collaborators Activity</h4>
          <button className="close-btn" onClick={this.toggleExpanded}>✕</button>
        </div>

        <div className="users-table">
          <div className="table-header">
            <div className="col-user">User</div>
            <div className="col-status">Status</div>
            <div className="col-model">Current Model</div>
            <div className="col-activity">Last Activity</div>
          </div>

          {connectedUsers.map((user) => (
            <div key={user.id} className="table-row">
              <div className="col-user">
                <div className="user-cell">
                  <div
                    className="user-avatar-small"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="user-name-text">{user.name}</span>
                </div>
              </div>

              <div className="col-status">
                <span className={`status-badge ${user.isInSpecificModel ? 'working' : 'browsing'}`}>
                  {user.isInSpecificModel ? '📝 Working' : '🏠 Browsing'}
                </span>
              </div>

              <div className="col-model">
                {user.isInSpecificModel ? (
                  <span className="model-name" title={user.currentModelName}>
                    {user.currentModelName}
                  </span>
                ) : (
                  <span className="no-model">—</span>
                )}
              </div>

              <div className="col-activity">
                <span className="activity-time">
                  {this.formatLastActivity(user.lastActivity)}
                </span>
              </div>
            </div>
          ))}

          {connectedUsers.length === 0 && (
            <div className="table-row empty">
              <div className="empty-message">No other users online</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  render() {
    const { isCollaborative, isConnected, connectedUsers, totalUsers, usersInModels } = this.state;

    // Solo mostrar si el proyecto es colaborativo
    if (!isCollaborative) {
      return null;
    }

    // Versión compacta para NavBar
    const isCompact = connectedUsers.length <= 3;

    return (
      <div className={`project-awareness ${isCompact ? 'compact' : ''}`}>
        <div className="awareness-header">
          <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢' : '🔴'}
          </span>
          <span className="awareness-title">
            Online: {totalUsers} total, {usersInModels} in models
          </span>
        </div>

        {connectedUsers.length > 0 && (
          <div className={`connected-users ${isCompact ? 'horizontal' : ''}`}>
            {connectedUsers.map((user) => {
              const tooltipText = user.isInSpecificModel
                ? `${user.name} - Working in: ${user.currentModelName} - ${this.formatLastActivity(user.lastActivity)}`
                : `${user.name} - In project - ${this.formatLastActivity(user.lastActivity)}`;

              return (
                <div key={user.id} className={`connected-user ${user.isInSpecificModel ? 'in-model' : 'in-project'}`} title={tooltipText}>
                  <div className="user-container">
                    <div
                      className={`user-avatar ${user.isInSpecificModel ? 'clickable' : ''}`}
                      style={{ backgroundColor: user.color }}
                      onClick={() => user.isInSpecificModel && this.openUserModel(user)}
                    >
                      {user.name.charAt(0).toUpperCase()}
                      {user.isInSpecificModel && <span className="model-indicator">📝</span>}
                    </div>
                    {isCompact && (
                      <div className="compact-model-info">
                        <div className="user-name-compact">{user.name}</div>
                        {user.isInSpecificModel ? (
                          <div
                            className="model-compact clickable"
                            onClick={() => this.openUserModel(user)}
                            title={`Click to open: ${user.currentModelName}`}
                          >
                            📝 {user.currentModelName}
                          </div>
                        ) : (
                          <div className="browsing-compact">🏠 Project</div>
                        )}
                      </div>
                    )}
                  </div>
                  {!isCompact && (
                    <div className="user-info">
                      <div className="user-name">
                        {user.name}
                      </div>
                      <div className="user-model">
                        {user.isInSpecificModel ? (
                          <span
                            className="model-info clickable"
                            onClick={() => this.openUserModel(user)}
                            title={`Click to open: ${user.currentModelName}`}
                          >
                            📝 {user.currentModelName}
                          </span>
                        ) : (
                          <span className="browsing-info">
                            🏠 Browsing project
                          </span>
                        )}
                      </div>
                      <div className="user-activity">
                        {this.formatLastActivity(user.lastActivity)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {connectedUsers.length === 0 && isConnected && (
          <div className="no-users">
            <small className="text-muted">No other users online</small>
          </div>
        )}

        {!isConnected && (
          <div className="no-connection">
            <small className="text-muted">Connecting...</small>
          </div>
        )}
      </div>
    );
  }
}

export default ProjectAwareness;
