import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { provideFakeAuth, testUser } from '../../../testing/auth';
import { requireRole } from './require-role';

describe('requireRole', () => {
  function run(roles: Parameters<typeof requireRole>, user = testUser('x', 'colaborador')) {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideFakeAuth(user)] });
    return TestBed.runInInjectionContext(() => requireRole(...roles)({} as never, {} as never)) as
      boolean | UrlTree;
  }

  it('deja pasar con alguno de los roles', () => {
    expect(run(['people-talent', 'direccion'], testUser('d', 'direccion'))).toBe(true);
  });

  it('redirige a /sin-acceso sin ninguno de los roles', () => {
    const result = run(['people-talent']);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/sin-acceso');
  });

  it('redirige sin usuario', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideFakeAuth(null)] });
    const result = TestBed.runInInjectionContext(() =>
      requireRole('people-talent')({} as never, {} as never),
    );
    expect(result).toBeInstanceOf(UrlTree);
  });
});
