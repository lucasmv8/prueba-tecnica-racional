import { AppError } from './app-error'

export class BusinessError extends AppError {
  constructor(message: string) {
    super(message, 400, 'BUSINESS_ERROR')
    this.name = 'BusinessError'
    Object.setPrototypeOf(this, BusinessError.prototype)
  }
}
