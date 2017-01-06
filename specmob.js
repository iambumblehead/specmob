// Filename: specmob.js  
// Timestamp: 2017.01.06-06:31:26 (last modified)
// Author(s): Bumblehead (www.bumblehead.com)  
//
// spec data directs the collection of values here.
//
// async code is unavoidable, some data and validation methods may require 
// communication w/ server.

const accumasync = require('accumasync'),
      fnguard = require('fnguard');

const specmob = module.exports = (cbObj, fnObj, o = {}) => { 

  o.accumasync = accumasync;
  
  o.fn = (obj, name, type) => {
    if (name in obj && typeof obj[name] === 'function') {
      return obj[name];
    } else {
      throw new Error('no '+type+': '+name);
    }
  };

  o.getcb = name => o.fn(cbObj, name, 'cbfn');
  
  o.getfn = name => o.fn(fnObj, name, 'fnfn');

  // convenience function to return current val or spec-generated 'defaultval'
  o.valordefaultval = (sess, cfg, graph, node, opts, val, fn) => {
    fnguard.isobj(sess, cfg, graph, opts).isany(node, val).isfn(fn);

    if ((val === null ||
         val === undefined) && opts.defaultval) {
      o.retopt(sess, cfg, graph, node, opts.defaultval, fn);
    } else {
      fn(null, val);
    }
  };
  
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
    o.valordefaultval(sess, cfg, graph, node, opts, (
      o.objlookup(opts.propname, o.getnode(graph, node, opts.nodepath))
    ), fn);
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

        option.name
          ? prev[option.name] = res
          : Object.assign(prev, res);
        
        next(null, prev);
      });
    }, fn);
  };

  o.getargs = (opts, node) => 
    opts.argprops ? opts.argprops.map(propname => node[propname]) : [];
  
  o.retfn = (sess, cfg, graph, node, opts, fn) => {
    fnguard.isobj(sess, cfg, graph, node, opts).isstr(opts.fnname).isfn(fn);

    o.getopts(sess, cfg, graph, node, opts, (err, options) => {
      if (err) return fn(err);

      let fin = o.getfn(opts.fnname)(
        o.getargs(opts, node), options, sess, cfg, graph, node);

      o.valordefaultval(sess, cfg, graph, node, opts, fin, fn);
    });
  };

  // options should be value
  o.retcb = (sess, cfg, traph, node, opts, fn) => {
    fnguard.isobj(sess, cfg, traph, node, opts).isfn(fn);

    o.getopts(sess, cfg, traph, node, opts, (err, options) => {
      if (err) return fn(err);

      o.getcb(opts.cbname)(o.getargs(opts, node), options, (err, fin) => {
        if (err) return fn(err);

        o.valordefaultval(sess, cfg, traph, node, opts, fin, fn);        
      }, sess, cfg, traph, node);
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
      o.retopt(sess, cfg, tree, node, elem, (err, res) => {
        elem.value = res;
        arr.push(elem);
        next(null, arr);
      });
    }, fn);
  };

  o.retobj = (sess, cfg, tree, node, optarr=[], fn) => {
    fnguard.isobj(sess, cfg, tree, node).isfn(fn);

    accumasync.arr(optarr, {}, (option, prev, next) => {
      o.retopt(sess, cfg, tree, node, option, (err, value) => {
        if (err) return fn(err);

        if (typeof value === 'object' && value) {
          prev = Object.assign({}, prev, value);
        } else {
          prev[option.name || 'value'] = value;
        }
        
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
      ? (opts.spread 
         ? fn(null, opts)
         : o.fn(o, 'ret'+(opts.type||'opts'), 'spec')(sess, cfg, tree, node, opts, fn))
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

    query.cast === 'number'
      && (keyarr = keyarr.map(key => +key));
    
    accumasync.arr(basearr, [], (obj, prev, next) => {
      o.retopt(sess, cfg, tree, obj, baseKey, (err, value) => {
        if (err) return fn(err);
        
        if (~keyarr.indexOf(value)) {
          prev.push(obj);
        }

        //next(null, prev);
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
        // copy to spec.options if exists
        //
        // allows literal options to be defined alongside dynamically generated ones
        fn(null, Object.assign({}, spec.options || {}, options || {}));
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
  o.applyfilterarr = (sess, cfg, tree, obj, filterarr, fn) => {
    fnguard.isobj(sess, cfg, tree, obj).isfn(fn);

    accumasync.arrf(filterarr || [], obj, (filteropt, prev, next) => (
      o.retopt(sess, cfg, tree, prev, filteropt, (err, val) => (
        // accumulates filtered value on 'val'
        next(null, Object.assign({}, prev, {val}))
      ))
    ), fn);      
  };


  ///////////////
  ///////////////
  o.validationAND = (sess, cfg, tree, node, val, validatorArr, fn) => {
    fnguard.isobj(sess, cfg, tree, node).isfn(fn);

    (function next (x, len) {
      if (x >= len) return fn(null, null); // no errors

      o.geterror(sess, cfg, tree, node, validatorArr[x], val, (err, errMsg) => {
        if (err) return fn(err);
        if (errMsg) return fn(null, errMsg);
        next(++x, len);
      });
    }(0, validatorArr.length));
  };

  o.validationOR = (sess, cfg, tree, node, val, validatorArr, fn) => {
    fnguard.isobj(sess, cfg, tree, node).isfn(fn);

    (function next (x, len, errorMessage) {
      if (x >= len) return fn(null, errorMessage);
      o.geterror(sess, cfg, tree, node, validatorArr[x], val, (err, errMsg) => {
        if (err) return fn(err);
        if (errMsg) {
          next(++x, len, errMsg);
        } else {
          fn(null, null); // no error message -passing.
        }
      });
    }(0, validatorArr.length));
  };

  o.geterror = (sess, cfg, tree, node, spec, value, fn) => {
    fnguard.isobj(sess, cfg, tree, spec).isfn(fn);
    let type = spec.type,
        VERIFYRe = /^verify$/i,
        ANDRe = /^AND$/i,
        ORRe  = /^OR$/i;

    if (ANDRe.test(type)) {
      o.validationAND(sess, cfg, tree, node, value, spec.validatorArr, fn);
    } else if (ORRe.test(type)) {
      o.validationOR(sess, cfg, tree, node, value, spec.validatorArr, fn);
    } else if (VERIFYRe.test(type)) {
      o.getopts(sess, cfg, tree, node, spec, (err, options) => {
        if (err) return fn(err);
        if (o.getFn(spec.name)(value, options || spec.options)) {
          fn(null, null);
        } else {
          fn(null, spec.errorKey);
        }
      });
    } else {
      fn(null, null);
    }
  };

  return o;
};
