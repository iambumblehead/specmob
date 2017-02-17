// Filename: specmob.spec.js  
// Timestamp: 2017.02.17-10:25:25 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const specmob = require('../'),
      
      namespace = 'namespace',
      rules = 'rules',
      graph = 'graph',
      node = 'node',
      sess = 'sess',
      cfg = 'cfg',

      namespaceo = {namespace},
      ruleso = {rules},
      grapho = {graph},
      nodeo = {node},
      sesso = {sess},
      cfgo = {cfg};


describe("specmob.objlookup", () => {
  it("should return 'world', for 'hello.my' and `{hello:{my:'world'}}`", () => {
    
    expect(
      specmob().objlookup('hello.my', {hello:{my:'world'}})
    ).toBe( 'world' );
    
  });
});


describe("specmob.retobjprop", () => {

  it("should ret an object property", (done) => {
    var opts = {
      type : "objprop",
      propname : "hello.my"
    };

    var namespace = {
      hello : {
        my : 'world'
      }
    };
    
    specmob().retobjprop(sesso, cfgo, grapho, nodeo, namespace, opts, (err, res) => {
      expect(res).toBe('world');
      done();
    });    
  });

  it("should ret an object property, but if not found return defaultVal", (done) => {
    var opts = {
      type : "objprop",
      propname : "hello.my",
      name : "myprop",
      defaultval : {
        type : "literal",
        value : "defaultworld"
      }
    };

    var node = {};
    
    specmob().retobjprop({}, {}, {}, node, {}, opts, (err, res) => {
      expect(res).toBe('defaultworld');
      done();
    });    
  });  

});

describe("specmob.retmethod", () => {
  it("should ret an object property", (done) => {
    var opts = {
      type : "method",
      methodname : "getpropname"
    };

    var node = {
      getpropname : () => 'world'
    };
    
    specmob().retmethod({}, {}, {}, node, {}, opts, (err, res) => {
      expect(res).toBe('world');
      done();
    });    
  });
});

describe("specmob.retobjarr", () => {
  it("should ret a new set of data from a fixed set of dynamic data", (done) => {
    var opts = {
      type : "objarr",
      objarr : [{
        type : "fn",
        name : "companyWebAddress",
        fnname : "gettuesday",
        propName : "domain"
      },{
        type : "fn",
        name : "companyAddress",
        fnname : "getwednesday",
        propName : "address"
      }]
    };

    var node = {};
    
    specmob({}, {
      gettuesday : (sess, cfg, graph, node, opts) => 
        'tuesday',
      getwednesday : (sess, cfg, graph, node, opts) =>
        'wednesday'
    }).retobjarr({}, {}, {}, node, {}, opts, (err, res) => {
      expect(res[1].value).toBe('wednesday');
      done();
    });    
  });
});


describe("specmob.retoptarr", () => {
  it("should ret a new set of data from a fixed set of dynamic data", (done) => {
    var opts = {
      type : "optarr",
      optarr : [{
        type : "fn",
        name : "companyWebAddress",
        fnname : "gettuesday"
      },{
        type : "fn",
        name : "companyAddress",
        fnname : "getwednesday"
      }]
    };

    var node = {};
    
    specmob({}, {
      gettuesday : (sess, cfg, graph, node, opts) => 
        'tuesday',
      getwednesday : (sess, cfg, graph, node, opts) =>
        'wednesday'
    }).retoptarr({}, {}, {}, node, {}, opts, (err, res) => {
      expect(res[1]).toBe('wednesday');
      done();
    });    
  });
});

describe("specmob.retproparr", () => {
  it("should ret a single literal value", (done) => {
    var opts = {
      type : "proparr",
      optarr : [{
        type : "literal",
        value : "myvalue",
        name : "myprop"
      }]
    };
    
    specmob().retproparr({}, {}, {}, {}, {}, opts, (err, res) => {
      expect(res.myprop).toBe('myvalue');
      done();
    });
  });

  it("should ret multiple literal values", (done) => {
    var opts = {
      type : "proparr",
      optarr : [{
        type : "literal",
        value : "myvalue",
        name : "myprop"
      },{
        type : "literal",
        value : "myvalue2",
        name : "myprop2"
      }]
    };
    
    specmob().retproparr({}, {}, {}, {}, {}, opts, (err, res) => {
      expect(res.myprop + res.myprop2).toBe('myvaluemyvalue2');
      done();
    });    
  });
});

describe("specmob.retobj", () => {
  it("should obtain an array of values", (done) => {
    var optarr = [{
      type : "fn",
      fnname : "getmodifiedval",
      name : "modifiedval"
    },{
      type : "literal",
      value : "worldliteral",
      name : "literalval"
    }];

    var node = {
      world : 'world'
    };
    
    specmob({}, {
      getmodifiedval : ([], opts, sess, cfg, graph, node) => (
        node.world + 'modified'
      )
    }).retobj(sesso, cfgo, grapho, node, {}, optarr, (err, res) => {
      expect(res.modifiedval).toBe('worldmodified');
      expect(res.literalval).toBe('worldliteral');      
      done();
    });
  });
});

describe("specmob.objArrApplyOption", () => {
  it("should obtain an array of values", (done) => {
    var opt = {
      type : "fn",
      fnname : "getmodifiedval",
      name : "modifiedval"
    };

    var objarr = [{
      name : 'email',
      val : 'helloemail'
    },{
      name : 'pass',
      val : 'hellopass'
    }];
    
    specmob({}, {
      getmodifiedval : ([], opts, sess, cfg, graph, node) => (
        node.val + 'modified'
      )
    }).retarr(sesso, cfgo, grapho, nodeo, namespaceo, opt, objarr, (err, res) => {
      expect(res[0]).toBe('helloemailmodified');
      expect(res[1]).toBe('hellopassmodified');      
      done();
    });
  });

  it("should return an empty array by default", (done) => {    
    specmob({}, {}).retarr(sesso, cfgo, grapho, nodeo, namespaceo, {}, null, (err, res) => {
      expect(res.length).toBe(0);
      done();
    });
  });  

});


describe("specmob.retDataWHERE", () => {

  it("should obtain a query", (done) => {
    var opt = {
      type : "fn",
      fnname : "getmodifiedval",
      name : "modifiedval"
    };

    var basearr = [{
      type : 0,
      value : 'california'
    },{
      type : 1,
      value : 'oregon'
    },{
      type : 2,
      value : 'washington'      
    }];
    
    specmob({}, {}).retDataWHERE(sesso, cfgo, grapho, nodeo, basearr, namespaceo, {
      activeKeyArr : [1],
      baseKey : {
        type : "objprop",
        propname : "type"
      }
    }, (err, res) => {
      expect(res[0].value).toBe('oregon');
      done();
    });
  });

  it("should obtain a query for multiple values", (done) => {
    var opt = {
      type : "fn",
      fnname : "getmodifiedval",
      name : "modifiedval"
    };

    var basearr = [{
      type : 0,
      value : 'california'
    },{
      type : 1,
      value : 'oregon'
    },{
      type : 2,
      value : 'washington'      
    }];
    
    specmob({}, {}).retDataWHERE(sesso, cfgo, grapho, nodeo, basearr, namespaceo, {
      activeKeyArr : [1,0],
      baseKey : {
        type : "objprop",
        propname : "type"
      }
    }, (err, res) => {
      expect(res[0].value).toBe('oregon');
      expect(res[1].value).toBe('california');
      done();
    });
  });  

});


describe("specmob.applySpecFilters", () => {
  it("should apply a sequence of filters", (done) => {

    namespaceo.val = '55';
    
    specmob({}, {
      strip : ([val], opts, sess, cfg, graph, node) =>
        String(val).trim(),
      tonum : ([val], opts, sess, cfg, graph, node) =>
         +val,
      add5 : ([val], opts, sess, cfg, graph, node) =>
         val + 5
      }).getfiltered(sesso, cfgo, grapho, nodeo, namespaceo, [{
      type : "fn",
      fnname : 'strip',
      argprops : ['val']
    },{
      type : "fn",
      fnname : 'tonum',
      argprops : ['val']
    },{
      type : "fn",
      fnname : 'add5',
      argprops : ['val']
    }], (err, res) => {
      
      
      expect(res).toBe(60);
      
      done();
    });
  });
});


describe("specmob.getargs", () => {
  it("should return dynamic args", () => {

    let spec = {
      argprops : [
        "actionframe",
        "modeldata.type"
      ]
    };

    let namespace = {
      actionframe : "actionframe",
      modeldata : { type : "actionframe" }
    };
    
    let args = specmob().getargs({}, {}, spec, namespace);

    expect(args[0]).toBe('actionframe');
    expect(args[1]).toBe('actionframe');
  });
});

describe("specmob.retfn", () => {
  it("should ret a function value", (done) => {
    var opts = {
      type : "fn",
      fnname : "getmodifiedval"
    };

    var node = {
      world : 'world'
    };    
    
    specmob({}, {
      getmodifiedval : ([val], opts, sess, cfg, graph, node) => (
        node.world + 'modified'
      )
    }).retfn(sesso, cfgo, grapho, node, namespaceo, opts, (err, res) => {
      expect(res).toBe('worldmodified');
      done();
    });
  });
});

describe("specmob.retfn", () => {
  it("should ret a function value", (done) => {
    var opts = {
      type : "fn",
      fnname : "getmodifiedval"
    };

    var node = {
      world : 'world'
    };    
    
    specmob({}, {
      getmodifiedval : ([val], opts, sess, cfg, graph, node) => (
        node.world + 'modified'
      )
    }).retfn(sesso, cfgo, grapho, node, namespaceo, opts, (err, res) => {
      expect(res).toBe('worldmodified');
      done();
    });
  });
});
