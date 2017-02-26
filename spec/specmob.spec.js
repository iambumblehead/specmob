// Filename: specmob.spec.js  
// Timestamp: 2017.02.26-05:47:10 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const specmob = require('../'),

      // 'empty' values given to specmob functions
      namespace = {namespace:'namespace'},
      rules = {rules:'rules'},
      graph = {graph:'graph'},
      node = {node:'node'},
      sess = {sess:'sess'},
      opts = {opts:'opts'},
      cfg = {cfg:'cfg'};

describe('specmob.valfinish( cumval, spec, val )', () => {
  
  it('should merge cumval and val when spec.spread is `true`', () => {
    let cumval = { cumvalprop : 1 },
        spec = { spread : true },
        val = { valprop : 1 };
    
    let result = specmob().valfinish(cumval, spec, val);
    
    expect( result.cumvalprop ).toBe( 1 );
    expect( result.valprop ).toBe( 1 );
  });

  it('should merge cumval and val when spec.type is `undefined` or "opts"', () => {
    let cumval = { cumvalprop : 1 },
        specundefined = { type : undefined },
        specopts = { type : 'opts' },
        val = { valprop : 1 };
    
    let resultundefined = specmob().valfinish(cumval, specundefined, val),
        resultopts = specmob().valfinish(cumval, specopts, val);
    
    expect( resultundefined.cumvalprop ).toBe( 1 );
    expect( resultundefined.valprop ).toBe( 1 );

    expect( resultopts.cumvalprop ).toBe( 1 );
    expect( resultopts.valprop ).toBe( 1 );    
  });

  it('should define val on cumval.value, when values are not merged', () => {
    let cumval = { cumvalprop : 1 },
        spec = { type : 'literal' },
        val = 1;
    
    let result = specmob().valfinish(cumval, spec, val);

    expect( result.cumvalprop ).toBe( 1 );
    expect( result.value ).toBe( 1 );
  });

  it('should define val on cumval[spec.name], when values are not merged and spec.name is defined', () => {
    let cumval = { cumvalprop : 1 },
        spec = { type : 'literal',
                 name : 'name' },
        val = 1;
    
    let result = specmob().valfinish(cumval, spec, val);
    
    expect( result.cumvalprop ).toBe( 1 );
    expect( result.name ).toBe( 1 );
  });  
  
});


describe('specmob.valfinish( sess, cfg, graph, node, namespace, opts, val, fn )', () => {

  it('should return value if it is not null or undefined', (done) => {    
    specmob().valordefaultval(sess, cfg, graph, node, namespace, opts, 'value', (err, res) => {
      expect( res ).toBe( 'value' );

      done();
    });
  });

  it('should return value if it is null or undefined AND opts.defaultval is not defined', (done) => {    
    specmob().valordefaultval(sess, cfg, graph, node, namespace, opts, null, (err, res) => {
      expect( res ).toBe( null );

      done();
    });
  });

  it('should return value if it is not null or undefned and opts.defaultval is defined', (done) => {    
    specmob().valordefaultval(sess, cfg, graph, node, namespace, {
      defaultval : 'defultval'
    }, 'value', (err, res) => {
      expect( res ).toBe( 'value' );

      done();
    });
  });  

  it('should return opts.defaultval when defined AND value is null or undefined', (done) => {    
    specmob().valordefaultval(sess, cfg, graph, node, namespace, {
      defaultval : 'defaultval'
    }, null, (err, res) => {
      expect( res ).toBe( 'defaultval' );

      done();
    });
  });

  it('should return opts.defaultval string definition', (done) => {    
    specmob().valordefaultval(sess, cfg, graph, node, namespace, {
      defaultval : 'defaultval'
    }, null, (err, res) => {
      expect( res ).toBe( 'defaultval' );

      done();
    });
  });

  it('should return opts.defaultval spec definition', (done) => {    
    specmob().valordefaultval(sess, cfg, graph, node, namespace, {
      defaultval : {
        type : 'literal',
        value : 'defaultval'
      }
    }, null, (err, res) => {
      expect( res ).toBe( 'defaultval' );

      done();
    });
  });    
  
});

describe('specmob.getnamespaceargval( graph, node, opts, namespace, thisval, arg )', () => {

  it('should return thisval, when arg is "this"', () => {
    expect(
      specmob().getnamespaceargval( graph, node, opts, namespace, 'thisval', 'this')
    ).toBe( 'thisval' );
  });

  it('should return property lookup from namespace, when arg is not "this"', () => {
    expect(
      specmob().getnamespaceargval( graph, node, opts, { hello : 'world' }, 'thisval', 'hello')
    ).toBe( 'world' );
  });

  it('should throw an error if namespace is not defined and arg is not "this"', () => {
    expect(
      () =>
        specmob().getnamespaceargval( graph, node, opts, null, 'thisval', 'hello')
    ).toThrowError( );
  });
  
});

describe('specmob.getargs( graph, node, opts, namespace, thisval, arg )', () => {

  it('should return a list of args from the given namespace', () => {

    let args = specmob().getargs( graph, node, {
      argprops : ['prop1', 'prop2', 'this']
    }, {
      prop1 : 'val1',
      prop2 : 'val2'
    });
    
    expect( args[0] ).toBe( 'val1' );
    expect( args[1] ).toBe( 'val2' );
    expect( args[2].prop1 ).toBe( 'val1' );
    
  });

  it('should return dynamic args', () => {    
    let args = specmob().getargs(sess, cfg, {
      argprops : ['actionframe', 'modeldata.type']
    }, {
      actionframe : 'actionframe',
      modeldata : { type : 'actionframe' }
    });

    expect(args[0]).toBe('actionframe');
    expect(args[1]).toBe('actionframe');
  });  
  
});

describe('specmob.objlookup( namespacestr, obj )', () => {

  it('should return "world", for "hello" and `{hello: "world"}`', () => {
    expect(
      specmob().objlookup('hello', {hello:'world'})
    ).toBe( 'world' );
  });
  
  it('should return "world", for "hello.my" and `{hello:{my:"world"}}`', () => {
    expect(
      specmob().objlookup('hello.my', {hello:{my:'world'}})
    ).toBe( 'world' );
  });

  it('should return "world", for "hello.0" and `{hello:{0:"world"}}`', () => {
    expect(
      specmob().objlookup('hello.0', {hello:{0:'world'}})
    ).toBe( 'world' );
  });
  
});

describe('specmob.retobjprop( sess, cfg, graph, node, namespace, opts, fn )', () => {

  it('should return an object property from the given namespace', (done) => {
    specmob().retobjprop(sess, cfg, graph, node, {
      hello : { my : 'world' }
    }, {
      type : 'objprop',
      propname : 'hello.my'
    }, (err, res) => {
      expect(res).toBe('world');
      done();
    });    
  });

  it('should return a opts.defaultval if defined and object property is null or undefined from the given namespace', (done) => {
    specmob().retobjprop(sess, cfg, graph, node, {
      hello : {}
    }, {
      type : 'objprop',
      propname : 'hello.my',
      name : 'myprop',
      defaultval : {
        type : 'literal',
        value : 'defaultworld'
      }
    }, (err, res) => {
      expect(res).toBe('defaultworld');
      done();
    });    
  });

  it('should return a values for numeric properties', (done) => {
    specmob().retobjprop(sess, cfg, graph, node, {
      hello : ['world']
    }, {
      type : 'objprop',
      propname : 'hello.0',
      name : 'myprop'
    }, (err, res) => {
      expect(res).toBe('world');
      done();
    });    
  });
});

describe('specmob.retfn( sess, cfg, graph, node, namespace, opts, fn )', () => {
  it('should return a function value', (done) => {

    specmob({}, {
      getmodifiedval : ([val], opts, sess, cfg, graph, node) => (
        val + 'modified'
      )
    }).retfn(sess, cfg, graph, node, {
      hello : 'world'
    }, {
      type : 'fn',
      fnname : 'getmodifiedval',
      argprops : ['hello']
    }, (err, res) => {
      expect(res).toBe('worldmodified');
      done();
    });
    
  });

  it('should throw an error if named-property fnname is not present', () => {

    expect(
      () =>
        specmob({}, {
          getmodifiedval : ([val], opts, sess, cfg, graph, node) => (
            val + 'modified'
          )
        }).retfn(sess, cfg, graph, node, {
          hello : 'world'
        }, {
          type : 'fn',
          //fnname : 'getmodifiedval',
          argprops : ['hello']
        }, (err, res) => {})
    ).toThrowError();
  });

  it('should throw an error if fnname function is not found', () => {

    expect(
      () =>
        specmob({}, {
          //getmodifiedval : ([val], opts, sess, cfg, graph, node) => (
          //  val + 'modified'
          //)
        }).retfn(sess, cfg, graph, node, {
          hello : 'world'
        }, {
          type : 'fn',
          fnname : 'getmodifiedval',
          argprops : ['hello']
        }, (err, res) => {})
    ).toThrowError();
  });
  
  
});

describe('specmob.retcb( sess, cfg, graph, node, namespace, opts, fn )', () => {
  
  it('should return a callback value', (done) => {
    var node = {
      world : 'world'
    };    
    
    specmob({
      getmodifiedval : ([val], opts, fn, sess, cfg, graph, node) => (
        fn(null, val + 'modified')
      )
    }, {}).retcb(sess, cfg, graph, node, {
      hello : 'world'
    }, {
      type : 'cb',
      cbname : 'getmodifiedval',
      argprops : ['hello']
    }, (err, res) => {
      expect(res).toBe('worldmodified');
      done();
    });
  });

  it('should throw an error if named-property cbname is not present', () => {

    expect(
      () =>
        specmob({
          getmodifiedval : ([val], opts, sess, cfg, graph, node) => (
            val + 'modified'
          )
        },{}).retcb(sess, cfg, graph, node, {
          hello : 'world'
        }, {
          type : 'cb',
          //cbname : 'getmodifiedval',
          argprops : ['hello']
        }, (err, res) => {})
    ).toThrowError();
  });

  it('should throw an error if cbname function is not found', () => {
    expect(
      () =>
        specmob({
          //getmodifiedval : ([val], opts, sess, cfg, graph, node) => (
          //  val + 'modified'
          //)
        },{}).retcb(sess, cfg, graph, node, {
          hello : 'world'
        }, {
          type : 'cb',
          cbname : 'getmodifiedval',
          argprops : ['hello']
        }, (err, res) => {})
    ).toThrowError();
  });
  
});

describe('specmob.retobj( sess, cfg, graph, node, namespace, opts, fn )', () => {

  it('should return a single literal value', (done) => {
    
    specmob().retobj(sess, cfg, graph, node, namespace, {
      type : 'obj',
      optarr : [{
        'myprop' : 'myvalue'
      }]
    }, (err, res) => {
      expect(res.myprop).toBe('myvalue');
      done();
    });
  });

  it('should return multiple literal values', (done) => {
    specmob().retobj(sess, cfg, graph, node, namespace, {
      type : 'obj',
      optarr : [{
        myprop1 : 'myvalue1'
      },{
        myprop2 : 'myvalue2'
      }]
    }, (err, res) => {    
      expect(res.myprop1 + res.myprop2).toBe('myvalue1myvalue2');
      done();
    });    
  });
  
  it('should obtain an array of values', (done) => {
    specmob({}, {
      getmodifiedval : ([val], opts, sess, cfg, graph, node) => (
        val + 'modified'
      )
    }).retobj(sess, cfg, graph, node, {
      hello : 'world'
    }, [{
      type : 'fn',
      fnname : 'getmodifiedval',
      name : 'modifiedval',
      argprops : ['hello']
    },{
      type : 'literal',
      value : 'worldliteral',
      name : 'literalval',
      argprops : ['hello']
    }], (err, res) => {
      
      expect(res.modifiedval).toBe('worldmodified');
      expect(res.literalval).toBe('worldliteral');
      
      done();
    });
  });
});

describe('specmob.retoptarr( sess, cfg, graph, node, namespace, opts, fn )', () => {
  
  it('should return a new array of data from a set of dynamic patterns', (done) => {

    specmob({}, {
      gettuesday : (sess, cfg, graph, node, opts) => 
        'tuesday',
      getwednesday : (sess, cfg, graph, node, opts) =>
        'wednesday'
    }).retoptarr(sess, cfg, graph, node, namespace, {
      type : 'optarr',
      optarr : [{
        type : 'fn',
        fnname : 'gettuesday'
      },{
        type : 'fn',
        fnname : 'getwednesday'
      }]
    }, (err, res) => {
      expect(res[1]).toBe('wednesday');
      done();
    });    
  });
});

describe('specmob.retDataWHERE( sess, cfg, graph, node, basearr, namespace, query, fn )', () => {

  it('should obtain a query', (done) => {
    
    specmob({}, {}).retDataWHERE(sess, cfg, graph, node, [{
      type : 0,
      value : 'california'
    },{
      type : 1,
      value : 'oregon'
    },{
      type : 2,
      value : 'washington'
    }], namespace, {
      activeKeyArr : [1],
      baseKey : {
        type : 'objprop',
        propname : 'type'
      }
    }, (err, res) => {
      expect(res[0].value).toBe('oregon');
      done();
    });
  });

  it('should obtain a query for multiple values', (done) => {
    
    specmob({}, {}).retDataWHERE(sess, cfg, graph, node, [{
      type : 0,
      value : 'california'
    },{
      type : 1,
      value : 'oregon'
    },{
      type : 2,
      value : 'washington'
    }], namespace, {
      activeKeyArr : [1,0],
      baseKey : {
        type : 'objprop',
        propname : 'type'
      }
    }, (err, res) => {
      expect(res[0].value).toBe('oregon');
      expect(res[1].value).toBe('california');
      done();
    });
  });  

});


describe('specmob.applyfilterarr( sess, cfg, graph, node, namespace, filterarr, fn )', () => {
  it('should apply a sequence of filters', (done) => {

    specmob({}, {
      strip : ([val], opts, sess, cfg, graph, node) =>
        String(val).trim(),
      tonum : ([val], opts, sess, cfg, graph, node) =>
        +val,
      add5 : ([val], opts, sess, cfg, graph, node) =>
        val + 5
    }).getfiltered(sess, cfg, graph, node, { val : '55' }, [{
      type : 'fn',
      fnname : 'strip',
      argprops : ['val']
    },{
      type : 'fn',
      fnname : 'tonum',
      argprops : ['val']
    },{
      type : 'fn',
      fnname : 'add5',
      argprops : ['val']
    }], (err, res) => {
      
      expect(res).toBe(60);
      
      done();
    });
  });
});

