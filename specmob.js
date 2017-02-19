// Filename: specmob.js  
// Timestamp: 2017.02.18-20:52:06 (last modified)
// Author(s): Bumblehead (www.bumblehead.com)  
//
// spec data directs the collection of values here.
//
// async code is unavoidable, some data and validation methods may require 
// communication w/ server.

const fnguard = require('fnguard'),
      castas = require('castas'),

      setImmediate = window.setImmediate || setTimeout;

const specmob = module.exports = (cbObj, fnObj, o = {}) => { 

  o.fn = (obj, name, type) => {
    if (name in obj && typeof obj[name] === 'function') {
      return obj[name];
    } else {
      throw new Error('no '+type+': '+name);
    }
  };

  o.getnodeuid = node =>
    node && typeof node.get === 'function' && node.get('uid');  

  o.stringify = obj =>
    (/string|boolean|number/.test(typeof obj)
     ? obj : JSON.stringify(obj, null, '  '));
  
  o.throw = (...args) => {
    console.error('[!!!] specmob: ', ...args);
    throw new Error(...args);
  };

  o.thrownode = (traph, node, ...args) => {
    window.errtraph = traph;
    window.errnode  = node;
    console.error('errtraph: ', traph && traph.toJS && traph.toJS());
    console.error('errnode: ', node && node.toJS && node.toJS());
    o.throw(o.getnodeuid(node), ...args);
  };

  o.throw_returnundefined = (traph, node, namespace, opts) =>
    o.thrownode(traph, node, (
      '[!!!] final spec results must not be not be `undefined`: ' + o.stringify(opts)));

  o.throw_namespaceundefined = (traph, node, namespace, opts) =>
    o.thrownode(traph, node, (
      '[!!!] arg namespace must not be `undefined`: ' + o.stringify(opts)));

  o.throw_valisnotarray = (traph, node, opts) =>
    o.thrownode(traph, node, (
      '[!!!] must be an array: ' + o.stringify(opts)));
  

  o.getcb = name => o.fn(cbObj, name, 'cbfn');
  
  o.getfn = name => o.fn(fnObj, name, 'fnfn');

  o.getspecfn = name => o.fn(o, 'ret'+(name||'opts'), 'spec');

  // convenience function to return current val or spec-generated 'defaultval'
  o.valordefaultval = (sess, cfg, graph, node, namespace, opts, val, fn) => {
    fnguard
      .isobj(sess, cfg, graph, opts)
      .isany(node, namespace, val)
      .isfn(fn);

    if ((val === null ||
         val === undefined) && opts.defaultval !== undefined) {
      o.retopt(sess, cfg, graph, node, namespace, opts.defaultval, fn);
    } else {
      fn(null, val);
    }
  };
  
  o.getnode = (graph, node, relnodepath = './') =>
    typeof o.getgraphnode === 'function'
      ? o.getgraphnode(graph, node, relnodepath)
      : node;

  o.objlookup = (namespacestr, obj) => 
    String(namespacestr).split('.').reduce(
      (a, b) => a ? (b in a ? a[b] : a[Number(b)]) : null, obj);

  // call a specific node-associated method 
  //
  // "subjectData" : {
  //  "type" : "method",
  //  "methodname" : "getpropname"  
  // },  
  o.retmethod = (sess, cfg, graph, node, namespace, opts, fn) => {
    fnguard.isobj(sess, cfg, graph, node, namespace, opts)
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
  o.retobjprop = (sess, cfg, graph, node, namespace, opts, fn) => {
    fnguard.isobj(sess, cfg, graph, node, opts).isany(namespace)
      .isnotundefined(opts.propname).isfn(fn);
    
    // if nodepath
    //   optain property from other node if node
    // else
    //   use current node
    o.valordefaultval(sess, cfg, graph, node, namespace, opts, (
      o.objlookup(opts.propname, namespace)
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
  o.retproparr = (sess, cfg, tree, node, namespace, opts, fn) => {
    fnguard.isobj(sess, cfg, tree, node, opts)
      .isany(namespace)
      .isarr(opts.optarr).isfn(fn);

    
    (function next (x, specarr, resobj, spec) {
      if (!x--) return fn(null, resobj);

      spec = specarr[x];
      
      o.retopt(sess, cfg, tree, node, namespace, spec, (err, res) => {
        if (err) return fn(err);

        spec.name
          ? resobj[spec.name] = res
          : Object.assign(resobj, res);        

        next(x, specarr, resobj);
      });
      
    }(opts.optarr.length, opts.optarr, {}));
  };

  o.getnamespaceargval = (graph, node, opts, namespace, thisval, arg) => {
    let argval = null;

    if (arg === 'this') {
      argval = thisval;
    } else if (namespace) {
      argval = o.objlookup(arg, namespace);
    } else {
      o.throw_namespaceundefined(graph, node, namespace, opts);
    }

    return argval;
  };

  o.getargs = (graph, node, opts, namespace, options, args=[]) =>
    opts.argprops ? opts.argprops.map(propname => (
      o.getnamespaceargval(graph, node, opts, namespace, namespace, propname))) : [];

  o.retfn = (sess, cfg, graph, node, namespace, opts, fn) => {
    fnguard.isobj(sess, cfg, graph, node, opts)
      .isany(namespace).isstr(opts.fnname).isfn(fn);

    o.getopts(sess, cfg, graph, node, namespace, opts, (err, options) => {
      if (err) return fn(err);
      
      let args = o.getargs(graph, node, opts, namespace, options),
          fin = o.getfn(opts.fnname)(args, options, sess, cfg, graph, node);

      o.valordefaultval(sess, cfg, graph, node, namespace, opts, fin, fn);
    });
  };

  // options should be value
  o.retcb = (sess, cfg, traph, node, namespace, opts, fn) => {
    fnguard.isobj(sess, cfg, traph, node, namespace, opts).isfn(fn);

    o.getopts(sess, cfg, traph, node, namespace, opts, (err, options) => {
      if (err) return fn(err);

      let args = o.getargs(traph, node, opts, namespace);
      
      o.getcb(opts.cbname)(args, options, (err, fin) => {
        if (err) return fn(err);

        o.valordefaultval(sess, cfg, traph, node, namespace, opts, fin, fn);        
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
  o.retobjarr = (sess, cfg, tree, node, namespace, opts, fn) => {
    fnguard.isobj(sess, cfg, tree, node, namespace, opts).isfn(fn);

    (function next (dataarr, x, len, arr) {
      if (x >= len) return fn(null, arr);
      
      o.retopt(sess, cfg, tree, node, namespace, dataarr[x], (err, res) => {
        arr.push(res);
        
        next(dataarr, ++x, len, arr);
      });      
    }(opts.objarr, 0, opts.objarr.length, []));
  };

  o.getfiltered = (sess, cfg, traph, node, namespace, filterarr, fn) => {
    if (Array.isArray(filterarr)) {
      o.applyfilterarr(sess, cfg, traph, node, namespace, filterarr, fn);
    } else {
      fn(null, namespace);
    }
  };  

  o.retobj = (sess, cfg, tree, node, namespace, optarr=[], fn) => {
    fnguard.isobj(sess, cfg, tree, node, namespace).isfn(fn);

    if (!Array.isArray(optarr)) {
      o.throw_valisnotarray(tree, node, optarr);
    }

    (function next (x, specarr, resobj) {
      if (!x--) return fn(null, resobj);
      
      o.retopt(sess, cfg, tree, node, namespace, specarr[x], (err, val) => {
        if (err) return fn(err);

        if (typeof val === 'object' && val) {
          resobj = Object.assign(resobj, val);
        } else {
          resobj[specarr[x].name || 'value'] = val;
        }

        setImmediate(e => next(x, specarr, resobj));
      });
    }(optarr.length, optarr, {}));
  };

  o.retoptarr = (sess, cfg, tree, node, namespace, opts, fn) => {
    fnguard.isobj(sess, cfg, tree, node, namespace, opts).isfn(fn);

    (function next (x, len, specarr, resarr) {
      if (x >= len) return fn(null, resarr); // no errors
      
      o.retopt(sess, cfg, tree, node, namespace, specarr[x], (err, res) => {
        if (err) return fn(err);
        
        resarr.push(res);
        
        next(++x, len, specarr, resarr);
      });
    }(0, opts.optarr.length, opts.optarr, []));
    
    //accumasync.arrf(opts.optarr, [], (elem, arr, next) => {
    //  o.retopt(sess, cfg, tree, node, namespace, elem, (err, res) => {
    //    if (err) return fn(err);
    //    arr.push(res);
    //    next(null, arr);
    //  });
    //}, fn);
  };

  // apply a single option group to the entire arr
  o.retarr = (sess, cfg, tree, node, namespace, opts, objarr, fn) => {
    fnguard.isobj(sess, cfg, tree, node, namespace).isfn(fn);

    if (!Array.isArray(objarr)) {
      return fn(null, []);
    }

    (function next (specarr, x, len, arr) {
      if (x >= len) return fn(null, arr);

      o.retopt(sess, cfg, tree, specarr[x], namespace, opts, (err, value)  => {
        if (err) return fn(err);
    
        arr.push(value);
        
        setImmediate(e => next(specarr, ++x, len, arr));
      });
    }(objarr, 0, objarr.length, []));
  };

  o.retregexp = (sess, cfg, tree, node, namespace, opts, fn) => {
    fnguard.isobj(sess, cfg, tree, node, namespace, opts).isfn(fn);
    
    fn(null, new RegExp(opts.value));
  };

  o.retliteral = (sess, cfg, tree, node, namespace, opts, fn) =>
    fn(null, opts.value);

  o.retthis = (sess, cfg, tree, node, namespace, opts, fn) =>
    fn(null, node);

  o.retopts = (sess, cfg, tree, node, namespace, opts, fn) =>
    fn(null, opts);

  // page may represent a data set from which subject data is defined.
  // in this case, page may be null for unselected multioption page object.
  //
  // valid default types:
  //   regexp, proparr, this,
  //   objprop, cb, fieldval,
  //   literal, fn, optarr,
  //   objarr, method
  o.retopt = (sess, cfg, tree, node, namespace, opts, fn) => {
    fnguard.isobj(sess, cfg, tree).isany(namespace, opts, node).isfn(fn);

    if (/^string|number/.test(typeof opts)
        || (opts && opts.spread)) {
      return fn(null, opts);
    } else if (!opts) {
      return fn(null, null);
    }

    o.getspecfn(opts.type)(sess, cfg, tree, node, namespace, opts, (err, res) => {
      if (err) return fn(err);

      o.getfiltered(sess, cfg, tree, node, res, opts.filterarr, fn);
    });
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
  o.retDataWHERE = (sess, cfg, tree, node, basearr = [], namespace, query, fn) => {
    fnguard.isobj(sess, cfg, tree, namespace, query).isfn(fn);
    
    let keyarr = query.activeKeyArr || [],
        baseKey = query.baseKey,
        casttype = basearr.length
          ? typeof basearr[0]
          : 'string';

    if (casttype !== 'string' && castas[casttype]) {
      keyarr = keyarr.map(key => castas[casttype](key));
    }

    (function next (x, basearr, resarr, spec) {
      if (!x--) return fn(null, resarr);
      
      o.retopt(sess, cfg, tree, node, basearr[x], baseKey, (err, value) => {
        if (err) return fn(err);

        if (~keyarr.indexOf(value)) {
          resarr.push(basearr[x]);
        }

        setImmediate(e => next(x, basearr, resarr));
      });
    }(basearr.length, basearr, []));
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
  o.getopts = (sess, cfg, tree, node, namespace, spec, fn) => {
    fnguard.isobj(sess, cfg, tree, node, spec).isany(namespace).isfn(fn);

    if (spec.optarr) {
      o.retproparr(sess, cfg, tree, node, namespace, spec, (err, options) => {
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
  o.applyfilterarr = (sess, cfg, tree, node, namespace, filterarr, fn) => {
    fnguard.isobj(sess, cfg, tree, node).isany(namespace, filterarr).isfn(fn);

    filterarr = filterarr || [];

    (function next (filterarr, x, len, prev) {
      if (x >= len) return fn(null, prev.val);
      
      o.retopt(sess, cfg, tree, node, prev, filterarr[x], (err, val) => {
        if (err) return fn(err);
        
        next(filterarr, ++x, len, Object.assign({}, prev, {val}));
      })      
    }(filterarr, 0, filterarr.length, namespace));
  };

  o.whenAND = (sess, cfg, tree, node, namespace, whenarr, fn) => {
    fnguard.isobj(sess, cfg, tree, node).isany(namespace).isfn(fn);

    (function next (x, len) {
      if (x >= len) return fn(null, null); // no errors

      o.geterror(sess, cfg, tree, node, namespace, whenarr[x], (err, errMsg) => {
        if (err) return fn(err);
        if (errMsg) return fn(null, errMsg);
        
        next(++x, len);
      });
    }(0, whenarr.length));
  };

  o.whenOR = (sess, cfg, tree, node, namespace, whenarr, fn) => {
    fnguard.isobj(sess, cfg, tree, node).isany(namespace).isfn(fn);

    (function next (x, len, errorMessage) {
      if (x >= len) return fn(null, errorMessage);
      o.geterror(sess, cfg, tree, node, namespace, whenarr[x], (err, errMsg) => {
        if (err) return fn(err);
        if (errMsg) {
          next(++x, len, errMsg);
        } else {
          fn(null, null); // no error message -passing.
        }
      });
    }(0, whenarr.length));
  };

  o.geterror = (sess, cfg, traph, node, namespace, spec, fn) => {
    fnguard.isobj(sess, cfg, traph, spec, namespace).isfn(fn);
    const type = spec.type,
          ANDRe = /^AND$/i,
          ORRe  = /^OR$/i;

    if (ANDRe.test(type)) {
      o.whenAND(sess, cfg, traph, node, namespace, spec.whenarr, fn);
    } else if (ORRe.test(type)) {
      o.whenOR(sess, cfg, traph, node, namespace, spec.whenarr, fn);
    } else {
      o.getopts(sess, cfg, traph, node, namespace, spec, (err, options) => {
        if (err) return fn(err);
        
        if (o.getfn(spec.fnname)(
          o.getargs(traph, node, spec, namespace), options, sess, cfg, traph, node)) {
          fn(null, null);
        } else {
          fn(null, spec.errkey || 'errkey');
        }
      });
    }
  };

  o.getpass = (sess, cfg, traph, node, namespace, spec, fn) => (
    o.geterror(sess, cfg, traph, node, namespace, spec, (err, errmsg) => {
      if (err || errmsg) return fn(err, errmsg, false);

      fn(null, null, true);
    }));

  return o;
};
