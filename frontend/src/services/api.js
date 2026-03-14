const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://locked-in-vert.vercel.app';

export const apiUrl = (path) => `${API_BASE}${path}`;

export default API_BASE;
