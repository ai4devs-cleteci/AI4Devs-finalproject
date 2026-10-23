import { AppEnvironment } from './environment.model';

/** Entorno local levantado con `docker compose up -d` (Keycloak en el puerto 8081). */
export const environment: AppEnvironment = {
  auth: {
    issuer: 'http://localhost:8081/realms/hris',
    clientId: 'hris-frontend',
  },
  apiUrl: 'http://localhost:8080/api',
};
