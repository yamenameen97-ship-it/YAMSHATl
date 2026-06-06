import React from 'react';
import PropTypes from 'prop-types';
import { tokens } from '../../styles/designTokens';

/**
 * EmptyState Component
 * Used when there is no data to display
 */
const EmptyState = ({ 
  title = 'لا توجد بيانات', 
  description = 'لم نتمكن من العثور على أي محتوى هنا حالياً.', 
  icon, 
  action 
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: tokens.spacing['2xl'],
      textAlign: 'center',
      backgroundColor: tokens.colors.surface,
      borderRadius: tokens.borderRadius.lg,
      border: `1px dashed ${tokens.colors.secondary[500]}22`,
      margin: tokens.spacing.md
    }}>
      {icon && (
        <div style={{ 
          fontSize: '3rem', 
          marginBottom: tokens.spacing.md,
          color: tokens.colors.secondary[500]
        }}>
          {icon}
        </div>
      )}
      <h3 style={{ 
        fontSize: tokens.typography.sizes.xl, 
        fontWeight: tokens.typography.weights.semibold,
        color: tokens.colors.text.primary,
        marginBottom: tokens.spacing.xs
      }}>
        {title}
      </h3>
      <p style={{ 
        fontSize: tokens.typography.sizes.base,
        color: tokens.colors.text.secondary,
        maxWidth: '300px',
        marginBottom: action ? tokens.spacing.lg : 0
      }}>
        {description}
      </p>
      {action && (
        <div className="empty-state-action">
          {action}
        </div>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  icon: PropTypes.node,
  action: PropTypes.node,
};

export default EmptyState;
