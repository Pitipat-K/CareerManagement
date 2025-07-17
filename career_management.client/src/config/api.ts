// Centralized API base URL configuration
// Usage: fetch(getApiUrl('employees')) or fetch(getApiUrl(`employees/${id}`))

export const API_BASE_URL = import.meta.env.DEV
  ? 'https://localhost:7026/api'
  : 'https://altapi.alliancels.net:44304/api';

export function getApiUrl(path: string) {
  // Remove leading slash if present
  return `${API_BASE_URL}/${path.replace(/^\//, '')}`;
} 