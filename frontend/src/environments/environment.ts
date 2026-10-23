import { AppEnvironment } from './environment.model';

// Hasta que exista un entorno desplegado, el build por defecto apunta al entorno local.
export const environment: AppEnvironment = {
  auth: {
    issuer: 'http://localhost:8081/realms/hris',
    clientId: 'hris-frontend',
  },
  apiUrl: 'http://localhost:8080/api',
};
