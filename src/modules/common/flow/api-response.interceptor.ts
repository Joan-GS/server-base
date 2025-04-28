import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                if (data?.success === false) {
                    return {
                        ...data,
                        code: data?.code || 400,
                    };
                }

                return {
                    success: true,
                    message: data?.message || 'Operation successful',
                    data: data?.result || data,
                    code: data?.code || 200,
                };
            })
        );
    }
}
