// Filename: specmob.js  
// Timestamp: 2016.11.07-01:07:11 (last modified)
// Author(s): Bumblehead (www.bumblehead.com)  
//
// spec data directs the collection of values here.
//
// async code is unavoidable, some data and validation methods may require 
// communication w/ server.

const accumasync = require('accumasync'),
      fnguard = require('fnguard');

const specmob = module.exports = (cbObj, fnObj, o = {}) => { 

  o.fn = (obj, name, type) => {
    if (name in obj && typeof obj[name] === 'function') {
      return obj[name];
    } else {
      throw new Error('no '+type+': '+name);
    }
  };

  o.getcb = name => o.fn(cbObj, name, 'cbfn');
  
  o.getfn = name => o.fn(fnObj, name, 'fnfn');

  o.getnode = (graph, node, relnodepath = './') =>
    typeof o.getgraphnode === 'function'
      ? o.getgraphnode(graph, node, relnodepath)
      : node;

  o.objlookup = (namespaceStr, obj) => 
    namespaceStr.split('.').reduce((a, b) => a ? a[b] : null, obj);

  // call a specific node-associated method 
  //
  // "subjectData" : {
  //  "type" : "method",
  //  "methodname" : "getpropname"  
  // },  
  o.retmethod = (sess, cfg, graph, node, opts, fn) => {
    fnguard.isobj(sess, cfg, graph, node, opts)
      .isstr(opts.methodname).isfn(fn);

    let method = o.fn(
      o.getnode(graph, node, opts.nodepath),
      opts.methodname, 'method');
    
    fn(null, method(sess, cfg, graph, node, opts.methodVal || opts));
  };

  // obtain a value on a node property property
  //
  // if !object, a defaultval may be used. ex, ad defaltval of type literal
  // 
  // "subjectData" : {
  //  "type" : "objprop",
  //  "propname" : "obj.currency",
  //  "defaultval" : {
  //    "type" : "literal",
  //    "value" : "USD"
  //  }
  // },  
  o.retobjprop = (sess, cfg, graph, node, opts, fn) => {
    fnguard.isobj(sess, cfg, graph, opts).isany(node)
      .isstr(opts.propname).isfn(fn);

    // if nodepath
    //   optain property from other node if node
    // else
    //   use current node

    let finData = o.objlookup(
      opts.propname, o.getnode(graph, node, opts.nodepath));
    
    if (finData === null ||
        finData === undefined && opts.defaultval) {
      o.retopt(sess, cfg, graph, node, opts.defaultval, fn);
    } else {
      fn(null, finData);
    }
  };
  
  // create a new object, each property is dynamically property constructed
  //
  //  "subjectData" : {
  //    "type" : "propertiesArr",
  //    "optarr" : [{
  //      "name" : "isOpen",
  //      "type" : "fn",
  //      "fnName" : "isMatchingVals",
  //      "optarr" : [{
  //        "type" : "objProperty",
  //        "propname" : "formObj.dataComplete.subjectData",
  //        "name" : "val1"
  //      },{
  //        "type" : "objProperty",
  //        "propname" : "position",
  //        "name" : "val2"
  //      }]
  //    }]
  //  },
  //
  o.retproparr = (sess, cfg, tree, node, opts, fn) => {
    fnguard.isobj(sess, cfg, tree, node, opts)
      .isarr(opts.optarr).isfn(fn);

    accumasync.arr(opts.optarr, {}, (option, prev, next) => {
      o.retopt(sess, cfg, tree, node, option, (err, res) => {
        if (err) return fn(err);

        prev[option.name] = res;
        next(null, prev);
      });
    }, fn);
  };
  
  o.retfn = (sess, cfg, graph, node, opts, fn) => {
    fnguard.isobj(sess, cfg, graph, node, opts)
      .isstr(opts.fnname).isfn(fn);

    o.getopts(sess, cfg, graph, node, opts, (err, options) => {
      if (err) return fn(err);
      
      fn(null, o.getfn(opts.fnname)(sess, cfg, graph, node, options));
    });
  };

  // options should be value
  o.retcb = (sess, cfg, tree, node, opts, fn) => {
    fnguard.isobj(sess, cfg, tree, node, opts).isfn(fn);

    o.retobj(sess, cfg, tree, node, opts.optarr, (err, res) => {
      if (err) return fn(err);

      // formvalues and literal options may be defined alongside
      // dynamically generated options
      res = Object.assign({}, opts.options, res || {});
      
      o.getcb(opts.cbname)(sess, cfg, tree, node, res, fn);
    });
  };

  // ret a new 'set' of data from a fixed set of dynamic data
  //
  // {
  //   type : "objarr",
  //   objarr : [{
  //     type : "fn",
  //     name : "companyWebAddress",
  //     fnname : "gettuesday",
  //     propName : "domain"
  //   },{
  //     type : "fn",
  //     name : "companyAddress",
  //     fnname : "getwednesday",
  //     propName : "address"
  //   }]
  // }
  o.retobjarr = (sess, cfg, tree, node, opts, fn) => {
    fnguard.isobj(sess, cfg, tree, node, opts).isfn(fn);

    accumasync.arrf(opts.objarr, [], (elem, arr, next) => {
      let baseData = elem.baseData || elem;
      
      o.retopt(sess, cfg, tree, node, baseData, (err, res) => {
        baseData.value = res;
        arr.push(baseData);
        next(null, arr);
      });
    }, fn);
  };

  o.retobj = (sess, cfg, tree, node, optarr, fn) => {
    fnguard.isobj(sess, cfg, tree, node).isfn(fn);

    accumasync.arr(optarr, {}, (option, prev, next) => {
      o.retopt(sess, cfg, tree, node, option, (err, value) => {
        if (err) return fn(err);

        prev[option.name] = value;
        setTimeout(e => next(null, prev));        
      });        
    }, fn);
  };

  o.retoptarr = (sess, cfg, tree, node, opts, fn) => {
    fnguard.isobj(sess, cfg, tree, node, opts).isfn(fn);

    accumasync.arrf(opts.optarr, [], (elem, arr, next) => {
      o.retopt(sess, cfg, tree, node, elem, (err, res) => {
        if (err) return fn(err);
        arr.push(res);
        next(null, arr);
      });
    }, fn);
  };

  // apply a single option group to the entire arr
  o.retarr = (sess, cfg, tree, node, opts, objarr, fn) => {
    fnguard.isobj(sess, cfg, tree, node).isfn(fn);

    accumasync.arrf(objarr || [], [], (obj, prev, next) => {
      o.retopt(sess, cfg, tree, obj, opts, (err, value)  => {
        if (err) return fn(err);

        prev.push(value);
        setTimeout(x => next(null, prev));
      });        
    }, fn);
  };

  o.retregexp = (sess, cfg, tree, node, opts, fn) => {
    fnguard.isobj(sess, cfg, tree, node, opts).isfn(fn);
    
    fn(null, new RegExp(opts.value));
  };

  o.retliteral = (sess, cfg, tree, node, opts, fn) =>
    fn(null, opts.value);

  o.retthis = (sess, cfg, tree, node, opts, fn) =>
    fn(null, node);

  o.retopts = (sess, cfg, tree, node, opts, fn) =>
    fn(null, opts);

  // page may represent a data set from which subject data is defined.
  // in this case, page may be null for unselected multioption page object.
  //
  // valid default types:
  //   regexp, proparr, this,
  //   objprop, cb, fieldval,
  //   literal, fn, optarr,
  //   objarr, method
  o.retopt = (sess, cfg, tree, node, opts, fn) => {
    fnguard.isobj(sess, cfg, tree).isany(opts, node).isfn(fn);

    opts
      ? o.fn(o, 'ret'+(opts.type||'opts'), 'spec')(sess, cfg, tree, node, opts, fn)
      : fn(null, null);
  };

  // baseData where key returns a match w/ an activeKey value
  // are returned in an array
  // 
  //  var query = {
  //    baseKey : baseKey,
  //    activeKeyArr : activeKeyArr,
  //    select : selectType // single or multiple
  //  };
  //
  // if value and activeKey are not of same type, use baseKey.cast
  // to obtain correct behaviour
  //
  // pushes entire baseobject into the final array whos value matches
  // **slow**
  o.retDataWHERE = (sess, cfg, tree, basearr = [], query, fn) => {
    fnguard.isobj(sess, cfg, tree, query).isfn(fn);
    
    let keyarr = query.activeKeyArr || [],
        baseKey = query.baseKey;

    baseKey.cast === 'number'
      && keyarr.map(key => +key);

    accumasync.arr(basearr, [], (obj, prev, next) => {
      o.retopt(sess, cfg, tree, obj, baseKey, (err, value) => {
        if (err) return fn(err);
        
        if (~keyarr.indexOf(value)) {
          prev.push(obj);
        }
        setTimeout(x => next(null, prev));
      });        
    }, fn);
  };

  // convenience method for specDefinitions.
  // a spec definition may define two types of options:
  // 
  // 1) optarr:
  // triggers the definition of dynamically defined options.
  // each element becomes a named property on an options object.
  //
  // 2) options:
  // a static object literal that is passed as an options object 
  //
  o.getopts = (sess, cfg, tree, node, spec, fn) => {
    fnguard.isobj(sess, cfg, tree, node, spec).isfn(fn);
    
    if (spec.optarr) {
      o.retproparr(sess, cfg, tree, node, spec, (err, options) => {
        fn(null, options);
      });
    } else if (spec.options) {
      fn(null, spec.options);
    } else {
      fn(null, {});
    }
  };

  // for things like filtering out the base value
  // to display a formatted value,
  //
  // or padding a user added value through multiple
  // filters a user added valu
  //
  // applies a series of mutations to a value...
  o.applySpecFilters = (sess, cfg, tree, node, filterArr, fn) => {
    fnguard.isobj(sess, cfg, tree, node).isfn(fn);

    accumasync.arrf(filterArr || [], node, (filteropt, prev, next) => (
      o.retopt(sess, cfg, tree, prev, filteropt, next)
    ), fn);      
  };

  return o;
};
