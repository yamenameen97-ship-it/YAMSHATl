import React from 'react';
import PropTypes from 'prop-types';
import { tokens } from '../../styles/designTokens';
import RetryButton from './RetryButton';

/**
 * ErrorState Component
 * Displays a user-friendly error message with an optional retry action
 */
const ErrorState = ({ 
  message = 'حدث خطأ ما، يرجى المحاولة مرة أخرى.', 
  onRetry, 
  errorDetails 
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: tokens.spacing.xl,
      textAlign: 'center',
      minHeight: '200px'
    }}>
      <div style={{ 
        color: tokens.colors.error, 
        fontSize: '2.5rem', 
        marginBottom: tokens.spacing.md 
      }}>
        ⚠️
      </div>
      <h4 style={{ 
        fontSize: tokens.typography.sizes.lg, 
        fontWeight: tokens.typography.weights.medium,
        color: tokens.colors.text.primary,
        marginBottom: tokens.spacing.sm
      }}>
        {message}
      </h4>
      {errorDetails && (
        <p style={{ 
          fontSize: tokens.typography.sizes.sm, 
          color: tokens.colors.text.muted,
          marginBottom: tokens.spacing.md,
          fontFamily: 'monospace'
        }}>
          {errorDetails}
        </p>
      )}
      {onRetry && (
        <RetryButton onClick={onRetry} />
      )}
    </div>
  );
};

ErrorState.propTypes = {
  message: PropTypes.string,
  onRetry: PropTypes.func,
  errorDetails: PropTypes.string,
};

export default ErrorState;
