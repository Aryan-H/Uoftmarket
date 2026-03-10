
// Import and re-export sonner toast
import { toast } from "sonner";

// Configure default toast helpers using correct properties
// The issue was using 'type' which doesn't exist in ExternalToast interface
// toast.success = (title, options) => toast.success(title, options);
// toast.error = (title, options) => toast.error(title, options);
// toast.info = (title, options) => toast.info(title, options);
// toast.warning = (title, options) => toast.warning(title, options);

// Safari compatibility - make sure toasts are properly visible and clickable
if (typeof window !== 'undefined' && window.isSafari) {
  // For Safari, ensure toast container has proper z-index and positioning
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const toastContainers = document.querySelectorAll('[data-sonner-toaster]');
      toastContainers.forEach((container) => {
        if (container instanceof HTMLElement) {
          container.style.zIndex = '9999';
        }
      });
    }, 500);
  });
}

// Re-export the toast function
export { toast };
