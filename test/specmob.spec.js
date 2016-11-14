// Filename: specmob.spec.js  
// Timestamp: 2016.11.11-23:25:22 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

var specmob = require('../');

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

    var node = {
      hello : {
        my : 'world'
      }
    };
    
    specmob().retobjprop({}, {}, {}, node, opts, (err, res) => {
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
    
    specmob().retobjprop({}, {}, {}, node, opts, (err, res) => {
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
    
    specmob().retmethod({}, {}, {}, node, opts, (err, res) => {
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
    }).retobjarr({}, {}, {}, node, opts, (err, res) => {
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
    }).retoptarr({}, {}, {}, node, opts, (err, res) => {
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
    
    specmob().retproparr({}, {}, {}, {}, opts, (err, res) => {
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
    
    specmob().retproparr({}, {}, {}, {}, opts, (err, res) => {
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
      getmodifiedval : (sess, cfg, graph, node, opts) => (
        node.world + 'modified'
      )
    }).retobj({}, {}, {}, node, optarr, (err, res) => {
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
      getmodifiedval : (sess, cfg, graph, node, opts) => (
        node.val + 'modified'
      )
    }).retarr({}, {}, {}, {}, opt, objarr, (err, res) => {
      expect(res[0]).toBe('helloemailmodified');
      expect(res[1]).toBe('hellopassmodified');      
      done();
    });
  });

  it("should return an empty array by default", (done) => {    
    specmob({}, {}).retarr({}, {}, {}, {}, {}, null, (err, res) => {
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
    
    specmob({}, {}).retDataWHERE({}, {}, {}, basearr, {
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
    
    specmob({}, {}).retDataWHERE({}, {}, {}, basearr, {
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
    specmob({}, {
      strip : (sess, cfg, graph, node, opts) => 
        Object.assign(
          {}, node, { [opts.propname] : node[opts.propname].trim() }
        ),
      tonum : (sess, cfg, graph, node, opts) =>
        Object.assign(
          {}, node, { [opts.propname] : +node[opts.propname] }
        ),
      add5 : (sess, cfg, graph, node, opts) =>
        Object.assign(
          {}, node, { [opts.propname] : node[opts.propname] + 5 }
        )
    }).applySpecFilters({}, {}, {}, {val : ' 55 '}, [{
      type : "fn",
      fnname : 'strip',
      options : { propname : 'val' }
    },{
      type : "fn",
      fnname : 'tonum',
      options : { propname : 'val' }
    },{
      type : "fn",
      fnname : 'add5',
      options : { propname : 'val' }
    }], (err, res) => {
      expect(res.val).toBe(60);
      
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
      getmodifiedval : (sess, cfg, graph, node, opts) => (
        node.world + 'modified'
      )
    }).retfn({}, {}, {}, node, opts, (err, res) => {
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
      getmodifiedval : (sess, cfg, graph, node, opts) => (
        node.world + 'modified'
      )
    }).retfn({}, {}, {}, node, opts, (err, res) => {
      expect(res).toBe('worldmodified');
      done();
    });
  });
});
