import React from 'react';
import './CollaborativeIndicators.css';

interface UserAction {
  type: 'moving' | 'editing' | 'resizing' | 'selecting' | 'idle';
  cellId?: string;
  timestamp: string;
  details?: {
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    editType?: 'properties' | 'label' | 'geometry';
  };
}

interface CollaborativeUser {
  name: string;
  color: string;
  cursor?: { x: number; y: number };
  action?: UserAction;
  modelId?: string;
}

interface CollaborativeIndicatorsProps {
  users: CollaborativeUser[];
  currentUserId: string;
  currentUserName?: string;
  graph?: any; // mxGraph instance
}

const CollaborativeIndicators: React.FC<CollaborativeIndicatorsProps> = ({
  users,
  currentUserId,
  currentUserName,
  graph
}) => {
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'moving':
        return '🔄';
      case 'editing':
        return '✏️';
      case 'resizing':
        return '📏';
      case 'selecting':
        return '🎯';
      default:
        return '👤';
    }
  };

  const getActionText = (actionType: string, editType?: string) => {
    switch (actionType) {
      case 'moving':
        return 'Moviendo';
      case 'editing':
        return editType === 'properties' ? 'Editando propiedades' : 'Editando';
      case 'resizing':
        return 'Redimensionando';
      case 'selecting':
        return 'Seleccionando';
      default:
        return 'Activo';
    }
  };

  const findCellRecursively = (parent: any, targetCellId: string): any => {
    if (!parent || !graph) return null;

    const childCount = graph.getModel().getChildCount(parent);

    for (let i = 0; i < childCount; i++) {
      const cell = graph.getModel().getChildAt(parent, i);

      if (graph.getModel().isVertex(cell)) {
        if (cell.value && cell.value.attributes) {
          const uid = cell.value.getAttribute('uid');
          if (uid === targetCellId) {
            return cell;
          }
        }

        const found = findCellRecursively(cell, targetCellId);
        if (found) {
          return found;
        }
      }
    }

    return null;
  };

  const getCellPosition = (cellId: string) => {
    if (!graph || !cellId) return null;

    try {
      // Buscar la celda recursivamente en todos los niveles
      const cell = findCellRecursively(graph.getDefaultParent(), cellId);

      if (cell && cell.geometry) {
        // Para celdas anidadas, necesitamos calcular la posición absoluta
        let absoluteX = cell.geometry.x;
        let absoluteY = cell.geometry.y;

        // Obtener la posición absoluta considerando el padre
        let parent = cell.getParent();
        while (parent && parent !== graph.getDefaultParent()) {
          if (parent.geometry) {
            absoluteX += parent.geometry.x;
            absoluteY += parent.geometry.y;
          }
          parent = parent.getParent();
        }

        return {
          x: absoluteX,
          y: absoluteY,
          width: cell.geometry.width,
          height: cell.geometry.height
        };
      }
    } catch (error) {
      console.warn('Error getting cell position:', error);
    }

    return null;
  };

  const renderUserIndicator = (user: CollaborativeUser, index: number) => {
    // Los usuarios ya están filtrados en MxGEditor, no necesitamos filtrar aquí
    
    // Solo mostrar si el usuario tiene una acción activa y no está idle
    if (!user.action || user.action.type === 'idle' || !user.action.cellId) {
      return null;
    }

    const cellPosition = getCellPosition(user.action.cellId);
    if (!cellPosition) return null;

    const indicatorStyle: React.CSSProperties = {
      position: 'absolute',
      left: cellPosition.x - 5,
      top: cellPosition.y - 35,
      backgroundColor: user.color,
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      zIndex: 1000,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      animation: 'fadeInBounce 0.3s ease-out'
    };

    const cellBorderStyle: React.CSSProperties = {
      position: 'absolute',
      left: cellPosition.x - 2,
      top: cellPosition.y - 2,
      width: cellPosition.width + 4,
      height: cellPosition.height + 4,
      border: `2px solid ${user.color}`,
      borderRadius: '4px',
      pointerEvents: 'none',
      zIndex: 999,
      animation: 'pulse 2s infinite'
    };

    return (
      <React.Fragment key={`${user.name}-${index}`}>
        {/* Borde alrededor de la celda */}
        <div style={cellBorderStyle} />
        
        {/* Indicador con nombre y acción */}
        <div style={indicatorStyle}>
          <span>{getActionIcon(user.action.type)}</span>
          <span>{user.name}</span>
          <span>-</span>
          <span>{getActionText(user.action.type, user.action.details?.editType)}</span>
        </div>
      </React.Fragment>
    );
  };

  return (
    <div className="collaborative-indicators">
      {users.map((user, index) => renderUserIndicator(user, index))}
    </div>
  );
};

export default CollaborativeIndicators;
