export const environment = {
  production: false,
  apiUrl: typeof window !== 'undefined' && !window.location.origin.includes('localhost')
    ? window.location.origin
    : 'http://localhost:3001'
};
