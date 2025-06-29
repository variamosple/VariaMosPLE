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
    isInSpecificModel: boolean;
  }>;
  isCollaborative: boolean;
  isConnected: boolean;
  totalUsers: number;
  usersInModels: number;
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
            const currentModel = state.user.modelId || null;
            const isInSpecificModel = currentModel && currentModel !== 'none';

            return {
              id: collaborator.id,
              name: state.user.name,
              color: state.user.color || '#6c757d',
              lastActivity: state.user.action?.timestamp || new Date().toISOString(),
              currentModel: currentModel,
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
            {connectedUsers.map((user, index) => {
              const tooltipText = user.isInSpecificModel
                ? `${user.name} - Working in model - ${this.formatLastActivity(user.lastActivity)}`
                : `${user.name} - In project - ${this.formatLastActivity(user.lastActivity)}`;

              return (
                <div key={user.id} className={`connected-user ${user.isInSpecificModel ? 'in-model' : 'in-project'}`} title={tooltipText}>
                  <div
                    className="user-avatar"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                    {user.isInSpecificModel && <span className="model-indicator">📝</span>}
                  </div>
                  {!isCompact && (
                    <div className="user-info">
                      <div className="user-name">
                        {user.name}
                        {user.isInSpecificModel && <span className="model-badge">In Model</span>}
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
