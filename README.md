A partial porting of https://github.com/owickstrom/hyper to TypeScript

`hyper-ts` is an experimental middleware architecture for HTTP servers written in TypeScript.

Its main focus is correctness and type-safety, using type-level information to enforce correct composition and
abstraction for web servers.

# Goals

The goal of `hyper-ts` is to make use of type system features in TypeScript to enforce correctly stacked middleware in
HTTP server applications. All effects of middleware should be reflected in the types to ensure that common mistakes
cannot be made. A few examples of such mistakes could be:

- Incorrect ordering of header and body writing
- Writing incomplete responses
- Writing multiple responses
- Trying to consume a non-parsed request body
- Consuming a request body parsed as the wrong type
- Incorrect ordering of, or missing, error handling middleware
- Incorrect ordering of middleware for sessions, authentication, authorization
- Missing authentication and/or authorization checks

# TypeScript compatibility

The stable version is tested against TypeScript 3.1.6, but should run with TypeScript 3.0.1+ too

# Core API

## Conn

A `Conn`, short for "connection", models the entirety of a connection between the HTTP server and the user agent, both
request and response.

State changes are tracked by the phantom type `S`.

```ts
interface Conn<S> {
  readonly _S: S
  clearCookie: (name: string, options: CookieOptions) => void
  endResponse: () => void
  getBody: () => unknown
  getHeader: (name: string) => unknown
  getParams: () => unknown
  getQuery: () => unknown
  setBody: (body: unknown) => void
  setCookie: (name: string, value: string, options: CookieOptions) => void
  setHeader: (name: string, value: string) => void
  setStatus: (status: Status) => void
}
```

## Middleware

A middleware is an indexed monadic action transforming one `Conn` to another `Conn`. It operates in the `TaskEither` monad,
and is indexed by `I` and `O`, the input and output `Conn` types of the middleware action.

```ts
class Middleware<I, O, L, A> {
  constructor(readonly run: (c: Conn<I>) => TaskEither<L, [A, Conn<O>]>) {}
  ...
}
```

The input and output type parameters are used to ensure that a `Conn` is transformed, and that side-effects are
performed, correctly, throughout the middleware chain.

Middlewares are composed using `ichain`, the indexed monadic version of `chain`.

# Hello world

```ts
import * as express from 'express'
import { Status, status } from 'hyper-ts'
import { fromMiddleware } from 'hyper-ts/lib/toExpressRequestHandler'

const hello = status<never>(Status.OK)
  .closeHeaders()
  .send('Hello hyper-ts!')

express()
  .get('/', fromMiddleware(hello))
  .listen(3000, () => console.log('Express listening on port 3000. Use: GET /'))
```

## Type safety

Invalid operations are prevented statically

```ts
import { headers, Status, status } from 'hyper-ts'

status(Status.OK)
  .closeHeaders()
  .send('Hello hyper-ts!')
  // try to write a header after sending the body
  .ichain(() => headers({ field: 'value' })) // error: Type '"ResponseEnded"' is not assignable to type '"HeadersOpen"'
```

No more `"Can't set headers after they are sent."` errors.

# Validating params, query and body

Validations leverage [io-ts](https://github.com/gcanti/io-ts) types

```ts
import { param, params, query, body } from 'hyper-ts/lib/MiddlewareTask'
import * as t from 'io-ts'
```

**A single param**

```ts
import { param } from 'hyper-ts'

// returns a middleware validating `req.param.user_id`
const middleware = param('user_id', t.string)
```

Here I'm using `t.string` but you can pass _any_ `io-ts` runtime type

```ts
import { IntFromString } from 'io-ts-types/lib/IntFromString'

// validation succeeds only if `req.param.user_id` can be parsed to an integer
const middleware = param('user_id', IntFromString)
```

**Multiple params**

```ts
import { params } from 'hyper-ts'

// returns a middleware validating both `req.param.user_id` and `req.param.user_name`
const middleware = params(
  t.type({
    user_id: t.string,
    user_name: t.string
  })
)
```

**Query**

```ts
import { query } from 'hyper-ts'

// return a middleware validating the query "order=desc&shoe[color]=blue&shoe[type]=converse"
const middleware = query(
  t.type({
    order: t.string,
    shoe: t.type({
      color: t.string,
      type: t.string
    })
  })
)
```

**Body**

```ts
import { body } from 'hyper-ts'

// return a middleware validating `req.body`
const middleware = body(t.string)
```

# Advanced topics

## Defining custom connection states: authentication

Let's say there are some middlewares that must be executed only if the authentication process succeded. Here's how to
ensure this requirement statically

TODO

## Writing tests

TODO

# Documentation

- [API Reference](https://gcanti.github.io/hyper-ts/modules/)
