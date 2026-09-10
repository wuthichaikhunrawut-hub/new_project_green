export const environment = {
  production: false,
  apiUrl:
    typeof window !== 'undefined' && !window.location.origin.includes('localhost')
      ? `${window.location.origin}/api`
      : 'http://localhost:3001',
};
