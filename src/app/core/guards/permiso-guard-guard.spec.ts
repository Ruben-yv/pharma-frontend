import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';
import { permisoGuardGuard } from './permiso-guard';

describe('permisoGuardGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => permisoGuardGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
