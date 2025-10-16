import { Component } from "react";
import { Nav, Tab } from "react-bootstrap";
import Editor from "react-simple-code-editor";
import ProjectService from "../../Application/Project/ProjectService";
import { Adaptation } from "../../Domain/ProductLineEngineering/Entities/Adaptation";
import { Application } from "../../Domain/ProductLineEngineering/Entities/Application";
import { Model } from "../../Domain/ProductLineEngineering/Entities/Model";
import { ProductLine } from "../../Domain/ProductLineEngineering/Entities/ProductLine";
import { ScopeSPL } from "../../Domain/ProductLineEngineering/Entities/ScopeSPL";
import ScopeModal from "../Scope/ScopeModal";
import {
  getCurrentConstraints,
  setModelConstraints,
} from "../../Domain/ProductLineEngineering/UseCases/QueryUseCases";
import QueryModal from "../Queries/queryModal";
import NavBar from "../WorkSpace/navBar";
import { CollaborationPanel } from "../Collaboration";
import "./TreeExplorer.css";
import { TreeItem } from "./TreeItem";
import TreeMenu from "./TreeMenu";
import treeCollaborationService from "../../DataProvider/Services/collab/treeCollaborationService";

import { highlight, languages } from "prismjs";

interface Props {
  projectService: ProjectService;
}

interface State {
  contextMenuX: number,
  contextMenuY: number,
  showContextMenu: boolean,
  arbitraryConstraints: string,
  showScopeModal: boolean,
  currentProductLineIndex: number,
  currentProjectId: string | null,
  treeSyncStatus: 'idle' | 'connecting' | 'syncing' | 'ready' | 'error',
  treeSyncMessage: string,
}

class TreeExplorer extends Component<Props, State> {
  state = {
    contextMenuX: 100,
    contextMenuY: 100,
    showContextMenu: false,
    arbitraryConstraints: "",
    showScopeModal: false,
    currentProductLineIndex: 0,
    currentProjectId: null,
    treeSyncStatus: 'idle' as const,
    treeSyncMessage: '',
  };

  constructor(props: any) {
    super(props);

    this.btnSave_onClick = this.btnSave_onClick.bind(this);
    this.projectService_addListener =
    this.projectService_addListener.bind(this);
    this.lps_onClick = this.lps_onClick.bind(this);
    this.updateLpSelected = this.updateLpSelected.bind(this);
    this.updateApplicationSelected = this.updateApplicationSelected.bind(this);
    this.updateAdaptationSelected = this.updateAdaptationSelected.bind(this);
    this.doubleClickLpSelected= this.doubleClickLpSelected.bind(this);

    this.btn_viewDomainModel = this.btn_viewDomainModel.bind(this);
    this.btn_viewApplicationEngModel =
      this.btn_viewApplicationEngModel.bind(this);
    this.btn_viewApplicationModel = this.btn_viewApplicationModel.bind(this);
    this.btn_viewAdaptationModel = this.btn_viewAdaptationModel.bind(this);

    this.onContextMenuHide = this.onContextMenuHide.bind(this);
    this.setArbitraryConstraints = this.setArbitraryConstraints.bind(this);
  }

  onContextMenuHide(e) {
    this.setState({
      showContextMenu: false
    });
  }

  btn_viewScopeModel(e: any, idPl: number, idScopeModel: number) {
    console.log("treeExplorer btn_viewScopeModel")
    this.props.projectService.modelScopeSelected(idPl, idScopeModel);
    this.props.projectService.saveProject();
    if (e) {
      this.setState({
        showContextMenu: true,
        contextMenuX: e.event.clientX,
        contextMenuY: e.event.clientY
      })
    }
  }

  btn_viewDomainModel(e: any, idPl: number, idDomainModel: number) {
    console.log("treeExplorer btn_viewDomainModel")
    this.props.projectService.modelDomainSelected(idPl, idDomainModel);
    this.props.projectService.saveProject();
    if (e) {
      this.setState({
        showContextMenu: true,
        contextMenuX: e.event.clientX,
        contextMenuY: e.event.clientY
      })
    }
  }

  setArbitraryConstraints(newArbitraryConstraints: string) {
    this.setState({
      ...this.state,
      arbitraryConstraints: newArbitraryConstraints
    })

    //Handle changes on the model's arbitrary constraints
    setModelConstraints(this.props.projectService , this.state.arbitraryConstraints);
  }

  btn_viewApplicationModel(
    e: any,
    idPl: number,
    idApplication: number,
    idApplicationModel: number
  ) {
    this.props.projectService.modelApplicationSelected(
      idPl,
      idApplication,
      idApplicationModel
    );
    this.props.projectService.saveProject();
    if (e) {
      this.setState({
        showContextMenu: true,
        contextMenuX: e.event.clientX,
        contextMenuY: e.event.clientY
      })
    }
  }

  btn_viewAdaptationModel(
    e: any,
    idPl: number,
    idApplication: number,
    idAdaptation: number,
    idAdaptationModel: number
  ) {
    this.props.projectService.modelAdaptationSelected(
      idPl,
      idApplication,
      idAdaptation,
      idAdaptationModel
    );
    this.props.projectService.saveProject();
    if (e) {
      this.setState({
        showContextMenu: true,
        contextMenuX: e.event.clientX,
        contextMenuY: e.event.clientY
      })
    }
  }

  btn_viewApplicationEngModel(idPl: number, idApplicationEngModel: number) {
    this.props.projectService.modelApplicationEngSelected(
      idPl,
      idApplicationEngModel
    );
    this.props.projectService.saveProject();
  }

  updateLpSelected(e: any, idPl: number) {
    this.props.projectService.updateLpSelected(idPl);
    if (e.target.props.dataKey === "scope") {
      this.props.projectService.updateScopeSelected();
    }
    else if (e.target.props.dataKey === "domainEngineering") {
      this.props.projectService.updateDomainEngSelected();
    } 
    else if (e.target.props.dataKey === "applicationEngineering") {
      this.props.projectService.updateAppEngSelected();
    }
    this.props.projectService.saveProject();
    this.setState({
      showContextMenu: true,
      contextMenuX: e.event.clientX,
      contextMenuY: e.event.clientY
    })
  }

  doubleClickLpSelected(e: any, idPl: number) {
    this.props.projectService.updateLpSelected(idPl); 
    // this.setState({
    //   showContextMenu: true,
    //   contextMenuX: e.event.clientX,
    //   contextMenuY: e.event.clientY
    // })
  }

  updateApplicationSelected(e: any, idPl: number, idApplication: number) {
    this.props.projectService.updateApplicationSelected(idPl, idApplication);
    this.props.projectService.saveProject();
    this.setState({
      showContextMenu: true,
      contextMenuX: e.event.clientX,
      contextMenuY: e.event.clientY
    })
  }

  updateAdaptationSelected(
    e: any,
    idPl: number,
    idApplication: number,
    idAdaptation: number
  ) {
    this.props.projectService.updateAdaptationSelected(
      idPl,
      idApplication,
      idAdaptation
    );
    this.props.projectService.saveProject();
    this.setState({
      showContextMenu: true,
      contextMenuX: e.event.clientX,
      contextMenuY: e.event.clientY
    })
  }

  lps_onClick(e: any, i: number) {
    e.target.parentElement.querySelector(".nested").classList.toggle("active");
    e.target.classList.toggle("fa-minus-square-o");
  }

  projectService_addListener(e: any) {
    // Detectar si cambió el proyecto
    const projectInfo = this.props.projectService.getProjectInformation();
    const newProjectId = projectInfo?.project?.id || null;

    if (newProjectId !== this.state.currentProjectId) {
      // Actualizar el estado con el nuevo proyecto
      this.setState({ currentProjectId: newProjectId });

      // Limpiar colaboración anterior
      treeCollaborationService.cleanup();

      // Limpiar estado de sincronización
      this.setState({
        treeSyncStatus: 'idle',
        treeSyncMessage: ''
      });

      // Reinicializar colaboración para el nuevo proyecto
      if (newProjectId) {
        this.initializeTreeCollaboration();
      }
    }

    this.forceUpdate();
    this.props.projectService.saveProject();
  }

  componentDidMount() {
    let me = this;
    me.props.projectService.addNewProductLineListener(
      this.projectService_addListener
    );

    me.props.projectService.addNewApplicationListener(
      this.projectService_addListener
    );

    me.props.projectService.addNewApplicationModelListener(
      this.projectService_addListener
    );

    me.props.projectService.addNewAdaptationListener(
      this.projectService_addListener
    );

    me.props.projectService.addNewAdaptationModelListener(
      this.projectService_addListener
    );

    me.props.projectService.addScopeModelListener(
      this.projectService_addListener
    );
    me.props.projectService.addNewDomainEngineeringModelListener(
      this.projectService_addListener
    );
    me.props.projectService.addNewApplicationEngineeringModelListener(
      this.projectService_addListener
    );

    me.props.projectService.addUpdateProjectListener(
      this.projectService_addListener
    );

    //Load constraints on model change
    const constraints = getCurrentConstraints(this.props.projectService);
    this.setArbitraryConstraints(constraints);

    // Inicializar colaboración del tree si el proyecto es colaborativo
    this.initializeTreeCollaboration();

    document.addEventListener("click", function(e:any) {
      if(!(''+e.target.className).includes("dropdown")){
        me.setState({
          showContextMenu: false
        })
      }
    });
  }

  btnSave_onClick(e: any) {
    this.props.projectService.saveProject();
  }

  // Inicializar colaboración del TreeExplorer
  async initializeTreeCollaboration() {
    const projectInfo = this.props.projectService.getProjectInformation();
    if (!projectInfo?.is_collaborative) {
      this.setState({
        treeSyncStatus: 'idle',
        treeSyncMessage: ''
      });
      return;
    }

    if (!projectInfo.project?.id) {
      this.setState({
        treeSyncStatus: 'error',
        treeSyncMessage: 'Proyecto sin ID válido'
      });
      return;
    }

    // Actualizar el estado del proyecto actual si no está establecido
    if (this.state.currentProjectId !== projectInfo.project.id) {
      this.setState({ currentProjectId: projectInfo.project.id });
    }

    // Indicar que se está conectando
    this.setState({
      treeSyncStatus: 'connecting',
      treeSyncMessage: 'Conectando con el servidor colaborativo...'
    });

    // Esperar un poco para que YJS se inicialice
    setTimeout(async () => {
      try {
        // Indicar que se está sincronizando
        this.setState({
          treeSyncStatus: 'syncing',
          treeSyncMessage: 'Sincronizando estado del árbol...'
        });

        const success = await treeCollaborationService.initializeTreeSync(projectInfo.project.id);

        if (success) {
          // Verificar el estado de la conexión
          const connectionStatus = treeCollaborationService.getConnectionStatus();
          // PASO 1: Determinar fuente de verdad inteligentemente
          const existingTreeState = treeCollaborationService.getExistingTreeState();
          const localModelsCount = this.countAllModels(this.props.projectService.getProject());

          if (existingTreeState && existingTreeState.productLines && existingTreeState.productLines.length > 0) {
            // CASO 1: Hay estado colaborativo activo - usarlo como fuente de verdad
            this.applyFullTreeState(existingTreeState);

            // Sincronizar estado actual después de aplicar
            treeCollaborationService.syncCurrentProjectState(this.props.projectService);

          } else if (localModelsCount > 0) {
            // CASO 2: No hay estado colaborativo pero sí modelos locales (DB) - usar DB como fuente de verdad
            treeCollaborationService.syncCurrentProjectState(this.props.projectService);

          } else {
            // CASO 3: Ambos vacíos - proyecto nuevo
            treeCollaborationService.syncCurrentProjectState(this.props.projectService);
          }

          // PASO 2: Observar cambios en el tree colaborativo
          const unsubscribe = treeCollaborationService.observeTreeChanges((changes) => {
            this.handleCollaborativeTreeChanges(changes);
          });

          // Verificar si la conexión está completamente sincronizada
          if (connectionStatus.connected && connectionStatus.synced) {
            // Mostrar mensaje de éxito por 5 segundos y luego ocultar
            this.setState({
              treeSyncStatus: 'ready',
              treeSyncMessage: `Sincronización completada. Es seguro usar los diagramas. (${connectionStatus.userCount} usuario${connectionStatus.userCount !== 1 ? 's' : ''} conectado${connectionStatus.userCount !== 1 ? 's' : ''})`
            });

            // Ocultar el indicador después de 5 segundos
            setTimeout(() => {
              this.setState({
                treeSyncStatus: 'ready', // Esto hará que el indicador desaparezca
                treeSyncMessage: ''
              });
            }, 5000);
          } else {
            // Si no está completamente sincronizado, mostrar estado de espera
            this.setState({
              treeSyncStatus: 'syncing',
              treeSyncMessage: 'Esperando sincronización completa...'
            });

            // Verificar periódicamente hasta que esté sincronizado
            const checkSyncInterval = setInterval(() => {
              const currentStatus = treeCollaborationService.getConnectionStatus();
              if (currentStatus.connected && currentStatus.synced) {
                clearInterval(checkSyncInterval);
                this.setState({
                  treeSyncStatus: 'ready',
                  treeSyncMessage: `Sincronización completada. Es seguro usar los diagramas.`
                });

                // Ocultar después de 5 segundos
                setTimeout(() => {
                  this.setState({
                    treeSyncStatus: 'ready',
                    treeSyncMessage: ''
                  });
                }, 5000);
              }
            }, 1000); // Verificar cada segundo

            // Timeout de seguridad para evitar verificación infinita
            setTimeout(() => {
              clearInterval(checkSyncInterval);
              // Forzar el estado a ready después del timeout
              this.setState({
                treeSyncStatus: 'ready',
                treeSyncMessage: ''
              });
            }, 10000); // Máximo 10 segundos de verificación
          }

          // Guardar la función de cleanup (podrías guardarla en el state si necesitas limpiar después)

        } else {
          this.setState({
            treeSyncStatus: 'error',
            treeSyncMessage: 'Error al inicializar la colaboración'
          });

          // Los errores se mantienen visibles por más tiempo
          setTimeout(() => {
            this.setState({
              treeSyncStatus: 'idle',
              treeSyncMessage: ''
            });
          }, 10000); // 10 segundos para errores
        }
      } catch (error) {
        console.error(`[TreeExplorer] ❌ Error inicializando tree collaboration:`, error);
        this.setState({
          treeSyncStatus: 'error',
          treeSyncMessage: 'Error de conexión con el servidor colaborativo'
        });

        // Los errores se mantienen visibles por más tiempo
        setTimeout(() => {
          this.setState({
            treeSyncStatus: 'idle',
            treeSyncMessage: ''
          });
        }, 10000); // 10 segundos para errores
      }
    }, 3000); // Esperar 3 segundos para que YJS se conecte
  }

  // Manejar cambios colaborativos en el tree
  handleCollaborativeTreeChanges(changes: any) {
    if (!changes || !changes.data) {
      return;
    }

    // Manejar estado completo del tree (para nuevos usuarios)
    if (changes.type === 'tree-full-state') {
      this.applyFullTreeState(changes.data);
      return;
    }

    // Manejar operaciones incrementales
    if (changes.type === 'tree-operations') {
      const operations = changes.data;

      if (typeof operations === 'object') {
        Object.values(operations).forEach((operation: any) => {
          if (this.isValidTreeOperation(operation)) {
            this.processTreeOperation(operation);
          }
        });
      }
    }
  }

  // Función auxiliar para contar todos los modelos en un proyecto
  countAllModels(project: any): number {
    let totalModels = 0;

    if (project.productLines) {
      project.productLines.forEach((pl: any) => {
        // Contar modelos de scope
        if (pl.scope?.models) {
          totalModels += pl.scope.models.length;
        }

        // Contar modelos de domain engineering
        if (pl.domainEngineering?.models) {
          totalModels += pl.domainEngineering.models.length;
        }

        // Contar modelos de application engineering
        if (pl.applicationEngineering?.models) {
          totalModels += pl.applicationEngineering.models.length;
        }
      });
    }

    return totalModels;
  }

  // Buscar un modelo por ID en todo el proyecto
  findModelById(modelId: string): any {
    const project = this.props.projectService.project;

    for (const productLine of project.productLines) {
      // Buscar en modelos de scope
      if (productLine.scope?.models) {
        const found = productLine.scope.models.find((model: any) => model.id === modelId);
        if (found) return found;
      }

      // Buscar en modelos de domain engineering
      if (productLine.domainEngineering?.models) {
        const found = productLine.domainEngineering.models.find((model: any) => model.id === modelId);
        if (found) return found;
      }

      // Buscar en modelos de application engineering
      if (productLine.applicationEngineering?.models) {
        const found = productLine.applicationEngineering.models.find((model: any) => model.id === modelId);
        if (found) return found;
      }

      // Buscar en applications
      if (productLine.applicationEngineering?.applications) {
        for (const application of productLine.applicationEngineering.applications) {
          if (application.models) {
            const found = application.models.find((model: any) => model.id === modelId);
            if (found) return found;
          }
        }
      }
    }

    return null;
  }

  // Validar si una operación del tree es válida
  isValidTreeOperation(operation: any): boolean {
    return operation &&
           operation.type &&
           operation.operationId &&
           operation.timestamp &&
           operation.data;
  }

  // Aplicar estado completo del tree (sincronización inteligente como fuente de verdad)
  applyFullTreeState(treeState: any) {
    if (!treeState || !treeState.productLines) {
      return;
    }

    const totalModels = treeState.productLines.reduce((total: number, pl: any) => total + (pl.models?.length || 0), 0);
    const totalApplications = treeState.productLines.reduce((total: number, pl: any) => total + (pl.applications?.length || 0), 0);

    try {
      // Obtener el proyecto actual
      const project = this.props.projectService.getProject();
      if (!project) {
        return;
      }

      // Contar elementos antes de la sincronización
      const beforeCount = project.productLines?.length || 0;
      const beforeModelsCount = this.countAllModels(project);

      //  PASO 1: Preservar contenido de modelos existentes antes de limpiar
      // Crear mapa para preservar contenido de modelos
      const existingModelsContent = new Map();
      project.productLines?.forEach(pl => {
        // Buscar modelos en todas las secciones
        const allModels = [
          ...(pl.domainEngineering?.models || []),
          ...(pl.applicationEngineering?.models || []),
          ...(pl.scope?.models || [])
        ];

        allModels.forEach(model => {
          if (model && model.id && model.elements && model.elements.length > 0) {
            existingModelsContent.set(model.id, {
              elements: [...model.elements],
              relationships: [...(model.relationships || [])],
              constraints: model.constraints,
              author: model.author,
              description: model.description
            });
          }
        });
      });

      // PASO 2: Limpiar solo estructura (preservando contenido)
      project.productLines = [];

      // PASO 3: Recrear estructura desde estado colaborativo
      project.productLines = treeState.productLines.map((plState: any) => {
        // Crear nueva línea de producto usando el servicio
        const newPL = this.props.projectService.createLPS(
          project,
          plState.name,
          plState.type,
          plState.domain
        );

        // Actualizar el ID para que coincida con el estado colaborativo
        newPL.id = plState.id;
        // Sincronizar applications en applicationEngineering
        if (plState.applications && newPL.applicationEngineering) {
          newPL.applicationEngineering.applications = plState.applications.map((appState: any) => {
            const newApp = {
              id: appState.id,
              name: appState.name,
              models: [],
              adaptations: []
            };

            // Sincronizar adaptations
            if (appState.adaptations) {
              newApp.adaptations = appState.adaptations.map((adaptState: any) => ({
                id: adaptState.id,
                name: adaptState.name,
                models: []
              }));
            }

            return newApp;
          });
        }

        // Sincronizar models en las diferentes secciones
        if (plState.models) {
          plState.models.forEach((modelState: any, modelIndex: number) => {
            // Determinar dónde colocar el modelo según su tipo
            if (modelState.type === 'scope' && newPL.scope) {
              try {
                const languageName = modelState.languageName || 'default';
                const languageId = modelState.languageId || 'default';

                const newModel = this.props.projectService.createScopeModel(
                  project,
                  languageName,
                  languageId,
                  modelState.name,
                  '',
                  '',
                  ''
                );
                // Actualizar el ID para que coincida con el estado colaborativo
                newModel.id = modelState.id;

                //Restaurar contenido preservado si existe
                const preservedContent = existingModelsContent.get(modelState.id);
                if (preservedContent) {
                  newModel.elements = preservedContent.elements;
                  newModel.relationships = preservedContent.relationships;
                  newModel.constraints = preservedContent.constraints;
                  newModel.author = preservedContent.author;
                  newModel.description = preservedContent.description;
                }
              } catch (error) {
                console.error(`Error creando scope model:`, error);
              }
            } else if (modelState.type === 'domainEngineering' && newPL.domainEngineering) {
              try {
                const languageName = modelState.languageName || 'default';
                const languageId = modelState.languageId || 'default';

                const newModel = this.props.projectService.createDomainEngineeringModel(
                  project,
                  languageName,
                  languageId,
                  modelState.name,
                  '',
                  '',
                  ''
                );
                newModel.id = modelState.id;

                // Restaurar contenido preservado si existe
                const preservedContent = existingModelsContent.get(modelState.id);
                if (preservedContent) {
                  newModel.elements = preservedContent.elements;
                  newModel.relationships = preservedContent.relationships;
                  newModel.constraints = preservedContent.constraints;
                  newModel.author = preservedContent.author;
                  newModel.description = preservedContent.description;
                }

              } catch (error) {
                console.error(`Error creando domain engineering model:`, error);
              }
            } else if (modelState.type === 'applicationEngineering' && newPL.applicationEngineering) {
              try {
                const languageName = modelState.languageName || 'default';
                const languageId = modelState.languageId || 'default';

                const newModel = this.props.projectService.createApplicationEngineeringModel(
                  project,
                  languageName,
                  languageId,
                  modelState.name,
                  '',
                  '',
                  ''
                );
                newModel.id = modelState.id;

                // 🔧 [FIX] Restaurar contenido preservado si existe
                const preservedContent = existingModelsContent.get(modelState.id);
                if (preservedContent) {
                  newModel.elements = preservedContent.elements;
                  newModel.relationships = preservedContent.relationships;
                  newModel.constraints = preservedContent.constraints;
                  newModel.author = preservedContent.author;
                  newModel.description = preservedContent.description;
                }

              } catch (error) {
                console.error(`Error creando application engineering model:`, error);
              }
            } 
          });
        }

        return newPL;
      });

      // Contar elementos después de la sincronización
      const afterCount = project.productLines?.length || 0;
      const afterModelsCount = this.countAllModels(project);

      // Forzar actualización de la UI
      this.forceUpdate();
    } catch (error) {
      console.error(`Error aplicando estado completo del tree:`, error);
    }
  }
  // Procesar una operación del tree
  processTreeOperation(operation: any) {
    switch (operation.type) {
      case 'ADD_MODEL':
        this.handleRemoteAddModel(operation.data);
        break;
      case 'DELETE_MODEL':
        this.handleRemoteDeleteModel(operation.data);
        break;
      case 'EDIT_ITEM':
        this.handleRemoteEditItem(operation.data);
        break;
      case 'UPDATE_SCOPE':
        this.handleRemoteUpdateScope(operation.data);
        break;
      default:
        console.log(`Tipo de operación no reconocido: ${operation.type}`);
    }
  }

  // Manejar agregar modelo remoto (mejorado con validación robusta)
  handleRemoteAddModel(modelData: any) {
    try {
      // Verificar si el modelo ya existe para evitar duplicados (usando función mejorada)
      const existingModel = this.findModelById(modelData.id);
      if (existingModel) {
        return;
      }

      // Agregar el modelo al proyecto local según su tipo
      let newModel = null;

      if (modelData.type === 'scope') {
        newModel = this.props.projectService.createScopeModel(
          this.props.projectService.project,
          modelData.languageName,
          modelData.languageId,
          modelData.name,
          modelData.description,
          modelData.author,
          modelData.source
        );
      } else if (modelData.type === 'domainEngineering') {
        newModel = this.props.projectService.createDomainEngineeringModel(
          this.props.projectService.project,
          modelData.languageName,
          modelData.languageId,
          modelData.name,
          modelData.description,
          modelData.author,
          modelData.source
        );
      } else if (modelData.type === 'applicationEngineering') {
        newModel = this.props.projectService.createApplicationEngineeringModel(
          this.props.projectService.project,
          modelData.languageName,
          modelData.languageId,
          modelData.name,
          modelData.description,
          modelData.author,
          modelData.source
        );
      }

      // Actualizar el ID del modelo para que coincida con el remoto
      if (newModel) {
        newModel.id = modelData.id;
      }
      // Forzar actualización de la UI para mostrar el nuevo modelo
      this.forceUpdate();

    } catch (error) {
      console.error(`Error agregando modelo remoto al proyecto local:`, error);
    }
  }



  // Manejar eliminar modelo remoto
  handleRemoteDeleteModel(modelData: any) {
    try {
      // Usar la función mejorada de búsqueda
      const model = this.findModelById(modelData.id);

      if (model) {
        // Usar la lógica existente de eliminación del ProjectService
        // Guardar el ID seleccionado actual para restaurarlo después
        const previousSelectedId = this.props.projectService.getTreeIdItemSelected();
        const previousSelectedType = this.props.projectService.getTreeItemSelected();

        // Temporalmente establecer el modelo como seleccionado usando el método público
        this.props.projectService.setTreeItemSelected("model");
        // Acceder directamente a la propiedad privada temporalmente para la eliminación
        (this.props.projectService as any).treeIdItemSelected = modelData.id;

        // Usar el método público deleteItemProject que maneja todo internamente
        this.props.projectService.deleteItemProject();

        // Restaurar la selección anterior
        this.props.projectService.setTreeItemSelected(previousSelectedType);
        (this.props.projectService as any).treeIdItemSelected = previousSelectedId;

      } 
    } catch (error) {
      console.error(`Error eliminando modelo remoto:`, error);
    }

    // Forzar actualización de la UI
    this.forceUpdate();
  }

  // Manejar editar elemento remoto
  handleRemoteEditItem(itemData: any) {
    try {
      const project = this.props.projectService.project;

      if (itemData.itemType === 'model') {
        // Usar la función mejorada de búsqueda
        const model = this.findModelById(itemData.id);

        if (model) {
          // Verificar si es una operación de renombrado simple o cambio de propiedades múltiples
          if (itemData.newName && itemData.oldName) {
            // Operación de renombrado simple (desde menú contextual)
            const previousSelectedId = this.props.projectService.getTreeIdItemSelected();
            const previousSelectedType = this.props.projectService.getTreeItemSelected();

            this.props.projectService.setTreeItemSelected("model");
            (this.props.projectService as any).treeIdItemSelected = itemData.id;

            this.props.projectService.renameItemProject(itemData.newName);

            this.props.projectService.setTreeItemSelected(previousSelectedType);
            (this.props.projectService as any).treeIdItemSelected = previousSelectedId;

          } else if (itemData.newValues && itemData.oldValues) {
            // Operación de cambio de propiedades múltiples (desde modal de propiedades)
            // Aplicar cambios de propiedades, pero omitir el nombre si ya fue sincronizado
            if (itemData.newValues.name !== undefined && !itemData.nameAlreadySynced) {
              model.name = itemData.newValues.name;
            }
            if (itemData.newValues.description !== undefined) model.description = itemData.newValues.description;
            if (itemData.newValues.author !== undefined) model.author = itemData.newValues.author;
            if (itemData.newValues.source !== undefined) model.source = itemData.newValues.source;

            // Guardar proyecto y disparar eventos
            this.props.projectService.saveProject();
            this.props.projectService.raiseEventUpdateProject(project, itemData.id);
          }
        }
      } else if (itemData.itemType === 'productLine') {
        // Manejar edición de ProductLine
        const productLine = project.productLines.find((pl: any) => pl.id === itemData.id);

        if (productLine && itemData.newValues && itemData.oldValues) {
          // Aplicar cambios de propiedades
          if (itemData.newValues.name !== undefined) productLine.name = itemData.newValues.name;
          if (itemData.newValues.domain !== undefined) productLine.domain = itemData.newValues.domain;
          if (itemData.newValues.type !== undefined) productLine.type = itemData.newValues.type;

          // Guardar proyecto y disparar eventos
          this.props.projectService.saveProject();
          this.props.projectService.raiseEventUpdateProject(project, null);
        } 
      } 
    } catch (error) {
      console.error(`Error editando elemento remoto:`, error);
    }

    // Forzar actualización de la UI
    this.forceUpdate();

    // Mostrar notificación al usuario
    const notificationText = itemData.newName
      ? `${itemData.itemType} renombrado: ${itemData.oldName} -> ${itemData.newName}`
      : `${itemData.itemType} propiedades actualizadas`;
  }

  // Manejar actualización remota de scope (Technical Metrics)
  handleRemoteUpdateScope(scopeData: any) {
    try {
      const project = this.props.projectService.project;

      // Buscar la product line correspondiente
      const productLine = project.productLines.find((pl: any) => pl.id === scopeData.productLineId);

      if (productLine && productLine.scope) {
        // Aplicar los cambios del scope remoto
        if (scopeData.newValues) {
          // Actualizar las propiedades del scope
          Object.keys(scopeData.newValues).forEach(key => {
            if (productLine.scope.hasOwnProperty(key)) {
              productLine.scope[key] = scopeData.newValues[key];
            }
          });

          // Guardar proyecto y disparar eventos
          this.props.projectService.saveProject();
          this.props.projectService.raiseEventUpdateProject(project, null);
        }
      } 
    } catch (error) {
      console.error(`Error aplicando actualización remota de scope:`, error);
    }

    // Forzar actualización de la UI
    this.forceUpdate();
  }

  componentWillUnmount() {
    // Limpiar la colaboración del tree al desmontar el componente
    treeCollaborationService.cleanup();
  }

  renderModelFolders(folders:any[]) {
    let treeItems = []
    for (var key in folders) {
      treeItems.push(
        <TreeItem key={key} icon="/images/treeView/folder.png" label={key}>
          {folders[key]}
        </TreeItem>
      )
    }
    return (
      <TreeItem icon="/images/treeView/folder.png" label="Models">
        {treeItems}
      </TreeItem>
    );
  } 

  renderDomainModels(models: Model[], idProductLine: number) {
    let folders = [];
    for (let idModel = 0; idModel < models.length; idModel++) {
      const model: Model = models[idModel];
      if (!model.type) {
        model.type = model.name;
      }
      let type = "" + model.type;
      if (!folders[type]) {
        folders[type] = [];
      }
      folders[type].push(
        <TreeItem key={model.id} icon="/images/treeView/model.png" label={model.name} onClick={(e) => this.btn_viewDomainModel(null, idProductLine, idModel)} onAuxClick={(e) => this.btn_viewDomainModel( e, idProductLine, idModel ) }>
        </TreeItem>
      )
    }
    return this.renderModelFolders(folders);
  }

  renderScopeModels(models: Model[], idProductLine: number) {
    let folders = [];
    for (let idModel = 0; idModel < models.length; idModel++) {
      const model: Model = models[idModel];
      if (!model.type) {
        model.type = model.name;
      }
      let type = "" + model.type;
      if (!folders[type]) {
        folders[type] = [];
      }
      folders[type].push(
        <TreeItem icon="/images/treeView/model.png" label={model.name} onClick={(e) => this.btn_viewScopeModel(null, idProductLine, idModel)} onAuxClick={(e) => this.btn_viewScopeModel( e, idProductLine, idModel ) }>
        </TreeItem>
      )
    }
    return this.renderModelFolders(folders);
  }



  renderApplicationModels(models: Model[], idProductLine: number, idApplication: number) {
    let folders = [];
    for (let idModel = 0; idModel < models.length; idModel++) {
      const model: Model = models[idModel];
      if (!model.type) {
        model.type = model.name;
      }
      let type = "" + model.type;
      if (!folders[type]) {
        folders[type] = [];
      }
      let icon="/images/treeView/model.png";
      if(model.inconsistent){
         icon="/images/treeView/modelInconsistent.png";
      }
      folders[type].push(
        <TreeItem key={model.id} icon={icon} label={model.name} onClick={(e) => this.btn_viewApplicationModel(
          null,
          idProductLine,
          idApplication,
          idModel
        )} onAuxClick={(e) => this.btn_viewApplicationModel(
          e,
          idProductLine,
          idApplication,
          idModel
        ) }>
        </TreeItem>
      )
    }
    return this.renderModelFolders(folders);
  }

  

  renderAdaptationModels(models: Model[], idProductLine: number, idApplication: number, idAdaptation: number) {
    let folders = [];
    for (let idModel = 0; idModel < models.length; idModel++) {
      const model: Model = models[idModel];
      if (!model.type) {
        model.type = model.name;
      }
      let type = "" + model.type;
      if (!folders[type]) {
        folders[type] = [];
      }
      folders[type].push(
        <TreeItem key={model.id} icon="/images/treeView/model.png" label={model.name} onClick={(e) => this.btn_viewAdaptationModel(
          null,
          idProductLine,
          idApplication,
          idAdaptation,
          idModel
        )} onAuxClick={(e) => this.btn_viewAdaptationModel(
          e,
          idProductLine,
          idApplication,
          idAdaptation,
          idModel
        )}>
        </TreeItem>
      )
    }
    return this.renderModelFolders(folders);
  }

 
  renderDomainEngineering(productLine: ProductLine, idProductLine: number) {
    return this.renderDomainModels(productLine.domainEngineering.models, idProductLine)
  }
// TODO ver que sucede con el scope
  renderScope(productLine: ProductLine, idProductLine: number) {
    //colocar validación de que el scope se tiene que validar en el caso de que no exista
    productLine.scope ??= new ScopeSPL();
    return this.renderScopeModels(productLine.scope.models, idProductLine)
  }
 
  renderAdaptation(adaptation: Adaptation, idProductLine: number, idApplication: number, idAdaptation: number) {
    let treeItems = [];
    treeItems.push(this.renderAdaptationModels(adaptation.models, idProductLine, idApplication, idAdaptation));
    let treeItem = (
      <TreeItem icon="/images/treeView/application.png" label={adaptation.name} onAuxClick={(e) => this.updateAdaptationSelected(e, idProductLine, idApplication, idAdaptation)}>
        {treeItems}
      </TreeItem>
    );
    return treeItem;
  }

  renderApplication(application: Application, idProductLine: number, idApplication: number) {
    let treeItems = [];
    treeItems.push(this.renderApplicationModels(application.models, idProductLine, idApplication));
    let treeAdaptations = [];
    for (let idAdaptation = 0; idAdaptation < application.adaptations.length; idAdaptation++) {
      const adaptation = application.adaptations[idAdaptation];
      treeAdaptations.push(this.renderAdaptation(adaptation, idProductLine, idApplication, idAdaptation));
    }
    treeItems.push(
      <TreeItem key="AdaptationTreeItem" icon="/images/treeView/folder.png" label="Adaptations">
        {treeAdaptations}
      </TreeItem>
    )

    let icon="/images/treeView/application.png";
    for (let idModel = 0; idModel < application.models.length; idModel++) {
      const model: Model = application.models[idModel]; 
      if(model.inconsistent){
         icon="/images/treeView/applicationInconsistent.png";
      }
    }

    let treeItem = (
      <TreeItem icon={icon} label={application.name} onAuxClick={(e) => this.updateApplicationSelected(e, idProductLine, idApplication)}>
        {treeItems}
      </TreeItem>
    );
    return treeItem;
  }

  renderApplicationEngineering(productLine: ProductLine, idProductLine: number) {
    let treeItems = [];
    // treeItems.push(this.renderApplicationEngineeringModels(productLine.applicationEngineering.models, idProductLine))
    let treeApplications = [];
    for (let idApplication = 0; idApplication < productLine.applicationEngineering.applications.length; idApplication++) {
      const application = productLine.applicationEngineering.applications[idApplication];
      treeApplications.push(this.renderApplication(application, idProductLine, idApplication));
    }
    treeItems.push(
      <TreeItem key="ApplicationsTreeIteem" icon="/images/treeView/folder.png" label="Applications">
        {treeApplications}
      </TreeItem>
    )
    return treeItems;
  }

  renderProductLine(productLine: ProductLine, idProductLine: number) {
    return (
        <TreeItem
            icon="/images/treeView/productLine.png"
            label={productLine.name}
            onAuxClick={(e) => {
                this.updateLpSelected(e, idProductLine);
            }}
            onDoubleClick={(e) => {
                this.doubleClickLpSelected(e, idProductLine);
            }}>
            <TreeItem
                icon="/images/treeView/scope.png"
                label="Scope"
                dataKey="scope"
                onAuxClick={(e) => {
                    this.updateLpSelected(e, idProductLine);
                }}
            >
                {this.renderScope(productLine, idProductLine)}
            </TreeItem>
            <TreeItem
                icon="/images/treeView/domainEngineering.png"
                label="Domain engineering"
                dataKey="domainEngineering"
                onAuxClick={(e) => {
                    this.updateLpSelected(e, idProductLine);
                }}
            >
                {this.renderDomainEngineering(productLine, idProductLine)}
            </TreeItem>
            <TreeItem
                icon="/images/treeView/applicationEngineering.png"
                label="Application engineering"
                dataKey="applicationEngineering"
                onAuxClick={(e) => {
                    this.updateLpSelected(e, idProductLine);
                }}
            >
                {this.renderApplicationEngineering(productLine, idProductLine)}
            </TreeItem>
        </TreeItem>
    );
}

  

  renderProductLines() {
    let treeItems = []
    for (let idProductLine = 0; idProductLine < this.props.projectService.project.productLines.length; idProductLine++) {
      const productLine = this.props.projectService.project.productLines[idProductLine];
      treeItems.push(this.renderProductLine(productLine, idProductLine))
    }
    return treeItems;
  }

  renderProject() {
    let treeItem = (
      <TreeItem icon="/images/treeView/project.png" label={this.props.projectService.project.name}>
        {this.renderProductLines()}
      </TreeItem>
    )
    return (
      <div className="treeView">
        {treeItem}
      </div>
    )
  }

  renderTree() {
    return this.renderProject();
  }

  // Renderizar el indicador de estado de sincronización
  renderSyncStatusIndicator() {
    const { treeSyncStatus, treeSyncMessage } = this.state;

    // Solo mostrar cuando hay un mensaje que mostrar
    // No mostrar cuando está idle o cuando el mensaje está vacío
    if (treeSyncStatus === 'idle' || !treeSyncMessage) {
      return null;
    }

    const getStatusConfig = () => {
      switch (treeSyncStatus) {
        case 'connecting':
          return {
            icon: '🔄',
            color: '#ffc107',
            bgColor: '#fff3cd',
            borderColor: '#ffeaa7'
          };
        case 'syncing':
          return {
            icon: '⏳',
            color: '#17a2b8',
            bgColor: '#d1ecf1',
            borderColor: '#bee5eb'
          };
        case 'ready':
          return {
            icon: '✅',
            color: '#28a745',
            bgColor: '#d4edda',
            borderColor: '#c3e6cb'
          };
        case 'error':
          return {
            icon: '❌',
            color: '#dc3545',
            bgColor: '#f8d7da',
            borderColor: '#f5c6cb'
          };
        default:
          return {
            icon: '❓',
            color: '#6c757d',
            bgColor: '#e2e3e5',
            borderColor: '#d6d8db'
          };
      }
    };

    const config = getStatusConfig();

    return (
      <div
        style={{
          padding: '8px 12px',
          margin: '8px 12px',
          borderRadius: '6px',
          border: `1px solid ${config.borderColor}`,
          backgroundColor: config.bgColor,
          color: config.color,
          fontSize: '12px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: treeSyncStatus === 'connecting' || treeSyncStatus === 'syncing' ? 'pulse 1.5s infinite' : 'none'
        }}
      >
        <span style={{ fontSize: '14px' }}>{config.icon}</span>
        <span>{treeSyncMessage}</span>
      </div>
    );
  }

  render() {
    return (
      <div
        id="TreePannel"
        className="TreeExplorer pb-2 d-flex flex-column h-100"
        style={{ zIndex: 5 }}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        <NavBar projectService={this.props.projectService} />

        {/* Indicador de estado de sincronización */}
        {this.renderSyncStatusIndicator()}

        <div
          className="flex-grow-1 d-grid overflow-hidden"
          style={{ gridTemplateRows: "max-content 1fr" }}
        >
          <Tab.Container defaultActiveKey="project" id="uncontrolled-tab">
            <Nav variant="tabs" className="mb-2">
              <Nav.Item>
                <Nav.Link eventKey="project">Project</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="constraints">Constraints</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="queries">Queries</Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content className="overflow-auto d-flex flex-column">
              <Tab.Pane className="" eventKey="project">
                {this.renderTree()}
                <TreeMenu
                  projectService={this.props.projectService}
                  contextMenuX={this.state.contextMenuX}
                  contextMenuY={this.state.contextMenuY}
                  showContextMenu={this.state.showContextMenu}
                  onContextMenuHide={this.onContextMenuHide}
                />
              </Tab.Pane>

              <Tab.Pane className="px-2" eventKey="constraints">
                <p className="text-muted small w-100">
                  Specify any relationships or constraints that cannot be
                  graphically represented in your language using the CLIF
                  language.
                </p>

                <Editor
                  value={this.state.arbitraryConstraints}
                  onValueChange={this.setArbitraryConstraints}
                  highlight={(arbitraryConstraints) =>
                    highlight(arbitraryConstraints, languages.lisp, "lisp")
                  }
                  padding={10}
                  className="editor"
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 18,
                    backgroundColor: "#1e1e1e",
                    caretColor: "gray",
                    color: "gray",
                    borderRadius: "10px",
                    overflow: "auto",
                  }}
                />
              </Tab.Pane>

              <Tab.Pane className="" eventKey="queries">
                <QueryModal
                  handleCloseCallback={() => {}}
                  projectService={this.props.projectService}
                />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </div>

        {/* Panel de colaboración - al final del TreeExplorer */}
        <CollaborationPanel projectService={this.props.projectService} />

        {/* {this.state.showScopeModal && (
          <ScopeModal
          show={this.state.showScopeModal}
          initialScope={
            this.props.projectService.project.productLines[this.state.currentProductLineIndex].scope
          }
          domain={
            this.props.projectService.project.productLines[this.state.currentProductLineIndex].domain
          }
          onHide={() => this.setState({ showScopeModal: false })}
          onSave={(updatedScope: ScopeSPL) => {
            this.props.projectService.project.productLines[this.state.currentProductLineIndex].scope = updatedScope;
            const projectInfo = this.props.projectService.getProjectInformation();
            this.props.projectService.saveProjectInServer(
              projectInfo,
              (response) => {
                console.log("Proyecto guardado exitosamente:", response);
              },
              (error) => {
                console.error("Error guardando el proyecto:", error);
              }
            );
          }}
          
        />  
        )} */}
      </div>
      
    );
  }
}

export default TreeExplorer;
