import { toast as reactToast } from 'react-toastify';

// Export the toast functions directly
export const toast = reactToast;

// You can also create custom toast functions if needed
export const showSuccessToast = (message: string) => {
  return reactToast.success(message);
};

export const showErrorToast = (message: string) => {
  return reactToast.error(message);
};

export const showInfoToast = (message: string) => {
  return reactToast.info(message);
};

export const showWarningToast = (message: string) => {
  return reactToast.warning(message);
}; 