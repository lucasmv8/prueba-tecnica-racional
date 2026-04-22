type Ok<T> = { success: true; value: T }
type Err<E> = { success: false; error: E }

export type Result<T, E = Error> = Ok<T> | Err<E>

export const Result = {
  ok<T>(value: T): Ok<T> {
    return { success: true, value }
  },
  err<E>(error: E): Err<E> {
    return { success: false, error }
  },
}
