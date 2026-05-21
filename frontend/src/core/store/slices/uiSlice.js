/**
 * UI State Slice
 * 
 * Manages:
 * - Modal and sidebar states
 * - Loading and error states
 * - UI preferences
 */

export default function uiSlice(set, get) {
  return {
    // State
    isModalOpen: false,
    modalType: null,
    modalData: null,
    isSidebarOpen: true,
    isLoading: false,
    error: null,
    success: null,
    toasts: [],
    activeToastId: null,

    // Modal Actions
    openModal: (type, data = null) => {
      set((state) => ({
        ...state,
        isModalOpen: true,
        modalType: type,
        modalData: data,
      }));
    },

    closeModal: () => {
      set((state) => ({
        ...state,
        isModalOpen: false,
        modalType: null,
        modalData: null,
      }));
    },

    updateModalData: (data) => {
      set((state) => ({
        ...state,
        modalData: {
          ...state.modalData,
          ...data,
        },
      }));
    },

    // Sidebar Actions
    toggleSidebar: () => {
      set((state) => ({
        ...state,
        isSidebarOpen: !state.isSidebarOpen,
      }));
    },

    setSidebarOpen: (isOpen) => {
      set((state) => ({
        ...state,
        isSidebarOpen: isOpen,
      }));
    },

    // Loading Actions
    setLoading: (isLoading) => {
      set((state) => ({
        ...state,
        isLoading,
      }));
    },

    // Error Actions
    setError: (error) => {
      set((state) => ({
        ...state,
        error,
      }));
    },

    clearError: () => {
      set((state) => ({
        ...state,
        error: null,
      }));
    },

    // Success Actions
    setSuccess: (message) => {
      set((state) => ({
        ...state,
        success: message,
      }));
    },

    clearSuccess: () => {
      set((state) => ({
        ...state,
        success: null,
      }));
    },

    // Toast Actions
    addToast: (toast) => {
      const id = `toast_${Date.now()}_${Math.random()}`;
      const newToast = {
        id,
        timestamp: Date.now(),
        duration: 3000,
        ...toast,
      };

      set((state) => ({
        ...state,
        toasts: [...state.toasts, newToast],
        activeToastId: id,
      }));

      // Auto-remove toast after duration
      if (newToast.duration > 0) {
        setTimeout(() => {
          get().removeToast(id);
        }, newToast.duration);
      }

      return id;
    },

    removeToast: (toastId) => {
      set((state) => ({
        ...state,
        toasts: state.toasts.filter(t => t.id !== toastId),
        activeToastId: state.activeToastId === toastId ? null : state.activeToastId,
      }));
    },

    clearToasts: () => {
      set((state) => ({
        ...state,
        toasts: [],
        activeToastId: null,
      }));
    },

    // Utility Methods
    showSuccessToast: (message, duration = 3000) => {
      return get().addToast({
        type: 'success',
        message,
        duration,
      });
    },

    showErrorToast: (message, duration = 5000) => {
      return get().addToast({
        type: 'error',
        message,
        duration,
      });
    },

    showWarningToast: (message, duration = 4000) => {
      return get().addToast({
        type: 'warning',
        message,
        duration,
      });
    },

    showInfoToast: (message, duration = 3000) => {
      return get().addToast({
        type: 'info',
        message,
        duration,
      });
    },

    // Selectors
    getActiveModal: () => {
      const state = get();
      return state.isModalOpen ? { type: state.modalType, data: state.modalData } : null;
    },

    getRecentToasts: (limit = 5) => {
      return get().toasts.slice(-limit);
    },

    hasError: () => {
      return !!get().error;
    },

    hasSuccess: () => {
      return !!get().success;
    },

    getUIState: () => {
      const state = get();
      return {
        isModalOpen: state.isModalOpen,
        isSidebarOpen: state.isSidebarOpen,
        isLoading: state.isLoading,
        hasError: state.hasError(),
        hasSuccess: state.hasSuccess(),
        toastCount: state.toasts.length,
      };
    },
  };
}
