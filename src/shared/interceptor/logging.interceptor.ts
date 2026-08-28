import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name)
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // const req = context.switchToHttp().getRequest()

    // this.logger.log('Before...')
    // this.logger.log('🚀 ~ LoggingInterceptor ~ Request:', {
    //   method: req.method,
    //   url: req.url,
    //   body: req.body,
    // })

    const now = Date.now()
    return next.handle().pipe(
      tap((value: any) => {
        // this.logger.log(`After... ${Date.now() - now}ms`)
        // this.logger.log('🚀 ~ LoggingInterceptor ~ Response:', value)
        this.logger.log({
          body: value,
        })
      }),
    )
  }
}
