import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {catchError, Observable, of} from 'rxjs';
import {Router} from '@angular/router';
import {AuthService} from '../../services/auth/auth.service';
import {ModalService} from '../../services/modal/modal.service';

@Injectable()
/**
 * Error interceptor intended to take appropriate UI action upon error HTTP status codes.
 */
export class ErrorInterceptor implements HttpInterceptor {
  private isLoggedIn: boolean = false;

  /**
   * Standard constructor.
   * @param {Router} router
   * @param {AuthService} authService
   * @param {ModalService} modalService
   */
  constructor(
    private router: Router,
    private authService: AuthService,
    private modalService: ModalService,
  ) {
    this.authService.getIsLoggedIn()
        .subscribe((isLoggedIn) => {
          this.isLoggedIn = isLoggedIn;
        });
  }

  /**
   * Main intercept method.
   * @param {HttpRequest} request to be intercepted
   * @param {HttpHandler} next to be handled
   * @return {Observable} interception
   */
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next
        .handle(request)
        .pipe(catchError((err) => this.handleAuthError(err)));
  }

  /**
   * Helper function used to handle HTTP error responses.
   * @param {HttpErrorResponse} error which is to be handled
   * @private only used within the error interceptor class
   * @return {Observable} unused return value
   */
  private handleAuthError(error: HttpErrorResponse): Observable<any> {
    if (error.status === 400) {
      if (error.error.status) {
        this.modalService.showModal('Request Error', `Status: ${error.error.status}`);
      } else {
        this.modalService.showModal('Request Error', `${error.error.errors[0].param}: ${error.error.errors[0].msg}`);
      }
    }

    if (error.status === 401) {
      this.modalService.showModal(
          'Authentication Error',
          'Invalid username or password',
      );
      this.authService.logout(false);
      return of(error.message);
    }

    if (error.status === 403) {
      this.modalService.showModal(
          'Authorization Error',
          'Access to that resource is denied',
      );
      this.router.navigate(['/error/forbidden']).then((_) => {
      });
    }

    if (error.status === 404) {
      this.router.navigate(['/error/not-found']).then((_) => {
      });
    }

    if (error.status === 409) {
      this.modalService.showModal('Request Error', 'Entity already exists');
    }

    if (error.status === 500) {
      this.modalService.showModal('Request Error', 'A server error has occurred');
    }
    throw error;
  }
}
