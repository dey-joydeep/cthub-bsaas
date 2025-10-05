import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { authGuard } from './auth.guard';
import { CurrentUserService } from '../services/current-user.service';

class MockRouter {
  navigate = jasmine.createSpy('navigate');
  createUrlTree = (commands: any[]) =>
    ({
      toString: () => commands.join('/'),
    }) as UrlTree;
  parseUrl = (url: string) => url;
}

describe('AuthGuard', () => {
  let currentUserService: CurrentUserService;
  let router: MockRouter;
  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/test' } as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CurrentUserService, { provide: Router, useClass: MockRouter }],
    });

    currentUserService = TestBed.inject(CurrentUserService);
    router = TestBed.inject(Router) as any;
  });

  it('should allow activation if user is authenticated', (done) => {
    // Mock the currentUser$ observable to emit a user
    spyOn(currentUserService, 'currentUser$').and.returnValue(of({ id: '1', email: 'test@example.com' } as any));

    const result = authGuard(mockRoute, mockState);

    if (result === true) {
      expect(result).toBeTrue();
      done();
    } else if (result instanceof Promise) {
      result.then((res) => {
        expect(res).toBeTrue();
        done();
      });
    } else if (result instanceof Observable) {
      (result as Observable<boolean | UrlTree>).subscribe((res) => {
        if (typeof res === 'boolean') {
          expect(res).toBeTrue();
        } else {
          fail('Expected boolean true but got UrlTree');
        }
        done();
      });
    } else {
      fail('Unexpected return type from authGuard');
      done();
    }
  });

  it('should redirect to /auth/login if user is not authenticated', (done) => {
    // Mock the currentUser$ observable to emit null (not authenticated)
    spyOn(currentUserService, 'currentUser$').and.returnValue(of(null));

    const result = authGuard(mockRoute, mockState);

    if (result === false) {
      fail('Expected UrlTree but got boolean false');
      done();
    } else if (result instanceof Promise) {
      result.then((res) => {
        if (typeof res === 'boolean') {
          fail('Expected UrlTree but got boolean');
        } else {
          expect(res.toString()).toContain('auth/login');
        }
        done();
      });
    } else if (result instanceof Observable) {
      (result as Observable<boolean | UrlTree>).subscribe((res) => {
        if (typeof res === 'boolean') {
          fail('Expected UrlTree but got boolean');
        } else {
          expect(res.toString()).toContain('auth/login');
        }
        done();
      });
    } else if (result instanceof UrlTree) {
      expect(result.toString()).toContain('auth/login');
      done();
    } else {
      fail('Unexpected return type from authGuard');
      done();
    }
  });
});
