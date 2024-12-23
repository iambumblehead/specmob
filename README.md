specmob
=======
**(c)[Bumblehead][0]**

[![npm version](https://badge.fury.io/js/specmob.svg)](https://badge.fury.io/js/specmob) ![Build Status](https://github.com/iambumblehead/specmob/workflows/test/badge.svg)

`specmob` returns dynamic results from dsl patterns. For example, this simple pattern would result as 'world',

```javascript
({
  type: 'literal',
  value: 'world'
})
```

This pattern returns the product of a function named 'sayhello',
```javascript
({
  type: 'fn',
  fnname: 'sayhello'
})
```

Nested and grouped patterns describe complex operations. This pattern resolves a monthly horoscope using the two-digit representation of the current month. "fn" stands for "function" and "cb" stands for "callback".
```javascript
({
  type: 'cb',
  cbname: 'requestmonthlyhoroscope',
  name: 'horoscope',
  argsdyn: [0],
  args: [{
    type: 'obj',
    optarr: [{
      type: 'fn',
      fnname: 'getmonthfromdate',
      name: 'monthnumber',
      argsdyn: [0],
      args: [{
        type: 'obj',
        optarr: [{
          format: 'mm'
        }, {
          type: 'fn',
          fnname: 'getdate',
          name: 'date'
        }]
      }]
    }]
  }]
})
```

---------------------------------------------------------
#### <a id="walkthrough"></a>walkthrough

`specmob` relies on callbacks and functions to construct the specmob interpreter.

```javascript
const functions = {
  getdate: ([val]) =>
    new Date(),

  getmonthfromdate: ([val, opts]) => {
    const month = opts.date.getMonth() + 1

    return opts.format === 'mm'
      ? ('0' + month).slice(-2) // 0 padded
      : month
  }
}

const callbacks = {
  requestmonthlyhoroscope: ([val], fn) => (
    // callback this returns a service communication...
    opts.thismonth % 2
      ? fn(null, 'you have good luck this month!')
      : fn(null, 'you have okay luck this month!')
  )
}

const specmobinterpreter = specmob({speccb: callbacks, specfn: functions})
```

all interpreter functions use the same six parameters and most return results to a node-style callback _(err, res)_. some parameters may seem unnecessary and unusual but specmob is meant to be used within a larger program for which those parameters make sense. here's an example call,

```javascript
specmobinterpreter.retopt(sess, cfg, graph, node, namespace, {
  optarr: [{
    optarr: [{
      format: 'mm'
    },{
      type: 'fn',
      fnname: 'getdate',
      name: 'date'
    }],
    type: 'fn',
    fnname: 'getmonthfromdate',
    name: 'monthnumber'
  }],
  type: 'cb',
  cbname: 'requestmonthlyhoroscope',
  name: 'horoscope'
}, (err, graph, result) => {

})
```

the paremeters are,

 * _sess_ (session), app session state
 * _cfg_ (configuration), app configuration details
 * _graph_, app state
 * _node_, node state, which presumably relates to the given pattern
 * _ns_, (namespace) an object with properties used to construct arguments (explained later)

these parameters are passed to the internal and external functions used by the interpreter. ex,

```javascript
const functions = {
  getdate: ([val], sess, cfg, graph, node) =>
    new Date()
}
const callbacks = {
  getdate: ([val], fn, sess, cfg, graph, node) =>
    fn(null, new Date())
}
```

For applications using specmob, any functionality or result becomes possible using patterns to resolve data from the user session or the state of the application (graph).

New forms can be defined on the interpreter at runtime to add support for new patterns. for example, adding support for the pattern of type "regexp". to add support define a new function named with _type_ prefixed by "ret".

```javascript
const specmobinterpreter = specmob({speccb: callbacks, specfn: functions})

specmobinterpreter.retregexp = (sess, cfg, graph, node, ns, opts, fn) => {
  fn(null, new RegExp(opts.value, opts.modifier))
}
```

an example that constructs the interpreter, then adds support for the regexp pattern, then interprets a pattern using the type "regexp",

```javascript
const callbacks = {}
const functions = {
  isregexp: ([val], sess, cfg, graph, node) =>
    opts.re.test(opts.string)
}

// construct interpreter
const specmobinterpreter = specmob({speccb: callbacks, specfn: functions})

// define function new type "regexp" using the name "retregexp"
specmobinterpreter.retregexp = (sess, cfg, graph, node, ns, opts, fn) => {
  fn(null, new RegExp(opts.value, opts.modifiers))
}

// use a pattern that includes the new "regexp" type
specmobinterpreter.retopt(sess, cfg, graph, node, ns, {
  optarr: [{
    type: 'regexp',
    value: '^hello',
    modifiers: '',
    name: 're'
  },{
    type: 'literal',
    value: 'hello at beginning of string',
    name: 'string'
  }],
  type: 'fn',
  fnname: 'isregexp'
}, (err, graph, res) => {
  console.log(res) // true
})
```

Validation patterns can be used as well. When validation fails it will return false and an errkey if one is defined on the pattern,

```javascript
const callbacks = {}
const functions = {
  isstring: ([val], sess, cfg, graph, node) =>
    typeof val === 'string',
  isgtlength: ([val], sess, cfg, graph, node) =>
    (String(val).length - 1) >= opts.length
}

const specmobinterpreter = specmob({speccb: callbacks, specfn: functions})

specmobinterpreter.getpass(sess, cfg, graph, node, {
  testvalue: 'notlong'
}, {
  type: 'AND',
  whenarr: [{
    type: 'OR',
    errkey: 'notstringornumber',
    whenarr: [{
      type: 'fn',
      fnname: 'isstring',
      args: ['testvalue']
    },{
      type: 'fn',
      fnname: 'isnumber',
      args: ['testvalue']
    }]
  },{
    type: 'fn',
    fnname: 'isgtlength',
    opts: { length: 10 },
    args: ['testvalue'],
    errkey: 'notlongenough'
  }]
}, (err, errkey, ispass) => {
  console.log(ispass, errkey) // false 'notlongenough'
})
```



[0]: http://www.bumblehead.com                            "bumblehead"
[1]: https://www.npmjs.com/package/setimmediate         "setimmediate"


![scrounge](https://github.com/iambumblehead/scroungejs/raw/main/img/hand.png)

(The MIT License)

Copyright (c) [Bumblehead][0] <chris@bumblehead.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
