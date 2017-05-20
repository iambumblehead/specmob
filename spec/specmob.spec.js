// Filename: specmob.spec.js  
// Timestamp: 2017.05.17-15:06:53 (last modified)
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
    specmob().valordefaultval(sess, cfg, graph, node, namespace, opts, 'value', (err, res, graph) => {
      expect( res ).toBe( 'value' );

      done();
    });
  });

  it('should return value if it is null or undefined AND opts.defaultval is not defined', (done) => {    
    specmob().valordefaultval(sess, cfg, graph, node, namespace, opts, null, (err, res, graph) => {
      expect( res ).toBe( null );

      done();
    });
  });

  it('should return value if it is not null or undefned and opts.defaultval is defined', (done) => {    
    specmob().valordefaultval(sess, cfg, graph, node, namespace, {
      defaultval : 'defultval'
    }, 'value', (err, res, graph) => {
      expect( res ).toBe( 'value' );

      done();
    });
  });  

  it('should return opts.defaultval when defined AND value is null or undefined', (done) => {    
    specmob().valordefaultval(sess, cfg, graph, node, namespace, {
      defaultval : 'defaultval'
    }, null, (err, res, graph) => {
      expect( res ).toBe( 'defaultval' );

      done();
    });
  });

  it('should return opts.defaultval string definition', (done) => {    
    specmob().valordefaultval(sess, cfg, graph, node, namespace, {
      defaultval : 'defaultval'
    }, null, (err, res, graph) => {
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
    }, null, (err, res, graph) => {
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
    }, (err, res, graph) => {
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
    }, (err, res, graph) => {
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
    }, (err, res, graph) => {
      expect(res).toBe('world');
      done();
    });    
  });
});

describe('specmob.retfn( sess, cfg, graph, node, namespace, opts, fn )', () => {

  it('should return a function value', (done) => {

    specmob({
      specfn : {
        getmodifiedval : ([val], opts, sess, cfg, graph, node) => (
          val + 'modified'
        )
      }
    }).retfn(sess, cfg, graph, node, {
      hello : 'world'
    }, {
      type : 'fn',
      fnname : 'getmodifiedval',
      argprops : ['hello']
    }, (err, res, graph) => {
      expect(res).toBe('worldmodified');
      done();
    });
    
  });

  it('should throw an error if named-property fnname is not present', () => {

    expect(
      () =>
        specmob({
          specfn : {
            getmodifiedval : ([val], opts, sess, cfg, graph, node) => (
              val + 'modified'
            )
          }
        }).retfn(sess, cfg, graph, node, {
          hello : 'world'
        }, {
          type : 'fn',
          //fnname : 'getmodifiedval',
          argprops : ['hello']
        }, (err, res, graph) => {})
    ).toThrowError();
  });

  it('should throw an error if fnname function is not found', () => {

    expect(
      () =>
        specmob({
          //getmodifiedval : ([val], opts, sess, cfg, graph, node) => (
          //  val + 'modified'
          //)
        }).retfn(sess, cfg, graph, node, {
          hello : 'world'
        }, {
          type : 'fn',
          fnname : 'getmodifiedval',
          argprops : ['hello']
        }, (err, res, graph) => {})
    ).toThrowError();
  });
  
});

describe('specmob.retcb( sess, cfg, graph, node, namespace, opts, fn )', () => {

  it('should return a callback value', (done) => {
    var node = {
      world : 'world'
    };    
    
    specmob({
      speccb : {
        getmodifiedval : ([val], opts, fn, sess, cfg, graph, node) => (
          fn(null, val + 'modified')
        )
      }
    }).retcb(sess, cfg, graph, node, {
      hello : 'world'
    }, {
      type : 'cb',
      cbname : 'getmodifiedval',
      argprops : ['hello']
    }, (err, res, graph) => {
      expect(res).toBe('worldmodified');
      done();
    });
  });

  it('should throw an error if named-property cbname is not present', () => {
    expect(
      () =>
        specmob({
          speccb : {
            getmodifiedval : ([val], opts, sess, cfg, graph, node) => (
              val + 'modified'
            )
          }
        }).retcb(sess, cfg, graph, node, {
          hello : 'world'
        }, {
          type : 'cb',
          //cbname : 'getmodifiedval',
          argprops : ['hello']
        }, (err, res, graph) => {})
    ).toThrowError();
  });

  it('should throw an error if cbname function is not found', () => {
    expect(
      () =>
        specmob({
          //getmodifiedval : ([val], opts, sess, cfg, graph, node) => (
          //  val + 'modified'
          //)
        }).retcb(sess, cfg, graph, node, {
          hello : 'world'
        }, {
          type : 'cb',
          cbname : 'getmodifiedval',
          argprops : ['hello']
        }, (err, res, graph) => {})
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
    }, (err, res, graph) => {
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
    }, (err, res, graph) => {    
      expect(res.myprop1 + res.myprop2).toBe('myvalue1myvalue2');
      done();
    });    
  });
  
  it('should obtain an array of values', (done) => {
    specmob({
      specfn : {
        getmodifiedval : ([val], opts, sess, cfg, graph, node) => (
          val + 'modified'
        )
      }
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
    }], (err, res, graph) => {
      
      expect(res.modifiedval).toBe('worldmodified');
      expect(res.literalval).toBe('worldliteral');
      
      done();
    });
  });
});

describe('specmob.retoptarr( sess, cfg, graph, node, namespace, opts, fn )', () => {

  it('should return a new array of data from a set of dynamic patterns', (done) => {

    specmob({
      specfn : {
        gettuesday : (sess, cfg, graph, node, opts) => 
          'tuesday',
        getwednesday : (sess, cfg, graph, node, opts) =>
          'wednesday'
      }
    }).retoptarr(sess, cfg, graph, node, namespace, {
      type : 'optarr',
      optarr : [{
        type : 'fn',
        fnname : 'gettuesday'
      },{
        type : 'fn',
        fnname : 'getwednesday'
      }]
    }, (err, res, graph) => {
      expect(res[1]).toBe('wednesday');
      done();
    });    
  });
});

describe('specmob.retDataWHERE( sess, cfg, graph, node, basearr, namespace, query, fn )', () => {

  it('should obtain a query', (done) => {
    
    specmob().retDataWHERE(sess, cfg, graph, node, [{
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
    }, (err, res, graph) => {
      expect(res[0].value).toBe('oregon');
      done();
    });
  });

  it('should obtain a query for multiple values', (done) => {
    
    specmob().retDataWHERE(sess, cfg, graph, node, [{
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
    }, (err, res, graph) => {
      expect(res[0].value).toBe('oregon');
      expect(res[1].value).toBe('california');
      done();
    });
  });  

});


describe('specmob.applyfilterarr( sess, cfg, graph, node, namespace, filterarr, fn )', () => {

  it('should apply a sequence of filters', (done) => {

    specmob({
      specfn : {
        strip : ([val], opts, sess, cfg, graph, node) =>
          String(val).trim(),
        tonum : ([val], opts, sess, cfg, graph, node) =>
          +val,
        add5 : ([val], opts, sess, cfg, graph, node) =>
          val + 5
      }
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
    }], (err, res, graph) => {
      
      expect(res).toBe(60);
      
      done();
    });
    
  });
});

describe('specmob.applyfilterarr( sess, cfg, graph, node, namespace, filterarr, fn )', () => {
  it('should apply a sequence of filters', (done) => {

    specmob({
      speccb : {
        requestmonthlyhoroscope : ([val], opts, fn) => (
          // maybe this returns a service communication...
          opts.thismonth % 2
            ? fn(null, 'you have good luck this month!')
            : fn(null, 'you have okay luck this month!')
        )
      },
      
      specfn : {
        getdate : ([val], opts) =>
          new Date(), 
        
        getmonthfromdate : ([val], opts) => {
          console.log('opts and val', val, opts);
          
          let month = opts.date.getMonth() + 1;

          return opts.format === 'mm'
            ? ('0' + month).slice(-2) // 0 padded
            : month;
        }
      }
    }).retopt(sess, cfg, graph, node, namespace, {
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
    }, (err, res, graph) => {

      expect(res.startsWith('you have ')).toBe(true);
      
      done();
    });
    
  });
});

describe('specmob.retregexp', () => {

  it('should allow for the definition and usage of the "regexp" pattern', (done) => {

    let speccb = {},
        specfn = {
          isregexp : ([val], opts, sess, cfg, graph, node) =>
            opts.re.test(opts.string)
        };
    
    let specmobinterpreter = specmob({speccb, specfn});

    specmobinterpreter.retregexp = (sess, cfg, graph, node, namespace, opts, fn) => {
      fn(null, new RegExp(opts.value, opts.modifiers), graph);
    };

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
    }, (err, res, graph) => {

      expect(res).toBe(true);

      done();
    });
    
  })
});


describe('specmob.getpass( sess, cfg, graph, node, namespace, spec, fn )', () => {

  it('should evaluate `true` for a pattern that is true', (done) => {
    let speccb = {},
        specfn = {
          isstring : ([val], opts, sess, cfg, graph, node) =>
            typeof val === 'string',
          
          isgtlength : ([val], opts, sess, cfg, graph, node) =>
            (String(val).length - 1) >= opts.length
        };
    
    let specmobinterpreter = specmob({speccb, specfn});

    specmobinterpreter.getpass(sess, cfg, graph, node, {
      testvalue : 'testvalue'
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
        options : { length : 4 },
        argprops : ['testvalue'],
        errkey : 'notlongenough'
      }]
    }, (err, errmsg, ispass) => {

      expect( ispass ).toBe( true );
      done();
      
    });
    
  });


  it('should evaluate `false` for a pattern that is false', (done) => {
    let speccb = {},
        specfn = {
          isstring : ([val], opts, sess, cfg, graph, node) =>
            typeof val === 'string',
          
          isgtlength : ([val], opts, sess, cfg, graph, node) =>
            (String(val).length - 1) >= opts.length
        };
    
    let specmobinterpreter = specmob({speccb, specfn});

    specmobinterpreter.getpass(sess, cfg, graph, node, {
      testvalue : 'sm'
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
        options : { length : 4 },
        argprops : ['testvalue'],
        errkey : 'notlongenough'
      }]
    }, (err, errmsg, ispass) => {

      expect( ispass ).toBe( false );
      done();

    });
    
  });


  it('should return given errkey (if defined) for pattern that evaluates `false`', (done) => {
    let speccb = {},
        specfn = {
          isstring : ([val], opts, sess, cfg, graph, node) =>
            typeof val === 'string',
          
          isgtlength : ([val], opts, sess, cfg, graph, node) =>
            (String(val).length - 1) >= opts.length
        };
    
    let specmobinterpreter = specmob({speccb,specfn});

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

      expect( errkey ).toBe( 'notlongenough' );
      done();

    });
    
  });    

});
