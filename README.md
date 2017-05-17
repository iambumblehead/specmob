specmob
=======
**(c)[Bumblehead][0]**

Return dynamic results from dsl patterns. Environments using [setImmediate][1] will parse results faster.

specmob functions use patterns to generate results. for example, this simple pattern would result as 'world',

```javascript
{
  type : 'literal',
  value : 'world'
}
```

and this pattern would result as the return of a function named 'sayhello',

```javascript
{
  type : 'fn',
  fnname : 'sayhello'
}
```

nested and grouped patterns may describe complex operations. this pattern would result in a monthly horoscope using the two-digit representation of the current month. "fn" stands for "function" and "cb" stands for "callback".

```javascript
{
  optarr : [{
    optarr : [{
      format : 'mm'
    },{
      type : 'fn',
      fnname : 'getdate',
      name : 'date'
    }],
    type : 'fn',
    fnname : 'getmonthfromdate',
    name :  'monthnumber'
  }],
  type : 'cb',
  cbname : 'requestmonthlyhoroscope',
  name :  'horoscope'
}
```

---------------------------------------------------------
#### <a id="walkthrough"></a>walkthrough

specmob relies on callbacks and functions used to construct a specmob interpreter.

```javascript
let functions = {
  getdate : ([val], opts) =>
    new Date(), 

  getmonthfromdate : ([val], opts) => {
    let month = opts.date.getMonth() + 1;

    return opts.format === 'mm'
      ? ('0' + month).slice(-2) // 0 padded
      : month;
  }
}

let callbacks = {
  requestmonthlyhoroscope : ([val], opts, fn) => (
    // callback this returns a service communication...
    opts.thismonth % 2
      ? fn(null, 'you have good luck this month!')
      : fn(null, 'you have okay luck this month!')
  )
}

let specmobinterpreter = specmob({speccb: callbacks, specfn: functions);
```

all interpreter functions require the same six parameters and return results to a node-style callback _(err, res)_. some parameters may seem unnecessary and unusual but specmob is meant to be used within a larger program for which those parameters make sense. here's an example call,

```javascript
specmobinterpreter.retopt(sess, cfg, graph, node, namespace, {
  optarr : [{
    optarr : [{
      format : 'mm'
    },{
      type : 'fn',
      fnname : 'getdate',
      name : 'date'
    }],
    type : 'fn',
    fnname : 'getmonthfromdate',
    name :  'monthnumber'
  }],
  type : 'cb',
  cbname : 'requestmonthlyhoroscope',
  name :  'horoscope'
}, (err, graph, result) => {
  
})
```

the paremeters are,

 * _sess_ (session), app session state
 * _cfg_ (configuration), app configuration details
 * _graph_, app state
 * _node_, node state, which presumably relates to the given pattern
 * _namespace_, an object with properties used to construct arguments (explained later)

these parameters are passed to the internal and external functions used by the interpreter. ex,

```javascript
let functions = {
  getdate : ([val], opts, sess, cfg, graph, node) =>
    new Date()
};
let callbacks = {
  getdate : ([val], opts, fn, sess, cfg, graph, node) =>
    fn(null, new Date())
};
```

for applications using specmob, any functionality or result becomes possible using these values which may yield data from the user session or the state of the application (graph). because specmob carries the values recursively to each call.

new forms can be defined on the interpreter at runtime to add support for new patterns. for example, adding support for the pattern of type "regexp". to add support define a new function named with _type_ prefixed by "ret".

```javascript
let specmobinterpreter = specmob({speccb: callbacks, specfn: functions});

specmobinterpreter.retregexp = (sess, cfg, graph, node, namespace, opts, fn) => {
  fn(null, new RegExp(opts.value, opts.modifier));
};
```

an example that constructs the interpreter, then adds support for the regexp pattern, then interprets a pattern using the type "regexp",

```javascript
let callbacks = {},
    functions = {
      isregexp : ([val], opts, sess, cfg, graph, node) =>
        opts.re.test(opts.string)
    };

// construct interpreter
let specmobinterpreter = specmob({speccb: callbacks, specfn: functions});

// define function new type "regexp" using the name "retregexp"
specmobinterpreter.retregexp = (sess, cfg, graph, node, namespace, opts, fn) => {
  fn(null, new RegExp(opts.value, opts.modifiers));
};

// use a pattern that includes the new "regexp" type
specmobinterpreter.retopt(sess, cfg, graph, node, namespace, {
  optarr : [{
    type : 'regexp',
    value : '^hello',
    modifiers : '',
    name : 're'
  },{
    type : 'literal',
    value : 'hello at beginning of string',
    name : 'string'
  }],
  type : 'fn',
  fnname : 'isregexp'
}, (err, graph, res) => {
  console.log(res) // true
});
```

validation patterns can be used as well. if the validation fails it will return false and return an errkey if one is defined on the pattern,

```javascript
let callbacks = {},
    functions = {
      isstring : ([val], opts, sess, cfg, graph, node) =>
        typeof val === 'string',

      isgtlength : ([val], opts, sess, cfg, graph, node) =>
        (String(val).length - 1) >= opts.length
    };
    
let specmobinterpreter = specmob({speccb: callbacks, specfn: functions});

specmobinterpreter.getpass(sess, cfg, graph, node, {
  testvalue : 'notlong'
}, {
  type : 'AND',
  whenarr : [{
    type : 'OR',
    errkey : 'notstringornumber',
    whenarr : [{
      type : 'fn',
      fnname : 'isstring',
      argprops : ['testvalue']
    },{
      type : 'fn',
      fnname : 'isnumber',
      argprops : ['testvalue']
    }]
  },{
    type : 'fn',
    fnname : 'isgtlength',
    options : { length : 10 },
    argprops : ['testvalue'],
    errkey : 'notlongenough'
  }]
}, (err, errkey, ispass) => {

  console.log(ispass, errkey); // false 'notlongenough'

});
```




[0]: http://www.bumblehead.com                            "bumblehead"
[1]: https://www.npmjs.com/package/setimmediate         "setimmediate"


![scrounge](https://github.com/iambumblehead/scroungejs/raw/master/img/hand.png)

(The MIT License)

Copyright (c) [Bumblehead][0] <chris@bumblehead.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
