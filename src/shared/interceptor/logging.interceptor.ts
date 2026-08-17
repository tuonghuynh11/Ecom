import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest()

    console.info('\x1b[36m%s\x1b[0m', 'Before...')
    console.info('\x1b[33m%s\x1b[0m', '🚀 ~ LoggingInterceptor ~ Request:', {
      method: req.method,
      url: req.url,
      body: req.body,
    })

    const now = Date.now()
    return next.handle().pipe(
      tap((value: any) => {
        console.info('\x1b[32m%s\x1b[0m', `After... ${Date.now() - now}ms`)
        console.info('\x1b[35m%s\x1b[0m', '🚀 ~ LoggingInterceptor ~ Response:', value)
      }),
    )
  }
}
