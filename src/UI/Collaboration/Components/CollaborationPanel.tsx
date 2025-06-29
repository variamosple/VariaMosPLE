import React, { Component } from 'react';
import ProjectService from '../../../Application/Project/ProjectService';
import ProjectCollaboration from './ProjectCollaboration';
import ProjectAwareness from './ProjectAwareness';
import './CollaborationPanel.css';

interface Props {
  projectService: ProjectService;
}

interface State {
  isCollaborative: boolean;
}

class CollaborationPanel extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isCollaborative: false,
    };
  }

  componentDidMount() {
    this.updateProjectInfo();
    this.props.projectService.addUpdateProjectListener(this.handleProjectChange.bind(this));
  }

  componentWillUnmount() {
    // Remover listener si es necesario
    // this.props.projectService.removeUpdateProjectListener(this.handleProjectChange.bind(this));
  }

  handleProjectChange = (e: any) => {
    this.updateProjectInfo();
  };

  updateProjectInfo = () => {
    const projectInfo = this.props.projectService.getProjectInformation();
    if (projectInfo) {
      this.setState({
        isCollaborative: projectInfo.is_collaborative || false,
      });
    }
  };

  render() {
    const { isCollaborative } = this.state;

    // Solo mostrar si el proyecto es colaborativo
    if (!isCollaborative) {
      return null;
    }

    return (
      <div className="collaboration-panel">
        <div className="collaboration-header">
          <h6 className="collaboration-title">Collaboration</h6>
        </div>
        
        <div className="collaboration-content">
          {/* Botones de colaboración */}
          <div className="collaboration-buttons">
            <ProjectCollaboration projectService={this.props.projectService} />
          </div>
          
          {/* Usuarios conectados */}
          <div className="collaboration-awareness">
            <ProjectAwareness projectService={this.props.projectService} />
          </div>
        </div>
      </div>
    );
  }
}

export default CollaborationPanel;
