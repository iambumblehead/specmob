// Filename: specmob.spec.js
// Timestamp: 2018.05.07-14:33:13 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const test = require('ava');
const specmob = require('.');

// 'empty' values given to specmob functions
const ns = { ns : 'ns' };
const node = {
  node : 'node',
  get : key => key
};
const graph = {
  graph : 'graph',
  get : () => node
};
const sess = { sess : 'sess' };
const opts = { opts : 'opts' };
const cfg = { cfg : 'cfg' };

test('valfinish/3 should merge cumval and val when spec.spread is `true`', t => {
  let cumval = { cumvalprop : 1 },
      spec = { spread : true },
      val = { valprop : 1 },

      result = specmob().valfinish(cumval, spec, val);

  t.is(result.cumvalprop, 1);
  t.is(result.valprop, 1);
});

// eslint-disable-next-line max-len
test('valfinish/3 should merge cumval and val when spec.type is `undefined` or "opts"', t => {
  let cumval = { cumvalprop : 1 },
      specundefined = { type : undefined },
      specopts = { type : 'opts' },
      val = { valprop : 1 },

      resultundefined = specmob().valfinish(cumval, specundefined, val),
      resultopts = specmob().valfinish(cumval, specopts, val);

  t.is(resultundefined.cumvalprop, 1);
  t.is(resultundefined.valprop, 1);

  t.is(resultopts.cumvalprop, 1);
  t.is(resultopts.valprop, 1);
});

test('valfinish/3 should define val on cumval.value, when values are not merged', t => {
  let cumval = { cumvalprop : 1 },
      spec = { type : 'literal', cumprop : 'value' },
      val = 1,

      result = specmob().valfinish(cumval, spec, val);

  t.is(result.cumvalprop, 1);
  t.is(result.value, 1);
});

// eslint-disable-next-line max-len
test('valfinish/3 should define val on cumval[spec.name], when values are not merged and spec.name is defined', t => {
  let cumval = { cumvalprop : 1 },
      spec = {
        type : 'literal',
        name : 'name' },
      val = 1,

      result = specmob().valfinish(cumval, spec, val);

  t.is(result.cumvalprop, 1);
  t.is(result.name, 1);
});

// eslint-disable-next-line max-len
test('valfinish/3 should define val on cumval[spec.name], when spec.name is 0 (used for array-like ref)', t => {
  let cumval = { name : 0, cumvalprop : 1 },
      spec = {
        type : 'literal',
        name : 'name' },
      val = 1,

      result = specmob().valfinish(cumval, spec, val);

  t.is(result.name, 1);
  // should not add an 'result.undefined' namespace
  t.is(typeof result.undefined, 'undefined');
});

test.cb('valfinish/8 should return value if it is not null or undefined', t => {
  specmob().valordefval(sess, cfg, graph, node, ns, opts, 'value', (err, res) => {
    t.is(res, 'value');

    t.end();
  });
});

// eslint-disable-next-line max-len
test.cb('valfinish/8 should return value if it is null or undefined AND opts.defaultval is not defined', t => {
  specmob().valordefval(sess, cfg, graph, node, ns, opts, null, (err, res) => {
    t.is(res, null);

    t.end();
  });
});

// eslint-disable-next-line max-len
test.cb('valfinish/8 should return value if it is not null or undefned and opts.defaultval is defined', t => {
  specmob().valordefval(sess, cfg, graph, node, ns, {
    def : 'defultval'
  }, 'value', (err, res) => {
    t.is(res, 'value');

    t.end();
  });
});

// eslint-disable-next-line max-len
test.cb('valfinish/8 should return opts.def when defined AND value is null or undefined', t => {
  specmob().valordefval(sess, cfg, graph, node, ns, {
    def : 'def'
  }, null, (err, res) => {
    t.is(res, 'def');

    t.end();
  });
});

test.cb('valfinish/8 should return opts.def string definition', t => {
  specmob().valordefval(sess, cfg, graph, node, ns, {
    def : 'def'
  }, null, (err, res) => {
    t.is(res, 'def');

    t.end();
  });
});

test.cb('valfinish/8 should return opts.def spec definition', t => {
  specmob().valordefval(sess, cfg, graph, node, ns, {
    def : {
      type : 'literal',
      value : 'def'
    }
  }, null, (err, res) => {
    t.is(res, 'def');

    t.end();
  });
});

test('getnsargval/7 should return thisval, when arg is "this"', t => {
  t.is(
    specmob().getnsargval(sess, graph, node, opts, { this : 'thisval' }, '', 'this')
    , 'thisval');
});

test('getnsargval/7 should return property lookup from ns, when arg is "^ns."', t => {
  t.is(specmob().getnsargval(sess, graph, node, opts, {
    hello : 'world'
  }, 'thisval', 'ns.hello'), 'world');
});

test('getnsargval/7 should return property lookup from sess, when arg is "^sess."', t => {
  t.is(specmob().getnsargval({
    token : 'tokenval'
  }, graph, node, opts, { }, 'thisval', 'sess.token'), 'tokenval');
});

test('getnsargval/7 should return "string", when arg is not "string"', t => {
  t.is(specmob().getnsargval(sess, graph, node, opts, {
    hello : 'world'
  }, 'thisval', 'string'), 'string');
});

// eslint-disable-next-line max-len
test('getnsargval/7 should throw an error if ns is not defined and arg is not "this"', t => {
  t.throws(
    () => specmob().getnsargval(sess, graph, node, opts, null, 'thisval', 'ns.hello'), {
      instanceOf : Error,
      message : 'key'
    });
});

test('getargs should support custom namespace re', t => {
  let args = specmob({
    nsre : /^(subj|init)\./
  }).getargs(sess, graph, node, {
    args : [ 'subj.prop', 'init.prop', 'this' ]
  }, {
    this : 'val0',
    subj : { prop : 'val1' },
    init : { prop : 'val2' }
  });

  t.is(args[0], 'val1');
  t.is(args[1], 'val2');
  t.is(args[2], 'val0');
});

test('getargs should return a list of args from the given ns', t => {
  let args = specmob().getargs(sess, graph, node, {
    args : [ 'ns.prop1', 'ns.prop2', 'this' ]
  }, {
    this : 'val0',
    prop1 : 'val1',
    prop2 : 'val2'
  });

  t.is(args[0], 'val1');
  t.is(args[1], 'val2');
  t.is(args[2], 'val0');
});

test('getargs should return dynamic args', t => {
  let args = specmob().getargs(sess, graph, node, {
    args : [ 'ns.actionframe', 'ns.modeldata.type' ]
  }, {
    actionframe : 'actionframe',
    modeldata : { type : 'actionframe' }
  });

  t.is(args[0], 'actionframe');
  t.is(args[1], 'actionframe');
});

test('objlookup, should return "world", for "hello" and `{hello: "world"}`', t => {
  t.is(specmob().objlookup('hello', {
    hello : 'world'
  }), 'world');
});

test('objlookup, should return "world", for "hello.my" and `{hello:{my:"world"}}`', t => {
  t.is(specmob().objlookup('hello.my', {
    hello : { my : 'world' }
  }), 'world');
});

test('objlookup, should return "world", for "hello.0" and `{hello:{0:"world"}}`', t => {
  t.is(specmob().objlookup('hello.0', {
    hello : { 0 : 'world' }
  }), 'world');
});

test.cb('regobjprop, should return an object property from the given ns', t => {
  specmob().retobjprop(sess, cfg, graph, node, {
    hello : { my : 'world' }
  }, {
    type : 'objprop',
    prop : 'hello.my'
  }, (err, res) => {
    t.is(res, 'world');
    t.end();
  });
});

// eslint-disable-next-line max-len
test.cb('regobjprop, should return a opts.def if defined and object property is null or undefined from the given ns', t => {
  specmob().retobjprop(sess, cfg, graph, node, {
    hello : {}
  }, {
    type : 'objprop',
    prop : 'hello.my',
    name : 'myprop',
    def : {
      type : 'literal',
      value : 'defaultworld'
    }
  }, (err, res) => {
    t.is(res, 'defaultworld');
    t.end();
  });
});

test.cb('regobjprop, should return a values for numeric properties', t => {
  specmob().retobjprop(sess, cfg, graph, node, {
    hello : [ 'world' ]
  }, {
    type : 'objprop',
    prop : 'hello.0',
    name : 'myprop'
  }, (err, res) => {
    t.is(res, 'world');
    t.end();
  });
});

test.cb('retfn, should return a function value', t => {
  specmob({
    specfn : {
      getmodifiedval : ([ val ]) => (
        `${val}modified`
      )
    }
  }).retfn(sess, cfg, graph, node, {
    hello : 'world'
  }, {
    type : 'fn',
    fnname : 'getmodifiedval',
    args : [ 'ns.hello' ]
  }, (err, res) => {
    t.is(res, 'worldmodified');
    t.end();
  });
});

test('retfn, should throw an error if named-property fnname is not present', t => {
  t.throws(() => specmob({
    specfn : {
      getmodifiedval : ([ val ]) => (
        `${val}modified`
      )
    }
  }).retfn(sess, cfg, graph, node, {
    hello : 'world'
  }, {
    type : 'fn',
    // fnname : 'getmodifiedval',
    args : [ 'ns.hello' ]
  }, () => {}), {
    instanceOf : Error,
    message : 'no fnfn: “undefined”, invalid cbname or fnname'
  });
});

test('retfn, should throw an error if fnname function is not found', t => {
  t.throws(() => specmob({
    // getmodifiedval : ([val], opts, sess, cfg, graph, node) => (
    //  val + 'modified'
    // )
  }).retfn(sess, cfg, graph, node, {
    hello : 'world'
  }, {
    type : 'fn',
    fnname : 'getmodifiedval',
    args : [ 'ns.hello' ]
  }, () => {}), {
    instanceOf : Error,
    message : 'Cannot use \'in\' operator to search for \'getmodifiedval\' in undefined'
  });
});

test.cb('retcb, should return a callback value', t => {
  let node = {
    world : 'world'
  };

  specmob({
    speccb : {
      getmodifiedval : ([ val ], opts, fn) => (
        fn(null, `${val}modified`)
      )
    }
  }).retcb(sess, cfg, graph, node, {
    hello : 'world'
  }, {
    type : 'cb',
    cbname : 'getmodifiedval',
    args : [ 'ns.hello' ]
  }, (err, res) => {
    t.is(res, 'worldmodified');
    t.end();
  });
});

test('retcb, should throw an error if named-property cbname is not present', t => {
  t.throws(() => specmob({
    speccb : {
      getmodifiedval : ([ val ]) => (
        `${val}modified`
      )
    }
  }).retcb(sess, cfg, graph, node, {
    hello : 'world'
  }, {
    type : 'cb',
    // cbname : 'getmodifiedval',
    args : [ 'ns.hello' ]
  }, () => {}), {
    instanceOf : Error,
    message : 'no cbfn: “undefined”, invalid cbname or fnname'
  });
});

test('retcb, should throw an error if cbname function is not found', t => {
  t.throws(() => specmob({
    // getmodifiedval : ([val], opts, sess, cfg, graph, node) => (
    //  val + 'modified'
    // )
  }).retcb(sess, cfg, graph, node, {
    hello : 'world'
  }, {
    type : 'cb',
    cbname : 'getmodifiedval',
    args : [ 'ns.hello' ]
  }, () => {}), {
    instanceOf : Error,
    message : 'Cannot use \'in\' operator to search for \'getmodifiedval\' in undefined'
  });
});

test.cb('retobj, should return a single literal value', t => {
  specmob().retobj(sess, cfg, graph, node, ns, {
    type : 'obj',
    optarr : [ {
      myprop : 'myvalue'
    } ]
  }, (err, res) => {
    t.is(res.myprop, 'myvalue');
    t.end();
  });
});

test.cb('retobj, should return multiple literal values', t => {
  specmob().retobj(sess, cfg, graph, node, ns, {
    type : 'obj',
    optarr : [ {
      myprop1 : 'myvalue1'
    }, {
      myprop2 : 'myvalue2'
    } ]
  }, (err, res) => {
    t.is(res.myprop1 + res.myprop2, 'myvalue1myvalue2');
    t.end();
  });
});

test.cb('retobj, should obtain an array of values', t => {
  specmob({
    specfn : {
      getmodifiedval : ([ val ]) => (
        `${val}modified`
      ),
      toUpper : ([ str ]) =>
        String(str).toUpperCase(),
      slice : ([ str, slicenum ]) => {
        return String(str).slice(slicenum);
      }
    }
  }).retobj(sess, cfg, graph, node, {
    hello : 'world'
  }, [ {
    type : 'fn',
    fnname : 'getmodifiedval',
    name : 'modifiedval',
    args : [ 'ns.hello' ]
  }, {
    type : 'literal',
    value : 'worldliteral',
    name : 'literalval',
    args : [ 'ns.hello' ]
  }, {
    type : 'literal',
    value : 'filteredliteral',
    name : 'filteredval',
    filterinarr : [ {
      type : 'fn',
      fnname : 'toUpper',
      args : [ 'this' ]
    }, {
      type : 'fn',
      fnname : 'slice',
      args : [ 'ns.val', 8 ]
    } ]
  } ], (err, res) => {
    t.is(res.modifiedval, 'worldmodified');
    t.is(res.literalval, 'worldliteral');
    t.is(res.filteredval, 'LITERAL');

    t.end();
  });
});

// eslint-disable-next-line max-len
test.cb('retoptarr, should return a new array of data from a set of dynamic patterns', t => {
  specmob({
    specfn : {
      gettuesday : () =>
        'tuesday',
      getwednesday : () =>
        'wednesday'
    }
  }).retoptarr(sess, cfg, graph, node, ns, {
    type : 'optarr',
    optarr : [ {
      type : 'fn',
      fnname : 'gettuesday'
    }, {
      type : 'fn',
      fnname : 'getwednesday'
    } ]
  }, (err, res) => {
    t.is(res[1], 'wednesday');
    t.end();
  });
});

test.cb('retDataWHERE, should obtain a query', t => {
  specmob().retDataWHERE(sess, cfg, graph, node, [ {
    type : 0,
    value : 'california'
  }, {
    type : 1,
    value : 'oregon'
  }, {
    type : 2,
    value : 'washington'
  } ], ns, {
    keyarr : [ 1 ],
    basekey : {
      type : 'objprop',
      prop : 'type'
    }
  }, (err, res) => {
    t.is(res[0].value, 'oregon');
    t.end();
  });
});

test.cb('retDataWHERE, should obtain a query for multiple values', t => {
  specmob().retDataWHERE(sess, cfg, graph, node, [ {
    type : 0,
    value : 'california'
  }, {
    type : 1,
    value : 'oregon'
  }, {
    type : 2,
    value : 'washington'
  } ], ns, {
    keyarr : [ 1, 0 ],
    basekey : {
      type : 'objprop',
      prop : 'type'
    }
  }, (err, res) => {
    t.is(res[0].value, 'oregon');
    t.is(res[1].value, 'california');
    t.end();
  });
});

test.cb('applyfilterarr, should apply a sequence of filters', t => {
  specmob({
    specfn : {
      strip : ([ val ]) =>
        String(val).trim(),
      tonum : ([ val ]) =>
        +val,
      add5 : ([ val ]) =>
        val + 5
    }
  }).getfiltered(sess, cfg, graph, node, {}, '55', [ {
    type : 'fn',
    fnname : 'strip',
    args : [ 'ns.val' ]
  }, {
    type : 'fn',
    fnname : 'tonum',
    args : [ 'ns.val' ]
  }, {
    type : 'fn',
    fnname : 'add5',
    args : [ 'ns.val' ]
  } ], (err, res) => {
    t.is(res, 60);

    t.end();
  });
});

test.cb('retopt, should apply a sequence of filters', t => {
  specmob({
    speccb : {
      requestmonthlyhoroscope : (args, opts, fn) => (
        // maybe this returns a service communication...
        opts.thismonth % 2
          ? fn(null, 'you have good luck this month!')
          : fn(null, 'you have okay luck this month!')
      )
    },
    specfn : {
      getdate : () =>
        new Date(),
      getmonthfromdate : (args, opts) => {
        let month = opts.date.getMonth() + 1;

        return opts.format === 'mm'
          ? (`0${month}`).slice(-2) // 0 padded
          : month;
      }
    }
  }).retopt(sess, cfg, graph, node, ns, {
    optarr : [ {
      optarr : [ {
        format : 'mm'
      }, {
        type : 'fn',
        fnname : 'getdate',
        name : 'date'
      } ],
      type : 'fn',
      fnname : 'getmonthfromdate',
      name : 'monthnumber'
    } ],
    type : 'cb',
    cbname : 'requestmonthlyhoroscope',
    name : 'horoscope'
  }, (err, res) => {
    t.is(res.startsWith('you have '), true);

    t.end();
  });
});

// eslint-disable-next-line max-len
test.cb('retregexp, should allow for the definition and usage of the "regexp" pattern', t => {
  let speccb = {},
      specfn = {
        isregexp : (args, opts) =>
          opts.re.test(opts.string)
      },

      specmobinterpreter = specmob({ speccb, specfn });

  specmobinterpreter.retregexp = (sess, cfg, graph, node, ns, opts, fn) => {
    fn(null, new RegExp(opts.value, opts.modifiers), graph);
  };

  specmobinterpreter.retopt(sess, cfg, graph, node, ns, {
    optarr : [ {
      type : 'regexp',
      value : '^hello',
      modifiers : '',
      name : 're'
    }, {
      type : 'literal',
      value : 'hello at beginning of string',
      name : 'string'
    } ],
    type : 'fn',
    fnname : 'isregexp'
  }, (err, res) => {
    t.is(res, true);

    t.end();
  });
});

test.cb('getpass, should evaluate `true` for a pattern that is true', t => {
  let speccb = {},
      specfn = {
        isstring : ([ val ]) =>
          typeof val === 'string',
        isgtlength : ([ val ], opts) =>
          (String(val).length - 1) >= opts.length
      },

      specmobinterpreter = specmob({ speccb, specfn });

  specmobinterpreter.getpass(sess, cfg, graph, node, {
    testvalue : 'testvalue'
  }, {
    type : 'AND',
    whenarr : [ {
      type : 'OR',
      errkey : 'notstringornumber',
      whenarr : [ {
        type : 'fn',
        fnname : 'isstring',
        args : [ 'testvalue' ]
      }, {
        type : 'fn',
        fnname : 'isnumber',
        args : [ 'testvalue' ]
      } ]
    }, {
      type : 'fn',
      fnname : 'isgtlength',
      opts : { length : 4 },
      args : [ 'testvalue' ],
      errkey : 'notlongenough'
    } ]
  }, (err, errmsg, ispass) => {
    t.is(ispass, true);
    t.end();
  });
});

// eslint-disable-next-line max-len
test.cb('getpass, should evaluate `true` for a pattern with a callback that is true', t => {
  const speccb = {
    isstring : ([ val ], opts, fn) => fn(null, typeof val === 'string')
  };
  const specfn = {
    isstring : ([ val ]) => typeof val === 'string',
    isgtlength : ([ val ], opts) =>
      (String(val).length - 1) >= opts.length
  };
  const specmobinterpreter = specmob({ speccb, specfn });

  specmobinterpreter.getpass(sess, cfg, graph, node, {
    testvalue : 'testvalue'
  }, {
    type : 'AND',
    whenarr : [ {
      type : 'OR',
      errkey : 'notstringornumber',
      whenarr : [ {
        type : 'cb',
        cbname : 'isstring',
        args : [ 'testvalue' ]
      }, {
        type : 'fn',
        fnname : 'isnumber',
        args : [ 'testvalue' ]
      } ]
    }, {
      type : 'fn',
      fnname : 'isgtlength',
      opts : { length : 4 },
      args : [ 'testvalue' ],
      errkey : 'notlongenough'
    } ]
  }, (err, errmsg, ispass) => {
    t.is(ispass, true);

    t.end();
  });
});

test.cb('getpass, should evaluate `false` for a pattern that is false', t => {
  let speccb = {},
      specfn = {
        isstring : ([ val ]) =>
          typeof val === 'string',
        isgtlength : ([ val ], opts) =>
          (String(val).length - 1) >= opts.length
      },

      specmobinterpreter = specmob({ speccb, specfn });

  specmobinterpreter.getpass(sess, cfg, graph, node, {
    testvalue : 'sm'
  }, {
    type : 'AND',
    whenarr : [ {
      type : 'OR',
      errkey : 'notstringornumber',
      whenarr : [ {
        type : 'fn',
        fnname : 'isstring',
        args : [ 'ns.testvalue' ]
      }, {
        type : 'fn',
        fnname : 'isnumber',
        args : [ 'ns.testvalue' ]
      } ]
    }, {
      type : 'fn',
      fnname : 'isgtlength',
      opts : { length : 4 },
      args : [ 'ns.testvalue' ],
      errkey : 'notlongenough'
    } ]
  }, (err, errmsg, ispass) => {
    t.is(ispass, false);
    t.end();
  });
});

// eslint-disable-next-line max-len
test.cb('getpass, should return given errkey (if defined) for pattern that evaluates `false`', t => {
  let speccb = {},
      specfn = {
        isstring : ([ val ]) =>
          typeof val === 'string',
        isgtlength : ([ val ], opts) =>
          (String(val).length - 1) >= opts.length
      },

      specmobinterpreter = specmob({ speccb, specfn });

  specmobinterpreter.getpass(sess, cfg, graph, node, {
    testvalue : 'notlong'
  }, {
    type : 'AND',
    whenarr : [ {
      type : 'OR',
      errkey : 'notstringornumber',
      whenarr : [ {
        type : 'fn',
        fnname : 'isstring',
        args : [ 'ns.testvalue' ]
      }, {
        type : 'fn',
        fnname : 'isnumber',
        args : [ 'ns.testvalue' ]
      } ]
    }, {
      type : 'fn',
      fnname : 'isgtlength',
      opts : { length : 10 },
      args : [ 'ns.testvalue' ],
      errkey : 'notlongenough'
    } ]
  }, (err, errkey) => {
    t.is(errkey, 'notlongenough');
    t.end();
  });
});
