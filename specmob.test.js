import { promisify } from 'node:util'
import test from 'node:test'
import assert from 'node:assert/strict'
import specmob from './specmob.js'

// 'empty' values given to specmob functions
const ns = { ns: 'ns' }
const node = {
  node: 'node',
  get: key => key
}
const graph = {
  graph: 'graph',
  get: () => node
}
const sess = { sess: 'sess' }
const opts = { opts: 'opts' }
const cfg = { cfg: 'cfg' }

test('valfinish/3 should merge cumval and val when spec.spread is `true`', () => {
  let cumval = { cumvalprop: 1 },
      spec = { spread: true },
      val = { valprop: 1 },

      result = specmob().valfinish(cumval, spec, val)

  assert.strictEqual(result.cumvalprop, 1)
  assert.strictEqual(result.valprop, 1)
})

// eslint-disable-next-line max-len
test('valfinish/3 should merge cumval and val when spec.type is `undefined` or "opts"', () => {
  let cumval = { cumvalprop: 1 },
      specundefined = { type: undefined },
      specopts = { type: 'opts' },
      val = { valprop: 1 },

      resultundefined = specmob().valfinish(cumval, specundefined, val),
      resultopts = specmob().valfinish(cumval, specopts, val)

  assert.strictEqual(resultundefined.cumvalprop, 1)
  assert.strictEqual(resultundefined.valprop, 1)

  assert.strictEqual(resultopts.cumvalprop, 1)
  assert.strictEqual(resultopts.valprop, 1)
})

test('valfinish/3 should define val on cumval.value, when values are not merged', () => {
  let cumval = { cumvalprop: 1 },
      spec = { type: 'literal', cumprop: 'value' },
      val = 1,

      result = specmob().valfinish(cumval, spec, val)

  assert.strictEqual(result.cumvalprop, 1)
  assert.strictEqual(result.value, 1)
})

// eslint-disable-next-line max-len
test('valfinish/3 should define val on cumval[spec.name], when values are not merged and spec.name is defined', () => {
  let cumval = { cumvalprop: 1 },
      spec = {
        type: 'literal',
        name: 'name' },
      val = 1,

      result = specmob().valfinish(cumval, spec, val)

  assert.strictEqual(result.cumvalprop, 1)
  assert.strictEqual(result.name, 1)
})

// eslint-disable-next-line max-len
test('valfinish/3 should define val on cumval[spec.name], when spec.name is 0 (used for array-like ref)', () => {
  let cumval = { name: 0, cumvalprop: 1 },
      spec = {
        type: 'literal',
        name: 'name' },
      val = 1,

      result = specmob().valfinish(cumval, spec, val)

  assert.strictEqual(result.name, 1)
  // should not add an 'result.undefined' namespace
  assert.strictEqual(typeof result.undefined, 'undefined')
})

test('valfinish/8 should return value if it is not null or undefined', async () => {
  const res = await promisify(specmob().valordefval)(
    sess, cfg, graph, node, ns, opts, 'value')

  assert.strictEqual(res, 'value')
})

// eslint-disable-next-line max-len
test('valfinish/8 should return value if it is null or undefined AND opts.defaultval is not defined', async () => {
  const res = await promisify(specmob().valordefval)(
    sess, cfg, graph, node, ns, opts, null)

  assert.strictEqual(res, null)
})

// eslint-disable-next-line max-len
test('valfinish/8 should return value if it is not null or undefned and opts.defaultval is defined', async () => {
  const res = await promisify(specmob().valordefval)(
    sess, cfg, graph, node, ns, { def: 'defultval' }, 'value')

  assert.strictEqual(res, 'value')
})

// eslint-disable-next-line max-len
test('valfinish/8 should return opts.def when defined AND value is null or undefined', async () => {
  const res = await promisify(specmob().valordefval)(
    sess, cfg, graph, node, ns, { def: 'def' }, null)

  assert.strictEqual(res, 'def')
})

test('valfinish/8 should return opts.def string definition', async () => {
  const res = await promisify(specmob().valordefval)(sess, cfg, graph, node, ns, {
    def: 'def'
  }, null)

  assert.strictEqual(res, 'def')
})

test('valfinish/8 should return opts.def spec definition', async () => {
  const res = await promisify(specmob().valordefval)(sess, cfg, graph, node, ns, {
    def: {
      type: 'literal',
      value: 'def'
    }
  }, null)

  assert.strictEqual(res, 'def')
})

test('getnsargval/7 should return thisval, when arg is "this"', () => {
  assert.strictEqual(
    specmob().getnsargval(sess, graph, node, opts, { this: 'thisval' }, '', 'this')
    , 'thisval')
})

test('getnsargval/7 should return property lookup from ns, when arg is "^ns."', () => {
  assert.strictEqual(specmob().getnsargval(sess, graph, node, opts, {
    hello: 'world'
  }, 'thisval', 'ns.hello'), 'world')
})

// eslint-disable-next-line max-len
test('getnsargval/7 should return property lookup from sess, when arg is "^sess."', () => {
  assert.strictEqual(specmob().getnsargval({
    token: 'tokenval'
  }, graph, node, opts, { }, 'thisval', 'sess.token'), 'tokenval')
})

test('getnsargval/7 should return "string", when arg is not "string"', () => {
  assert.strictEqual(specmob().getnsargval(sess, graph, node, opts, {
    hello: 'world'
  }, 'thisval', 'string'), 'string')
})

// eslint-disable-next-line max-len
test('getnsargval/7 should throw an error if ns is not defined and arg is not "this"', async () => {
  await assert.rejects(async () => promisify(specmob().getnsargval)(
    sess, graph, node, opts, null, 'thisval', 'ns.hello'), { message: 'key' })
})

test('getargs should support custom namespace re', () => {
  let args = specmob({
    nsre: /^(subj|init)\./
  }).getargs(sess, graph, node, {
    args: ['subj.prop', 'init.prop', 'this']
  }, {
    this: 'val0',
    subj: { prop: 'val1' },
    init: { prop: 'val2' }
  })

  assert.strictEqual(args[0], 'val1')
  assert.strictEqual(args[1], 'val2')
  assert.strictEqual(args[2], 'val0')
})

test('getargs should return a list of args from the given ns', () => {
  let args = specmob().getargs(sess, graph, node, {
    args: ['ns.prop1', 'ns.prop2', 'this']
  }, {
    this: 'val0',
    prop1: 'val1',
    prop2: 'val2'
  })

  assert.strictEqual(args[0], 'val1')
  assert.strictEqual(args[1], 'val2')
  assert.strictEqual(args[2], 'val0')
})

test('getargs should return dynamic args', () => {
  let args = specmob().getargs(sess, graph, node, {
    args: ['ns.actionframe', 'ns.modeldata.type']
  }, {
    actionframe: 'actionframe',
    modeldata: { type: 'actionframe' }
  })

  assert.strictEqual(args[0], 'actionframe')
  assert.strictEqual(args[1], 'actionframe')
})

test('objlookup, should return "world", for "hello" and `{hello: "world"}`', () => {
  assert.strictEqual(specmob().objlookup('hello', {
    hello: 'world'
  }), 'world')
})

// eslint-disable-next-line max-len
test('objlookup, should return "world", for "hello.my" and `{hello:{my:"world"}}`', () => {
  assert.strictEqual(specmob().objlookup('hello.my', {
    hello: { my: 'world' }
  }), 'world')
})

test('objlookup, should return "world", for "hello.0" and `{hello:{0:"world"}}`', () => {
  assert.strictEqual(specmob().objlookup('hello.0', {
    hello: { 0: 'world' }
  }), 'world')
})

test('regobjprop, should return an object property from the given ns', async () => {
  const res = await promisify(specmob().retobjprop)(
    sess, cfg, graph, node, {
      hello: { my: 'world' }
    }, {
      type: 'objprop',
      prop: 'hello.my'
    })

  assert.strictEqual(res, 'world')
})

// eslint-disable-next-line max-len
test('regobjprop, should return a opts.def if defined and object property is null or undefined from the given ns', async () => {
  const res = await promisify(specmob().retobjprop)(
    sess, cfg, graph, node, {
      hello: {}
    }, {
      type: 'objprop',
      prop: 'hello.my',
      name: 'myprop',
      def: {
        type: 'literal',
        value: 'defaultworld'
      }
    })

  assert.strictEqual(res, 'defaultworld')
})

test('regobjprop, should return a values for numeric properties', async () => {
  const res = await promisify(specmob().retobjprop)(sess, cfg, graph, node, {
    hello: ['world']
  }, {
    type: 'objprop',
    prop: 'hello.0',
    name: 'myprop'
  })

  assert.strictEqual(res, 'world')
})

test('retfn, should return a function value', async () => {
  const res = await promisify(specmob({
    specfn: {
      getmodifiedval: ([val]) => (
        `${val}modified`
      )
    }
  }).retfn)(sess, cfg, graph, node, {
    hello: 'world'
  }, {
    type: 'fn',
    fnname: 'getmodifiedval',
    args: ['ns.hello']
  })

  assert.strictEqual(res, 'worldmodified')
})

test('retfn, should return a function value (async)', async () => {
  const res = await promisify(specmob({
    specfn: {
      getmodifiedval: async ([val]) => (
        `${val}modified`
      )
    }
  }).retfn)(sess, cfg, graph, node, {
    hello: 'world'
  }, {
    type: 'fn',
    fnname: 'getmodifiedval',
    args: ['ns.hello']
  })

  assert.strictEqual(res, 'worldmodified')
})

test('retfn, should throw an error if named-property fnname is not present', async () => {
  await assert.rejects(async () => promisify(specmob({
    specfn: {
      getmodifiedval: ([val]) => (
        `${val}modified`
      )
    }
  }).retfn)(sess, cfg, graph, node, {
    hello: 'world'
  }, {
    type: 'fn',
    // fnname: 'getmodifiedval',
    args: ['ns.hello']
  }, err => { throw err }), {
    message: 'invalid: fnname “undefined”'
  })
})

test('retfn, should throw an error if fnname function is not found', async () => {
  await assert.rejects(async () => promisify(specmob({
    // getmodifiedval: ([val], opts, sess, cfg, graph, node) => (
    //  val + 'modified'
    // )
  }).retfn)(sess, cfg, graph, node, {
    hello: 'world'
  }, {
    type: 'fn',
    fnname: 'getmodifiedval',
    args: ['ns.hello']
  }, e => { throw e }), {
    message: 'Cannot use \'in\' operator to search for \'getmodifiedval\' in undefined'
  })
})

test('retcb, should return a callback value', async () => {
  let node = {
    world: 'world'
  }

  const res = await promisify(specmob({
    speccb: {
      getmodifiedval: ([val], opts, fn) => (
        fn(null, `${val}modified`)
      )
    }
  }).retcb)(sess, cfg, graph, node, {
    hello: 'world'
  }, {
    type: 'cb',
    cbname: 'getmodifiedval',
    args: ['ns.hello']
  })

  assert.strictEqual(res, 'worldmodified')
})

test('retcb, should throw an error if named-property cbname is not present', async () => {
  await assert.rejects(async () => promisify(specmob({
    speccb: {
      getmodifiedval: ([val]) => (
        `${val}modified`
      )
    }
  }).retcb)(sess, cfg, graph, node, {
    hello: 'world'
  }, {
    type: 'cb',
    // cbname: 'getmodifiedval',
    args: ['ns.hello']
  }, e => { throw e }), {
    message: 'invalid: cbname “undefined”'
  })
})

test('retcb, should throw an error if cbname function is not found', async () => {
  await assert.rejects(async () => promisify(specmob({
    // getmodifiedval: ([val], opts, sess, cfg, graph, node) => (
    //  val + 'modified'
    // )
  }).retcb)(sess, cfg, graph, node, {
    hello: 'world'
  }, {
    type: 'cb',
    cbname: 'getmodifiedval',
    args: ['ns.hello']
  }, e => { throw e }), {
    message: 'Cannot use \'in\' operator to search for \'getmodifiedval\' in undefined'
  })
})

test('retobj, should return a single literal value', async () => {
  const res = await promisify(specmob().retobj)(sess, cfg, graph, node, ns, {
    type: 'obj',
    optarr: [{
      myprop: 'myvalue'
    }]
  })

  assert.strictEqual(res.myprop, 'myvalue')
})

test('retobj, should return multiple literal values', async () => {
  const res = await promisify(specmob().retobj)(sess, cfg, graph, node, ns, {
    type: 'obj',
    optarr: [{
      myprop1: 'myvalue1'
    }, {
      myprop2: 'myvalue2'
    }]
  })

  assert.strictEqual(res.myprop1 + res.myprop2, 'myvalue1myvalue2')
})

test('retobj, should obtain an array of values', async () => {
  const res = await promisify(specmob({
    specfn: {
      getmodifiedval: ([val]) => (
        `${val}modified`
      ),
      toUpper: ([str]) =>
        String(str).toUpperCase(),
      slice: ([str, slicenum]) => {
        return String(str).slice(slicenum)
      }
    }
  }).retobj)(sess, cfg, graph, node, {
    hello: 'world'
  }, [{
    type: 'fn',
    fnname: 'getmodifiedval',
    name: 'modifiedval',
    args: ['ns.hello']
  }, {
    type: 'literal',
    value: 'worldliteral',
    name: 'literalval',
    args: ['ns.hello']
  }, {
    type: 'literal',
    value: 'filteredliteral',
    name: 'filteredval',
    filterinarr: [{
      type: 'fn',
      fnname: 'toUpper',
      args: ['this']
    }, {
      type: 'fn',
      fnname: 'slice',
      args: ['ns.val', 8]
    }]
  }])

  assert.strictEqual(res.modifiedval, 'worldmodified')
  assert.strictEqual(res.literalval, 'worldliteral')
  assert.strictEqual(res.filteredval, 'LITERAL')
})

// eslint-disable-next-line max-len
test('retoptarr, should return a new array of data from a set of dynamic patterns', async () => {
  const res = await promisify(specmob({
    specfn: {
      gettuesday: () =>
        'tuesday',
      getwednesday: () =>
        'wednesday'
    }
  }).retoptarr)(sess, cfg, graph, node, ns, {
    type: 'optarr',
    optarr: [{
      type: 'fn',
      fnname: 'gettuesday'
    }, {
      type: 'fn',
      fnname: 'getwednesday'
    }]
  })
  assert.strictEqual(res[1], 'wednesday')
})

test('retDataWHERE, should obtain a query', async () => {
  const res = await promisify(specmob().retDataWHERE)(sess, cfg, graph, node, [{
    type: 0,
    value: 'california'
  }, {
    type: 1,
    value: 'oregon'
  }, {
    type: 2,
    value: 'washington'
  }], ns, {
    keyarr: [1],
    basekey: {
      type: 'objprop',
      prop: 'type'
    }
  })

  assert.strictEqual(res[0].value, 'oregon')
})

test('retDataWHERE, should obtain a query for multiple values', async () => {
  const res = await promisify(specmob().retDataWHERE)(sess, cfg, graph, node, [{
    type: 0,
    value: 'california'
  }, {
    type: 1,
    value: 'oregon'
  }, {
    type: 2,
    value: 'washington'
  }], ns, {
    keyarr: [1, 0],
    basekey: {
      type: 'objprop',
      prop: 'type'
    }
  })

  assert.strictEqual(res[0].value, 'oregon')
  assert.strictEqual(res[1].value, 'california')
})

test('applyfilterarr, should apply a sequence of filters', async () => {
  const res = await promisify(specmob({
    specfn: {
      strip: ([val]) =>
        String(val).trim(),
      tonum: ([val]) =>
        +val,
      add5: ([val]) =>
        val + 5
    }
  }).getfiltered)(sess, cfg, graph, node, {}, '55', [{
    type: 'fn',
    fnname: 'strip',
    args: ['ns.val']
  }, {
    type: 'fn',
    fnname: 'tonum',
    args: ['ns.val']
  }, {
    type: 'fn',
    fnname: 'add5',
    args: ['ns.val']
  }])

  assert.strictEqual(res, 60)
})

test('retopt, should apply a sequence of filters', async () => {
  const res = await promisify(specmob({
    speccb: {
      requestmonthlyhoroscope: (args, opts, fn) => (
        // maybe this returns a service communication...
        opts.thismonth % 2
          ? fn(null, 'you have good luck this month!')
          : fn(null, 'you have okay luck this month!')
      )
    },
    specfn: {
      getdate: () =>
        new Date(),
      getmonthfromdate: (args, opts) => {
        let month = opts.date.getMonth() + 1

        return opts.format === 'mm'
          ? (`0${month}`).slice(-2) // 0 padded
          : month
      }
    }
  }).retopt)(sess, cfg, graph, node, ns, {
    optarr: [{
      optarr: [{
        format: 'mm'
      }, {
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
  })

  assert.strictEqual(res.startsWith('you have '), true)
})

// eslint-disable-next-line max-len
test('retregexp, should allow for the definition and usage of the "regexp" pattern', async () => {
  let speccb = {},
      specfn = {
        isregexp: (args, opts) =>
          opts.re.test(opts.string)
      },

      specmobinterpreter = specmob({ speccb, specfn })

  specmobinterpreter.retregexp = (sess, cfg, graph, node, ns, opts, fn) => {
    fn(null, new RegExp(opts.value, opts.modifiers), graph)
  }

  const res = await promisify(specmobinterpreter.retopt)(sess, cfg, graph, node, ns, {
    optarr: [{
      type: 'regexp',
      value: '^hello',
      modifiers: '',
      name: 're'
    }, {
      type: 'literal',
      value: 'hello at beginning of string',
      name: 'string'
    }],
    type: 'fn',
    fnname: 'isregexp'
  })

  assert.strictEqual(res, true)
})

test('getpass, should evaluate `true` for a pattern that is true', async () => {
  let speccb = {},
      specfn = {
        isstring: ([val]) =>
          typeof val === 'string',
        isgtlength: ([val], opts) =>
          (String(val).length - 1) >= opts.length
      },

      specmobinterpreter = specmob({ speccb, specfn })

  // eslint-disable-next-line max-len
  const ispass = await new Promise(resolve => specmobinterpreter.getpass(sess, cfg, graph, node, {
    testvalue: 'testvalue'
  }, {
    type: 'AND',
    whenarr: [{
      type: 'OR',
      errkey: 'notstringornumber',
      whenarr: [{
        type: 'fn',
        fnname: 'isstring',
        args: ['testvalue']
      }, {
        type: 'fn',
        fnname: 'isnumber',
        args: ['testvalue']
      }]
    }, {
      type: 'fn',
      fnname: 'isgtlength',
      opts: { length: 4 },
      args: ['testvalue'],
      errkey: 'notlongenough'
    }]
  }, (err, errmsg, ispass) => {
    resolve(ispass)
  }))

  assert.strictEqual(ispass, true)
})

// eslint-disable-next-line max-len
test('getpass, should evaluate `true` for a pattern with a callback that is true', async () => {
  const speccb = {
    isstring: ([val], opts, fn) => fn(null, typeof val === 'string')
  }
  const specfn = {
    isstring: ([val]) => typeof val === 'string',
    isgtlength: ([val], opts) =>
      (String(val).length - 1) >= opts.length
  }
  const specmobinterpreter = specmob({ speccb, specfn })

  // eslint-disable-next-line max-len
  const ispass = await new Promise(resolve => specmobinterpreter.getpass(sess, cfg, graph, node, {
    testvalue: 'testvalue'
  }, {
    type: 'AND',
    whenarr: [{
      type: 'OR',
      errkey: 'notstringornumber',
      whenarr: [{
        type: 'cb',
        cbname: 'isstring',
        args: ['testvalue']
      }, {
        type: 'fn',
        fnname: 'isnumber',
        args: ['testvalue']
      }]
    }, {
      type: 'fn',
      fnname: 'isgtlength',
      opts: { length: 4 },
      args: ['testvalue'],
      errkey: 'notlongenough'
    }]
  }, (err, errmsg, ispass) => {
    resolve(ispass)
  }))

  assert.strictEqual(ispass, true)
})

test('getpass, should evaluate `false` for a pattern that is false', async () => {
  let speccb = {},
      specfn = {
        isstring: ([val]) =>
          typeof val === 'string',
        isgtlength: ([val], opts) =>
          (String(val).length - 1) >= opts.length
      },

      specmobinterpreter = specmob({ speccb, specfn })

  // eslint-disable-next-line max-len
  const ispass = await new Promise(resolve => specmobinterpreter.getpass(sess, cfg, graph, node, {
    testvalue: 'sm'
  }, {
    type: 'AND',
    whenarr: [{
      type: 'OR',
      errkey: 'notstringornumber',
      whenarr: [{
        type: 'fn',
        fnname: 'isstring',
        args: ['ns.testvalue']
      }, {
        type: 'fn',
        fnname: 'isnumber',
        args: ['ns.testvalue']
      }]
    }, {
      type: 'fn',
      fnname: 'isgtlength',
      opts: { length: 4 },
      args: ['ns.testvalue'],
      errkey: 'notlongenough'
    }]
  }, (err, errmsg, ispass) => {
    resolve(ispass)
  }))

  assert.strictEqual(ispass, false)
})

// eslint-disable-next-line max-len
test('getpass, should return given errkey (if defined) for pattern that evaluates `false`', async () => {
  let speccb = {},
      specfn = {
        isstring: ([val]) =>
          typeof val === 'string',
        isgtlength: ([val], opts) =>
          (String(val).length - 1) >= opts.length
      },

      specmobinterpreter = specmob({ speccb, specfn })

  const errkey = await promisify(specmobinterpreter.getpass)(sess, cfg, graph, node, {
    testvalue: 'notlong'
  }, {
    type: 'AND',
    whenarr: [{
      type: 'OR',
      errkey: 'notstringornumber',
      whenarr: [{
        type: 'fn',
        fnname: 'isstring',
        args: ['ns.testvalue']
      }, {
        type: 'fn',
        fnname: 'isnumber',
        args: ['ns.testvalue']
      }]
    }, {
      type: 'fn',
      fnname: 'isgtlength',
      opts: { length: 10 },
      args: ['ns.testvalue'],
      errkey: 'notlongenough'
    }]
  })

  assert.strictEqual(errkey, 'notlongenough')
})

// cfg.spec.getargs
// cfg.spec.getfn
// cfg.spec.callfn
// cfg.spec.getfiltered
// cfg.spec.retDataWHERE
// cfg.spec.retobj
// cfg.spec.retopt
// cfg.spec.getopts
// cfg.spec.getpass
// cfg.spec.isvalidspec
// cfg.spec.valfinish
