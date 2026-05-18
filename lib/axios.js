import axios from 'axios';

function makeErrorInterceptor(instance) {
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Une erreur inattendue est survenue.';
      return Promise.reject(new Error(message));
    }
  );
  return instance;
}

// Client standard pour dashboard / planning / reminders
const apiClient = makeErrorInterceptor(
  axios.create({
    baseURL: '/api',
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
  })
);

// Client dédié à la synchronisation — timeout élevé car les batch peuvent
// prendre plusieurs minutes selon le nombre de sessions et créneaux Digiforma
export const syncApiClient = makeErrorInterceptor(
  axios.create({
    baseURL: '/api',
    timeout: 600000, // 10 minutes max côté client
    headers: { 'Content-Type': 'application/json' },
  })
);

export default apiClient;
