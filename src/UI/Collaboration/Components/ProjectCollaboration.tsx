import React, { Component } from 'react';
import { Modal, Dropdown, Form, FormGroup, Button } from 'react-bootstrap';
import ProjectService from '../../../Application/Project/ProjectService';
import { RoleEnum } from '../../../Domain/ProductLineEngineering/Enums/roleEnum';
import './ProjectCollaboration.css';

interface Props {
  projectService: ProjectService;
}

interface State {
  showInviteModal: boolean;
  showCollaboratorsModal: boolean;
  shareInput: string;
  shareRole: string;
  isCollaborative: boolean;
  collaborators: Array<{id: string, name: string, email: string, role: string}>;
  userRole: string;
  isLoading: boolean;
}

class ProjectCollaboration extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      showInviteModal: false,
      showCollaboratorsModal: false,
      shareInput: '',
      shareRole: RoleEnum.VIEWER,
      isCollaborative: false,
      collaborators: [],
      userRole: '',
      isLoading: false,
    };
  }

  componentDidMount() {
    this.updateProjectInfo();
    // Escuchar cambios en el proyecto
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
        collaborators: projectInfo.collaborators || [],
        userRole: projectInfo.role || '',
      });
    }
  };

  handleInviteModalToggle = () => {
    this.setState({ 
      showInviteModal: !this.state.showInviteModal,
      shareInput: '',
      shareRole: RoleEnum.VIEWER
    });
  };

  handleCollaboratorsModalToggle = () => {
    this.setState({ showCollaboratorsModal: !this.state.showCollaboratorsModal });
  };

  handleShareEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ shareInput: event.target.value });
  };

  handleRoleChange = (role: string) => {
    this.setState({ shareRole: role });
  };

  handleInviteCollaborator = async () => {
    const { userRole, shareInput, shareRole } = this.state;
    
    if (userRole !== RoleEnum.OWNER) {
      alert("Only the owner can invite collaborators.");
      return;
    }

    if (!shareInput.trim()) {
      alert("Please enter a valid email address.");
      return;
    }

    const projectInfo = this.props.projectService.getProjectInformation();
    if (!projectInfo?.project?.id) {
      alert("No project selected.");
      return;
    }

    this.setState({ isLoading: true });

    try {
      const share = await this.props.projectService.shareProject(
        projectInfo.id, 
        shareInput.trim(), 
        shareRole
      );

      console.log(`Project shared with ${shareInput} as ${shareRole}`);
      alert(`Project successfully shared with ${shareInput} as ${shareRole}.`);

      const newCollaborator = {
        id: share.id,
        name: share.name,
        email: share.email,
        role: share.role,
      };

      this.setState((prevState) => ({
        collaborators: [...prevState.collaborators, newCollaborator],
        isLoading: false
      }));

      this.handleInviteModalToggle();
    } catch (error) {
      console.error("Error inviting collaborator:", error);
      alert("An error occurred while inviting the collaborator. Please try again.");
      this.setState({ isLoading: false });
    }
  };

  // Método para eliminar colaborador
  removeCollaborator = async (collaboratorId: string) => {
    const { userRole } = this.state;

    if (userRole !== RoleEnum.OWNER) {
      alert("Only the owner can remove collaborators.");
      return;
    }

    if (!window.confirm("Are you sure you want to remove this collaborator?")) {
      return;
    }

    const projectInfo = this.props.projectService.getProjectInformation();
    if (!projectInfo?.project?.id) {
      alert("No project selected.");
      return;
    }

    try {
      const response = await this.props.projectService.removeCollaborator(
        projectInfo.id,
        collaboratorId
      );

      if (response) {
        alert(`Collaborator removed successfully.`);
        this.setState((prevState) => ({
          collaborators: prevState.collaborators.filter(
            (collab) => collab.id !== collaboratorId
          ),
        }));
      } else {
        alert("Could not remove collaborator.");
      }
    } catch (error) {
      console.error("Error removing collaborator:", error);
      alert("An error occurred while removing the collaborator. Please try again.");
    }
  };

  // Método para cambiar rol de colaborador
  changeCollaboratorRole = async (collaboratorId: string, newRole: string) => {
    const { userRole } = this.state;

    if (userRole !== RoleEnum.OWNER) {
      alert("Only the owner can change collaborator roles.");
      return;
    }

    const projectInfo = this.props.projectService.getProjectInformation();
    if (!projectInfo?.project?.id) {
      alert("No project selected.");
      return;
    }

    try {
      const response = await this.props.projectService.changeCollaboratorRole(
        projectInfo.id,
        collaboratorId,
        newRole
      );

      if (response) {
        alert(`Collaborator role changed to ${newRole} successfully.`);
        this.setState((prevState) => ({
          collaborators: prevState.collaborators.map((collab) =>
            collab.id === collaboratorId ? { ...collab, role: newRole } : collab
          ),
        }));
      } else {
        alert("Could not change collaborator role.");
      }
    } catch (error) {
      console.error("Error changing collaborator role:", error);
      alert("An error occurred while changing the collaborator role. Please try again.");
    }
  };

  renderInviteModal() {
    const { userRole, shareInput, shareRole, isLoading } = this.state;
    const isCurrentUserOwner = userRole === RoleEnum.OWNER;

    return (
      <Modal
        show={this.state.showInviteModal}
        onHide={this.handleInviteModalToggle}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Invite Collaborator</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <FormGroup controlId="shareInput">
              <label>User Email</label>
              <FormGroup>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter User Email"
                  value={shareInput}
                  onChange={this.handleShareEmailChange}
                  disabled={!isCurrentUserOwner || isLoading}
                />
              </FormGroup>
            </FormGroup>
            <FormGroup controlId="shareRole">
              <label>User Role</label>
              <FormGroup>
                <Dropdown>
                  <Dropdown.Toggle 
                    variant="outline-secondary" 
                    id="dropdown-basic"
                    disabled={!isCurrentUserOwner || isLoading}
                  >
                    {shareRole}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => this.handleRoleChange(RoleEnum.VIEWER)}>
                      {RoleEnum.VIEWER}
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => this.handleRoleChange(RoleEnum.EDIOR)}>
                      {RoleEnum.EDIOR}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </FormGroup>
            </FormGroup>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <button 
            className="btn btn-secondary" 
            onClick={this.handleInviteModalToggle}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={this.handleInviteCollaborator}
            disabled={!isCurrentUserOwner || isLoading}
          >
            {isLoading ? 'Inviting...' : 'Invite'}
          </button>
        </Modal.Footer>
      </Modal>
    );
  }

  renderCollaboratorsModal() {
    const { collaborators, userRole } = this.state;
    const isCurrentUserOwner = userRole === RoleEnum.OWNER;
    const currentUserId = this.props.projectService.getUser();

    return (
      <Modal
        show={this.state.showCollaboratorsModal}
        onHide={this.handleCollaboratorsModalToggle}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Project Collaborators</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {collaborators.length === 0 ? (
            <p className="text-muted">No collaborators in this project.</p>
          ) : (
            <ul className="list-group">
              {collaborators.map((collaborator) => {
                const isCollaboratorOwner = collaborator.role === RoleEnum.OWNER;
                const isCurrentUser = collaborator.id === currentUserId;

                return (
                  <li
                    key={collaborator.id}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <span>
                        <strong>{collaborator.name}</strong> ({collaborator.email})
                        {isCurrentUser && <span className="text-muted"> (You)</span>}
                      </span>
                      <br />
                      <span style={{ fontSize: "0.9em", color: "#666" }}>
                        Current role: {collaborator.role}
                      </span>
                    </div>
                    <div className="d-flex align-items-center">
                      {/* Dropdown para cambiar el rol */}
                      <Dropdown>
                        <Dropdown.Toggle
                          variant="secondary"
                          size="sm"
                          id={`dropdown-role-${collaborator.id}`}
                          disabled={
                            !isCurrentUserOwner || // Deshabilitar si el usuario actual no es owner
                            isCollaboratorOwner || // Deshabilitar si el colaborador es owner
                            isCurrentUser // Deshabilitar si el colaborador es el usuario actual
                          }
                        >
                          Change Role
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item
                            onClick={() =>
                              this.changeCollaboratorRole(collaborator.id, RoleEnum.EDIOR)
                            }
                            disabled={isCollaboratorOwner || isCurrentUser}
                          >
                            Editor
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() =>
                              this.changeCollaboratorRole(collaborator.id, RoleEnum.VIEWER)
                            }
                            disabled={isCollaboratorOwner || isCurrentUser}
                          >
                            Viewer
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>

                      {/* Botón para eliminar colaborador */}
                      <Button
                        variant="danger"
                        size="sm"
                        className="ms-2"
                        onClick={() => this.removeCollaborator(collaborator.id)}
                        disabled={
                          !isCurrentUserOwner || // Deshabilitar si el usuario actual no es owner
                          isCollaboratorOwner || // Deshabilitar si el colaborador es owner
                          isCurrentUser // Deshabilitar si es el usuario actual
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={this.handleCollaboratorsModalToggle}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  render() {
    const { isCollaborative, userRole, collaborators } = this.state;

    // Solo mostrar si el proyecto es colaborativo
    if (!isCollaborative) {
      return null;
    }

    const isOwner = userRole === RoleEnum.OWNER;

    return (
      <div className="project-collaboration">
        {isOwner && (
          <a 
            title="Invite collaborators" 
            onClick={this.handleInviteModalToggle}
            className="collaboration-button"
          >
            <span>👥 Invite</span>
          </a>
        )}
        
        <a 
          title="View collaborators" 
          onClick={this.handleCollaboratorsModalToggle}
          className="collaboration-button"
        >
          <span>👥 Collaborators ({collaborators.length})</span>
        </a>

        {this.renderInviteModal()}
        {this.renderCollaboratorsModal()}
      </div>
    );
  }
}

export default ProjectCollaboration;
