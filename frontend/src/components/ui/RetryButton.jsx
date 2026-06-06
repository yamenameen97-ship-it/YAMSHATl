import React from 'react';
import PropTypes from 'prop-types';
import { tokens } from '../../styles/designTokens';

/**
 * RetryButton Component
 * Standardized button for retrying failed operations
 */
const RetryButton = ({ onClick, label = 'إعادة المحاولة', isLoading = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: tokens.spacing.sm,
        padding: `${tokens.spacing.sm} ${tokens.spacing.lg}`,
        backgroundColor: tokens.colors.primary[600],
        color: '#ffffff',
        border: 'none',
        borderRadius: tokens.borderRadius.md,
        fontSize: tokens.typography.sizes.sm,
        fontWeight: tokens.typography.weights.medium,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: tokens.animations.transitions.fast,
        opacity: isLoading ? 0.7 : 1,
      }}
      onMouseOver={(e) => !isLoading && (e.currentTarget.style.backgroundColor = tokens.colors.primary[700])}
      onMouseOut={(e) => !isLoading && (e.currentTarget.style.backgroundColor = tokens.colors.primary[600])}
    >
      {isLoading ? (
        <span className="animate-spin">⏳</span>
      ) : (
        <span>🔄</span>
      )}
      {label}
    </button>
  );
};

RetryButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  label: PropTypes.string,
  isLoading: PropTypes.bool,
};

export default RetryButton;
