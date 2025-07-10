import React from 'react';
import { CatalogUserAwareness } from '../../DataProvider/Services/collab/catalogAwarenessService';

interface CatalogAwarenessIndicatorProps {
  productId: string;
  productName: string;
  users: CatalogUserAwareness[];
  children: React.ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Componente que envuelve un producto y muestra indicadores de awareness colaborativo
 */
const CatalogAwarenessIndicator: React.FC<CatalogAwarenessIndicatorProps> = ({
  productId,
  productName,
  users,
  children,
  onMouseEnter,
  onMouseLeave,
  onClick,
  className = '',
  style = {}
}) => {
  // Encontrar usuarios que están interactuando con este producto
  const usersOnThisProduct = users.filter(user =>
    user.action?.productId === productId &&
    (user.action?.type === 'viewing' || user.action?.type === 'editing')
  );

  // Determinar el color del borde basado en los usuarios presentes
  const getBorderStyle = (): React.CSSProperties => {
    if (usersOnThisProduct.length === 0) {
      return {};
    }

    // Si hay un usuario, usar su color
    if (usersOnThisProduct.length === 1) {
      return {
        border: `3px solid ${usersOnThisProduct[0].color}`,
        borderRadius: '8px',
        boxShadow: `0 0 10px ${usersOnThisProduct[0].color}40`
      };
    }

    // Si hay múltiples usuarios, crear un borde degradado
    const colors = usersOnThisProduct.map(user => user.color);
    const gradientColors = colors.join(', ');
    
    return {
      border: '3px solid transparent',
      borderRadius: '8px',
      background: `linear-gradient(white, white) padding-box, linear-gradient(45deg, ${gradientColors}) border-box`,
      boxShadow: `0 0 15px rgba(0,0,0,0.2)`
    };
  };

  // Obtener el texto del indicador
  const getIndicatorText = (): string => {
    if (usersOnThisProduct.length === 0) return '';

    if (usersOnThisProduct.length === 1) {
      return usersOnThisProduct[0].name;
    }

    const names = usersOnThisProduct.map(user => user.name);
    if (names.length === 2) {
      return `${names[0]}, ${names[1]}`;
    }

    return `${names[0]} +${names.length - 1}`;
  };

  // Obtener el color del texto del indicador
  const getIndicatorColor = (): string => {
    if (usersOnThisProduct.length === 0) return '#6c757d';
    return usersOnThisProduct[0].color;
  };

  const handleMouseEnter = () => {
    if (onMouseEnter) {
      onMouseEnter();
    }
  };

  const handleMouseLeave = () => {
    if (onMouseLeave) {
      onMouseLeave();
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    transition: 'all 0.3s ease',
    cursor: onClick ? 'pointer' : 'default',
    ...getBorderStyle(),
    ...style
  };

  const indicatorStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-8px',
    left: '8px',
    backgroundColor: getIndicatorColor(),
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    zIndex: 10,
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    opacity: usersOnThisProduct.length > 0 ? 1 : 0,
    transform: usersOnThisProduct.length > 0 ? 'translateY(0)' : 'translateY(-10px)',
    transition: 'all 0.3s ease'
  };

  return (
    <div
      className={`catalog-awareness-indicator ${className}`}
      style={containerStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Indicador de usuario */}
      {usersOnThisProduct.length > 0 && (
        <div style={indicatorStyle}>
          {getIndicatorText()}
        </div>
      )}
      
      {/* Contenido del producto */}
      {children}
    </div>
  );
};

export default CatalogAwarenessIndicator;
