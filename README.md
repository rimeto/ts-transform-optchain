# TypeScript Transformer for Optional Chaining

The `ts-transform-optchain` library is a TypeScript custom transformer to enable optional chaining with default value support. `ts-transform-optchain` helps the developer write less verbose code while preserving TypeScript typings when traversing deep property structures. This library serves as an interim solution for Optional Chaining until JavaScript/TypeScript introduce support for equivalent functionality in a future release (see: [Related Resources](#related)).

`ts-transform-optchain` is a derivative of the ES6 Proxy based [`ts-optchain`](https://github.com/rimeto/ts-optchain) library. Unlike its predecessor, the transformed code produced by `ts-transform-optchain` is supported in ALL JavaScript environments without worry for ES6 Proxy support.

For example, the code:

```typescript
  import { oc } from 'ts-transform-optchain';
  const obj: T = { /* ... */ };
  const value = oc(obj).propA.propB.propC(defaultValue);
```

...will be transformed to:

```typescript
  const value =
    (obj != null && obj.propA != null && obj.propA.propB != null && obj.propA.propB.propC != null)
      ? obj.propA.propB.propC
      : defaultValue;
```

## Installing

```bash
$ npm i --save ts-transform-optchain
```

### Requirements

- NodeJS >= 6
- TypeScript >= 2.8

## Example Usage

```typescript
import { oc } from 'ts-transform-optchain';

interface I {
  a?: string;
  b?: {
    d?: string;
  };
  c?: Array<{
    u?: {
      v?: number;
    };
  }>;
  e?: {
    f?: string;
    g?: () => string;
  };
}

const x: I = {
  a: 'hello',
  b: {
    d: 'world',
  },
  c: [{ u: { v: -100 } }, { u: { v: 200 } }, {}, { u: { v: -300 } }],
};

// Several examples of deep object traversal using (a) optional chaining vs
// (b) logic expressions. Each of the pairs below are equivalent in
// result. Observe the benefits of optional chaining accruing with
// the depth and complexity of the path traversal.

oc(x).a(); // 'hello'
(x != null && x.a != null) ? x.a : undefined;

oc(x).b.d(); // 'world'
(x != null && x.b != null && x.b.d != null) ? x.b.d : undefined;

oc(x).c[0].u.v(); // -100
(x != null && x.c != null && x.c[0] != null && x.c[0].u != null && x.c[0].u.v != null)
  ? x.c[0].u.v
  : undefined;

oc(x).c[100].u.v(); // undefined
(x != null && x.c != null && x.c[100] != null && x.c[100].u != null && x.c[100].u.v != null)
  ? x.c[100].u.v
  : undefined;

oc(x).c[100].u.v(1234); // 1234
(x != null && x.c != null && x.c[100] != null && x.c[100].u != null && x.c[100].u.v != null)
  ? x.c[100].u.v
  : 1234;

oc(x).e.f(); // undefined
(x != null && x.e != null && x.e.f != null) ? x.e.f : undefined;

oc(x).e.f('optional default value'); // 'optional default value'
(x != null && x.e != null && x.e.f != null) ? x.e.f : 'optional default value';

// NOTE: working with function value types can be risky. Additional run-time
// checks to verify that object types are functions before invocation are advised!
oc(x).e.g(() => 'Yo Yo')(); // 'Yo Yo'
((x != null && x.e != null && x.e.g != null) ? x.e.g : (() => 'Yo Yo'))();
```

## How to Use the Transformer

### ttypescript

[TTypescript](https://github.com/cevek/ttypescript) (Transformer TypeScript) allows the developer to apply TypeScript code transformers at compile time easily. Configuration is as simple as adding the `plugins` property to `compilerOptions` in `tsconfig.json`, namely:

```typescript
// tsconfig.json
{
    "compilerOptions": {
        "plugins": [
            { "transform": "ts-transform-optchain" },
        ]
    },
}
```

The developer can then build + transform via the command line, webpack, ts-node, etc. Please see the [usage instructions](https://github.com/cevek/ttypescript#how-to-use).

## Problem

When traversing tree-like property structures, the developer often must check for existence of intermediate nodes to avoid run-time exceptions. While TypeScript is helpful in requiring the necessary existence checks at compile-time, the final code is still quite cumbersome. For example, given the interfaces:

```typescript
interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

interface IHome {
  address?: IAddress;
  phoneNumber?: string;
}

interface IUser {
  home?: IHome;
}
```

Without support for optional chaining built into TypeScript, an implementation for a method to extract the home street string from this structure would look like:

```typescript
function getHomeStreet(user: IUser, defaultValue?: string) {
  return (user != null && user.home != null && user.home.address != null && user.home.address.street != null) ? user.home.address.street : defaultValue;
}
```

This implementation is tedious to write. Utilities like `lodash`'s `get(...)` can help tighten the implementation, namely:

```typescript
import { get } from 'lodash';

function getHomeStreet(user: IUser, defaultValue?: string) {
  return get(user, 'home.address.street', defaultValue);
}
```

However, when using tools like `lodash` the developer loses the benefits of:

- Compile-time validation of the path `home.address.street`
- Compile-time validation of the expected type of the value at `home.address.street`
- Development-time code-completion assistance when manipulating the path `home.address.street` using tools like Visual Studio Code.

## Solution

Using the `ts-transform-optchain` utility, `getHomeStreet` can be concisely written as:

```typescript
import { oc } from 'ts-transform-optchain';

function getHomeStreet(user: IUser, defaultValue?: string) {
  return oc(user).home.address.street(defaultValue);
}
```

Other features of `ts-transform-optchain` include:

### Type Preservation

`ts-transform-optchain` preserves TypeScript typings through deep tree traversal. For example:

```typescript
// phoneNumberOptional is of type: string | undefined
const phoneNumberOptional = oc(user).home.phoneNumber();

// phoneNumberRequired is of type: string
const phoneNumberRequired = oc(user).home.phoneNumber('+1.555.123.4567');
```

### Array Types

`ts-transform-optchain` supports traversal of Array types by index. For example:

```typescript
interface IItem {
  name?: string;
}

interface ICollection {
  items?: IItem[];
}

function getFirstItemName(collection: ICollection) {
  // Return type: string
  return oc(collection).items[0].name('No Name Item');
}
```

### Function Types

`ts-transform-optchain` supports traversal to function values. For example:

```typescript
interface IThing {
  getter?: () => string;
}

const thing: IThing = { ... };
const result = oc(thing).getter(() => 'Default Getter')();
```

### Code-Completion

`ts-transform-optchain` enables code-completion assistance in popular IDEs such as Visual Studio Code when writing tree-traversal code.

## <a name="related"></a>Related Resources

- [ts-optchain](https://github.com/rimeto/ts-optchain)
- [ttypescript](https://github.com/cevek/ttypescript)
- [Optional Chaining for JavaScript (TC39 Proposal)](https://github.com/tc39/proposal-optional-chaining)

## License

`ts-transform-optchain` is MIT Licensed.
