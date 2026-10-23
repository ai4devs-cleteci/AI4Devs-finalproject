import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import Keycloak from 'keycloak-js';
import {
  apiUrlPattern,
  assertIssuerReachable,
  keycloakConfigFromIssuer,
  provideBearerToken,
} from './auth.config';

describe('keycloakConfigFromIssuer', () => {
  it('separa la URL de Keycloak y el realm', () => {
    expect(keycloakConfigFromIssuer('http://localhost:8081/realms/hris', 'hris-frontend')).toEqual({
      url: 'http://localhost:8081',
      realm: 'hris',
      clientId: 'hris-frontend',
    });
  });

  it('admite barra final y Keycloak bajo una ruta', () => {
    expect(keycloakConfigFromIssuer('https://sso.example.com/auth/realms/hris/', 'app')).toEqual({
      url: 'https://sso.example.com/auth',
      realm: 'hris',
      clientId: 'app',
    });
  });

  it('rechaza un issuer sin realm', () => {
    expect(() => keycloakConfigFromIssuer('http://localhost:8081', 'app')).toThrowError(
      /Issuer de Keycloak no válido/,
    );
  });
});

describe('apiUrlPattern', () => {
  const pattern = apiUrlPattern('http://localhost:8080/api');

  it('coincide con la API y sus subrutas', () => {
    expect(pattern.test('http://localhost:8080/api')).toBe(true);
    expect(pattern.test('http://localhost:8080/api/colaboradores')).toBe(true);
    expect(pattern.test('http://localhost:8080/api?page=1')).toBe(true);
  });

  it('no coincide con otros orígenes ni prefijos más largos', () => {
    expect(pattern.test('http://localhost:8080/apix')).toBe(false);
    expect(pattern.test('https://example.com/api')).toBe(false);
    expect(pattern.test('http://evil.test/?u=http://localhost:8080/api')).toBe(false);
  });
});

describe('provideBearerToken', () => {
  const apiUrl = 'http://localhost:8080/api';
  let http: HttpClient;
  let backend: HttpTestingController;
  let keycloak: { authenticated: boolean; token: string; updateToken: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    keycloak = { authenticated: true, token: 'token-vigente', updateToken: vi.fn() };
    keycloak.updateToken.mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideBearerToken(apiUrl),
        provideHttpClientTesting(),
        { provide: Keycloak, useValue: keycloak },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('añade el token, renovado antes, a las peticiones a la API', async () => {
    http.get(`${apiUrl}/colaboradores`).subscribe();

    const request = await vi.waitFor(() => backend.expectOne(`${apiUrl}/colaboradores`));
    expect(keycloak.updateToken).toHaveBeenCalled();
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-vigente');
    request.flush([]);
  });

  it('no envía el token a otros orígenes', () => {
    http.get('https://example.com/datos').subscribe();

    const request = backend.expectOne('https://example.com/datos');
    expect(request.request.headers.has('Authorization')).toBe(false);
    expect(keycloak.updateToken).not.toHaveBeenCalled();
    request.flush({});
  });
});

describe('assertIssuerReachable', () => {
  const issuer = 'http://localhost:8081/realms/hris';

  afterEach(() => vi.unstubAllGlobals());

  it('consulta el documento de descubrimiento del issuer', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await assertIssuerReachable(`${issuer}/`);

    expect(fetchMock).toHaveBeenCalledWith(`${issuer}/.well-known/openid-configuration`, {
      credentials: 'omit',
    });
  });

  it('falla si el proveedor no responde', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(assertIssuerReachable(issuer)).rejects.toThrowError(
      /No se pudo contactar con el proveedor de identidad/,
    );
  });

  it('falla si el realm no existe', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));

    await expect(assertIssuerReachable(issuer)).rejects.toThrowError(/respondió 404/);
  });
});
