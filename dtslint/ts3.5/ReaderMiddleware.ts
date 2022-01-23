import { pipe } from 'fp-ts/function'
import * as M from '../../src/Middleware'
import * as _ from '../../src/ReaderMiddleware'

interface R1 {
  r1: string
}

interface R2 {
  r2: string
}

declare const middleware1: _.ReaderMiddleware<R1, 'one', 'one', number, boolean>
declare const middleware2a: _.ReaderMiddleware<R1, 'one', 'two', number, string>
declare const middleware2b: _.ReaderMiddleware<R2, 'one', 'two', Error, string>
declare const middleware3: _.ReaderMiddleware<R1, 'two', 'three', number, string>
declare const middleware4a: M.Middleware<'one', 'one', number, boolean>
declare const middleware4b: M.Middleware<'one', 'one', Error, string>
declare const middleware5: M.Middleware<'one', 'two', number, string>

//
// ichainFirst
//

// $ExpectType ReaderMiddleware<R1, "one", "two", number, boolean>
pipe(
  middleware1,
  _.ichainFirst((_: boolean) => middleware2a)
)

pipe(
  middleware1,
  _.ichainFirst(() => middleware2b) // $ExpectError
)

pipe(
  middleware1,
  _.ichainFirst(() => middleware3) // $ExpectError
)

//
// ichainFirstW
//

// $ExpectType ReaderMiddleware<R1, "one", "two", number, boolean>
pipe(
  middleware1,
  _.ichainFirstW((_: boolean) => middleware2a)
)

// $ExpectType ReaderMiddleware<R1 & R2, "one", "two", number | Error, boolean>
pipe(
  middleware1,
  _.ichainFirstW(() => middleware2b)
)

pipe(
  middleware1,
  _.ichainFirstW(() => middleware3) // $ExpectError
)

//
// orElseMiddlewareK
//

// $ExpectType ReaderMiddleware<R1, "one", "one", number, boolean>
pipe(
  middleware1,
  _.orElseMiddlewareK((_: number) => middleware4a)
)

pipe(
  middleware1,
  _.orElseMiddlewareK(() => middleware4b) // $ExpectError
)

pipe(
  middleware1,
  _.orElseMiddlewareK(() => middleware5) // $ExpectError
)

//
// orElseMiddlewareKW
//

// $ExpectType ReaderMiddleware<R1, "one", "one", number, boolean>
pipe(
  middleware1,
  _.orElseMiddlewareKW((_: number) => middleware4a)
)

// $ExpectType ReaderMiddleware<R1, "one", "one", Error, string | boolean>
pipe(
  middleware1,
  _.orElseMiddlewareKW(() => middleware4b)
)

pipe(
  middleware1,
  _.orElseMiddlewareKW(() => middleware5) // $ExpectError
)
