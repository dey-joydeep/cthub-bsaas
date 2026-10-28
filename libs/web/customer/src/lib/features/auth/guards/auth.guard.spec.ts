import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { of, isObservable, firstValueFrom } from 'rxjs';
import { authGuard, CurrentUserService, CURRENT_USER } from '@cthub-bsaas/web-core-auth';

class MockRouter {
  navigate = vi.fn();
  createUrlTree = (commands: any[]) => {
    const tree = Object.create(UrlTree.prototype);
    tree.toString = () => commands.join('/');
    return tree;
  };
  parseUrl = (url: string) => url;
}

class MockCurrentUserService {
  currentUser$ = of(null);
  redirectUrl: string | null = null;
}

describe('AuthGuard', () => {
  let currentUserService: MockCurrentUserService;
  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/test' } as RouterStateSnapshot;

  beforeEach(() => {
    const mockService = new MockCurrentUserService();
    TestBed.configureTestingModule({
      providers: [
        { provide: CurrentUserService, useValue: mockService },
        { provide: CURRENT_USER, useValue: mockService },
        { provide: Router, useClass: MockRouter },
      ],
    });

    currentUserService = TestBed.inject(CurrentUserService) as unknown as MockCurrentUserService;
  });

  it('should allow activation if user is authenticated', async () => {
    currentUserService.currentUser$ = of({ id: '1', email: 'test@example.com' } as any);

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    let resolved: boolean | UrlTree;
    if (isObservable(result)) {
      resolved = await firstValueFrom(result);
    } else if (result instanceof Promise) {
      resolved = await result;
    } else {
      resolved = result;
    }

    expect(resolved).toBe(true);
  });

  it('should redirect to /auth/login if user is not authenticated', async () => {
    currentUserService.currentUser$ = of(null);

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));

    let resolved: boolean | UrlTree;
    if (isObservable(result)) {
      resolved = await firstValueFrom(result);
    } else if (result instanceof Promise) {
      resolved = await result;
    } else {
      resolved = result;
    }

    expect(resolved instanceof UrlTree).toBe(true);
    expect(resolved.toString()).toContain('auth/login');
  });
});
