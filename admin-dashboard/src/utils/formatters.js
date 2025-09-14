import { format, parseISO } from 'date-fns';

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    return 'Invalid Date';
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'MMM dd, yyyy HH:mm');
  } catch (error) {
    return 'Invalid Date';
  }
};

export const formatTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, 'HH:mm');
  } catch (error) {
    return 'Invalid Time';
  }
};

export const formatPhoneNumber = (phone) => {
  if (!phone) return 'N/A';
  // Format Indian phone numbers
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

export const formatWeight = (weight) => {
  if (weight === null || weight === undefined) return '0 kg';
  return `${weight} kg`;
};

export const formatStatus = (status) => {
  const statusMap = {
    pending: 'Pending',
    accepted: 'Accepted',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
    verified: 'Verified',
    unverified: 'Unverified',
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status) => {
  const colorMap = {
    pending: 'warning',
    accepted: 'info',
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'error',
    active: 'success',
    inactive: 'default',
    suspended: 'error',
    verified: 'success',
    unverified: 'warning',
  };
  return colorMap[status] || 'default';
};

export const formatAddress = (address) => {
  if (!address) return 'N/A';
  if (typeof address === 'string') {
    try {
      const parsed = JSON.parse(address);
      return `${parsed.street}, ${parsed.city}, ${parsed.state} ${parsed.pincode}`;
    } catch {
      return address;
    }
  }
  return `${address.street}, ${address.city}, ${address.state} ${address.pincode}`;
};

export const formatPercentage = (value, total) => {
  if (!total || total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
