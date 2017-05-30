// Filename: specmob.js  
// Timestamp: 2017.05.30-02:36:03 (last modified)
// Author(s): Bumblehead (www.bumblehead.com)  
//
// spec data directs the collection of values here.
//
// async code is unavoidable as some data and validation methods,
// unknown until runtme, may require async results.

const fnguard = require('fnguard'),
      castas = require('castas'),
      check = fnguard.spec,
      win = (typeof window === 'object' ? window : this),
      setImmediate = win.setImmediate || setTimeout;

const specmob = module.exports = ({speccb, specfn, specerrfn}={}, o = {}) => { 

  o.fn = (obj, name, type) => {
    if (name in obj && typeof obj[name] === 'function') {
      return obj[name];
    } else {
      throw new Error('no '+type+': '+name);
    }
  };

  o.getnodekey = node =>
    node && typeof node.get === 'function' && node.get('key');  

  o.stringify = obj =>
    (/string|boolean|number/.test(typeof obj)
     ? obj : JSON.stringify(obj, null, '  '));


  o.specerr = ({
    isfatal=true,
    errtype='error',
    errmsg='errmsg',
    meta}) => ({
      isfatal,
      errtype,
      errmsg,
      meta
    });

  o.isspecerr = err => Boolean(
    typeof err === 'object' && err &&
      typeof err.errtype === 'string');

  o.isinsterr = err => Boolean(
    err instanceof Error);

  o.isgraph = graph => Boolean(
    typeof graph === 'object' && graph &&
      typeof graph.has === 'function');
  
  // err may be,
  //  * pre-populated err object
  //  * instance of Error
  //  * string
  //
  // returns populated err object
  o.geterr = err => {
    if (o.isspecerr(err)) {
      err = o.specerr(err);
    } else if (o.isinsterr(err)) {
      err = o.specerr({
        errmsg : err.message,
        meta : err
      });
    } else if (typeof err === 'string') {
      err = o.specerr({
        errmsg : err,
        meta : { err }
      });
    }

    return err;
  };

  o.emiterr = (sess, cfg, graph, node, err, val, fn, specerr) => 
    specerrfn(sess, cfg, graph, node, specerr = o.geterr(err), (err, graph) => {
      if (!specerr.isfatal) fn(null, val, graph);
    });
  
  o.throw = (...args) => {
    console.error('[!!!] specmob: ', ...args);
    throw new Error(...args);
  };

  o.thrownode = (graph, node, ...args) => {
    win.errgraph = graph;
    win.errnode  = node;
    console.error('errgraph: ', graph && graph.toJS && graph.toJS());
    console.error('errnode: ', node && node.toJS && node.toJS());
    o.throw(o.getnodekey(node), ...args);
  };

  o.throw_returnundefined = (graph, node, namespace, opts) =>
    o.thrownode(graph, node, (
      '[!!!] final spec results must not be not be `undefined`: ' + o.stringify(opts)));

  o.throw_namespaceundefined = (graph, node, namespace, opts) =>
    o.thrownode(graph, node, (
      '[!!!] arg namespace must not be `undefined`: ' + o.stringify(opts)));

  o.throw_valisnotarray = (graph, node, opts) =>
    o.thrownode(graph, node, (
      '[!!!] must be an array: ' + o.stringify(opts)));

  // return the named callback from cbobj, and name
  o.getcb = name => o.fn(speccb, name, 'cbfn');

  // return the named function from fnfobj, and name
  o.getfn = name => o.fn(specfn, name, 'fnfn');

  // return the named spec function from this namespace, and 'ret'+name
  //
  // ex,
  //
  //   objprop
  //
  // return,
  //
  //   o.retobjprop
  //
  o.getspecfn = name => o.fn(o, 'ret'+(name||'opts'), 'spec');

  o.isvalidspec = spec =>
    check.isobj(spec);

  o.isvalidspecprop = prop =>
    check.isnum(prop) || check.isstr(prop);  

  // when multiple values are constructed seperately and used to compose a
  // single object definition, the specification for a value may be used here
  // to compose the object 'cumval', returning a result that is merged with
  // cumval or is defined on cumval.
  o.valfinish = (cumval, spec, val) => {
    if (spec.spread === true ||
        spec.type === undefined ||
        spec.type === 'opts') {
      cumval = Object.assign(cumval, val);
    } else {
      cumval[
        o.isvalidspecprop(spec.name) ? spec.name : 'value'
      ] = val;
    }

    return cumval;
  };

  //
  // convenience function to return current val or spec-generated 'defaultval'
  //
  o.valordefaultval = (sess, cfg, graph, node, namespace, opts, val, fn) => {
    fnguard
      .isobj(sess, cfg, graph, opts)
      .isany(node, namespace, val)
      .isfn(fn);

    if ((val === null ||
         val === undefined) && opts.defaultval !== undefined) {
      o.retopt(sess, cfg, graph, node, namespace, opts.defaultval, fn);
    } else {
      fn(null, val, graph);
    }
  };

  // return a namespace value, either 'this' or a property lookup from
  // the given namespace. namespace is seperated from thisval, allowing
  // namespace to be an accumulated result composed from thisval
  //
  // ex,
  //
  //   getnamespaceargval( graph, node, opts, namespace, 'thisval', 'this')
  //
  // return,
  //
  //   'thisval'
  //
  o.getnamespaceargval = (graph, node, opts, namespace, thisval, arg) => {
    let argval = null;

    if (arg === 'this') {
      argval = thisval;
    } else if (typeof namespace === 'object' && namespace) {
      argval = o.objlookup(arg, namespace);
    } else {
      o.throw_namespaceundefined(graph, node, namespace, opts);
    }

    return argval;
  };

  // return an array of arguments from a given namespace. a convenience for use
  // w/ functions to be called with array paramters rather than object params,
  // for example "add = ([num1, num2]) => num1 + num2;"
  //
  // ex,
  //
  //   {
  //     argprops : ['prop1', 'prop2', 'this']
  //   }
  //
  //   {
  //     prop1 : 'val1',
  //     prop2 : 'val2'
  //   }
  //
  // return,
  //
  //   ['val1', 'val2', { prop1 : 'val1', prop2 :'val2' }]
  //
  o.getargs = (graph, node, opts, namespace) =>
    opts.argprops ? opts.argprops.map(propname => (
      o.getnamespaceargval(graph, node, opts, namespace, namespace, propname))) : [];

  // return the value defined on the given namespace or null
  //
  // ex,
  //
  //   o.objlookup('hello.my', {hello:{my:'world'}})
  //
  // return,
  //
  //   'world'
  //
  o.objlookup = (namespacestr, obj) => 
    String(namespacestr).split('.').reduce(
      (a, b) => a ? (b in a ? a[b] : a[Number(b)]) : null, obj);
  
  // obtain a value from namespace given a property lookup string
  //
  // ex,
  //
  //   { hello : { my : 'world' } }
  //
  //   { type : 'objprop',
  //     propname : 'hello.my' }
  //
  // return,
  //
  //   'world'
  //
  o.retobjprop = (sess, cfg, graph, node, namespace, opts, fn) => {
    fnguard.isobj(sess, cfg, graph, node, opts).isany(namespace)
      .isnotundefined(opts.propname).isfn(fn);
    
    o.valordefaultval(sess, cfg, graph, node, namespace, opts, (
      o.objlookup(opts.propname, namespace)
    ), fn);
  };

  // return the value from the given function
  //
  // ex,
  //
  //   {
  //     type : "fn",
  //     fnname : "getdatenow"
  //   }  
  //
  // return,
  //
  //   1488110309443
  //
  o.retfn = (sess, cfg, graph, node, namespace, opts, fn) => {
    fnguard.isobj(sess, cfg, graph, node, opts)
      .isany(namespace).isstr(opts.fnname).isfn(fn);

    o.getopts(sess, cfg, graph, node, namespace, opts, (err, options, graph) => {
      if (err) return fn(err);
      
      let args = o.getargs(graph, node, opts, namespace, options);

      o.callfn(sess, cfg, graph, node, args, options, opts, (err, fin, graph) => {
        if (err) return fn(err);

        o.valordefaultval(sess, cfg, graph, node, namespace, opts, fin, fn);
      });
    });
  };

  // 'fn' uses different param ordering to be more user-space convenience
  //
  // standard: (sess, cfg, graph, node, ..., fn)
  //       cb: (args, opts, fn, sess, cfg, graph, node)
  //
  o.callfn = (sess, cfg, graph, node, args, opts, spec, fn) => {
    let fin = o.getfn(spec.fnname)(args, opts, sess, cfg, graph, node);

    o.isinsterr(fin)
      ? o.emiterr(sess, cfg, graph, node, fin, fin, fn)
      : fn(null, fin, graph);
  };  

  // return the value from the given callback
  //
  // ex,
  //
  //   {
  //     type : "cb",
  //     cbname : "requestdatenowfromservice"
  //   }  
  //
  // return,
  //
  //   1488110309443
  //  
  o.retcb = (sess, cfg, graph, node, namespace, opts, fn) => {
    fnguard.isobj(sess, cfg, graph, node, opts)
      .isany(namespace).isfn(fn);

    o.getopts(sess, cfg, graph, node, namespace, opts, (err, options, graph) => {
      if (err) return fn(err);

      let args = o.getargs(graph, node, opts, namespace);

      o.callcb(sess, cfg, graph, node, args, options, opts, (err, fin, graph) => {
        if (err) return fn(err);

        o.valordefaultval(sess, cfg, graph, node, namespace, opts, fin, fn);        
      });
    });
  };

  // 'cb' uses different param ordering to be more user-space convenience
  //
  // standard: (sess, cfg, graph, node, ..., fn)
  //       cb: (args, opts, fn, sess, cfg, graph, node)
  //
  o.callcb = (sess, cfg, graph, node, args, opts, spec, fn) => {
    o.getcb(spec.cbname)(args, opts, (err, fin) => {
      err 
        ? o.emiterr(sess, cfg, graph, node, err, fin, fn)
        : fn(null, fin, graph);
    }, sess, cfg, graph, node);
  };

  // create an object, with multiple named-properties, dynamically constructed
  //
  // ex,
  //
  //   {
  //     type : "obj",
  //     objarr : [{
  //       myprop1 : "myvalue1"
  //     },{
  //       myprop2 : "myvalue2"
  //     }]
  //   }
  //
  // return,
  //
  //   {
  //     myprop1 : "myvalue1"
  //     myprop2 : "myvalue2"
  //   }
  //
  o.retobj = (sess, cfg, graph, node, namespace, opt, fn) => {
    fnguard.isobj(sess, cfg, graph, node).isany(namespace).isfn(fn);

    let optarr = Array.isArray(opt) ? opt : (opt || {}).optarr || [];

    if (!Array.isArray(optarr)) {
      o.throw_valisnotarray(graph, node, optarr);
    }

    (function next (x, len, specarr, graph, resobj) {
      if (x >= len) return fn(null, resobj, graph); // no errors
      
      o.retopt(sess, cfg, graph, node, namespace, specarr[x], (err, val, graph) => {
        if (err) return fn(err);

        if (check.isobj(val)) {
          resobj = Object.assign(resobj, val);
        } else {
          resobj[specarr[x].name || 'value'] = val;
        }

        setImmediate(e => next(++x, len, specarr, graph, resobj));
      });
    }(0, optarr.length, optarr, graph, {}));
  };
  
  // create an array, with multiple elements, dynamically constructed
  //
  // ex,
  //
  //   {
  //     type : "optarr",
  //     optarr : [{  
  //       type : "fn",
  //       fnname : "gettuesday"
  //     },{
  //       type : "fn",
  //       fnname : "getwednesday"
  //     }]
  //   }
  //
  // return,
  //
  //   ['tuesday', 'wednesday']
  //
  o.retoptarr = (sess, cfg, graph, node, namespace, opts, fn) => {
    fnguard.isobj(sess, cfg, graph, node, namespace, opts).isfn(fn);

    (function next (x, len, specarr, graph, resarr) {
      if (x >= len) return fn(null, resarr, graph); // no errors
      
      o.retopt(sess, cfg, graph, node, namespace, specarr[x], (err, res, graph) => {
        if (err) return fn(err);
        
        resarr.push(res);
        
        next(++x, len, specarr, graph, resarr);
      });
    }(0, opts.optarr.length, opts.optarr, graph, []));
  };

  o.retliteral = (sess, cfg, graph, node, namespace, opts, fn) =>
    fn(null, opts.value, graph);

  o.retopts = (sess, cfg, graph, node, namespace, opts, fn) =>
    fn(null, opts, graph);

  // valid default types:
  //   regexp, this,
  //   objprop, cb,
  //   literal, fn, optarr,
  //   objarr, method
  o.retopt = (sess, cfg, graph, node, namespace, opts, fn) => {
    fnguard.isobj(sess, cfg, graph).isany(namespace, opts, node).isfn(fn);

    if (/^string|number/.test(typeof opts)
        || (opts && opts.spread)) {
      return fn(null, opts, graph);
    } else if (!opts) {
      return fn(null, null, graph);
    }

    o.getspecfn(opts.type)(sess, cfg, graph, node, namespace, opts, (err, res, graph) => {
      if (err) return fn(err);

      o.getfiltered(sess, cfg, graph, node, res, opts.filterarr, fn);
    });
  };

  // baseData where key returns a match w/ an activeKey value
  // are returned in an array
  // 
  //  var query = {
  //    baseKey : baseKey,
  //    activeKeyArr : activeKeyArr
  //  };
  //
  // *slow* pushes entire baseobject into the final array whos value matches
  o.retDataWHERE = (sess, cfg, graph, node, basearr = [], namespace, query, fn) => {
    fnguard.isobj(sess, cfg, graph, namespace, query).isfn(fn);
    
    let keyarr = query.activeKeyArr || [],
        baseKey = query.baseKey,
        casttype = basearr.length
          ? typeof (basearr[0] && basearr[0][baseKey.propname])
          : 'string';

    if (casttype !== 'string' && castas[casttype]) {
      keyarr = keyarr.map(key => castas[casttype](key));
    }

    (function next (x, basearr, graph, resarr, spec) {
      if (!x--) return fn(null, resarr, graph);

      o.retopt(sess, cfg, graph, node, basearr[x], baseKey, (err, value, graph) => {
        if (err) return fn(err);

        if (~keyarr.indexOf(value)) {
          resarr.push(basearr[x]);
        }

        setImmediate(e => next(x, basearr, graph, resarr));
      });
    }(basearr.length, basearr, graph, []));
  };

  // convenience method for obtaining one of two "options" definitions (the
  // options namespace is used by functions and callbacks).
  //
  // 1. spec.options,
  //
  //    a static object literal that is passed as an options object
  //
  //    ex, { options : { username : 'chuck' } }
  //
  // 2. spec.optarr,
  //
  //    a list of dynamic patterns used to define the options namespace
  //    each element becomes a named-property on the options object
  //
  //    ex, {
  //          optarr : [{
  //            name : 'username',
  //            type : 'fn',
  //            fnname : 'getsessionusername'
  //          }]
  //        }
  //
  // 3. spec.options AND spec.optarr
  //
  //    if both option types are defined, dynamic properties will be assigned
  //    with spec.options to a new object
  //
  o.getopts = (sess, cfg, graph, node, namespace, spec, fn) => {
    fnguard.isobj(sess, cfg, graph, node, spec).isany(namespace).isfn(fn);

    if (spec.optarr) {
      o.retobj(sess, cfg, graph, node, namespace, spec, (err, options, graph) => {
        // copy to spec.options if exists
        //
        // allows literal options to be defined alongside dynamically generated ones
        fn(null, Object.assign({}, spec.options || {}, options || {}), graph);
      });
    } else if (spec.options) {
      fn(null, spec.options, graph);
    } else {
      fn(null, {}, graph);
    }
  };

  o.getfiltered = (sess, cfg, graph, node, namespace, filterarr, fn) => {
    if (Array.isArray(filterarr)) {
      o.applyfilterarr(sess, cfg, graph, node, namespace, filterarr, fn);
    } else {
      fn(null, namespace, graph);
    }
  };  
  
  // for things like filtering out a base value to display a formatted value,
  //
  // applies a series of mutations to a value...
  //
  o.applyfilterarr = (sess, cfg, graph, node, namespace, filterarr, fn) => {
    fnguard.isobj(sess, cfg, graph, node).isany(namespace, filterarr).isfn(fn);

    filterarr = filterarr || [];

    (function next (filterarr, x, len, graph, prev) {
      if (x >= len) return fn(null, prev.val, graph);

      o.retopt(sess, cfg, graph, node, prev, filterarr[x], (err, val, graph) => {
        if (err) return fn(err);
        
        next(filterarr, ++x, len, graph, Object.assign({}, prev, {val}));
      })      
    }(filterarr, 0, filterarr.length, graph, namespace));
  };

  o.whenAND = (sess, cfg, graph, node, namespace, whenarr, fn) => {
    fnguard.isobj(sess, cfg, graph, node).isany(namespace).isfn(fn);

    (function next (x, len) {
      if (x >= len) return fn(null, null); // no errors

      o.geterror(sess, cfg, graph, node, namespace, whenarr[x], (err, errMsg) => {
        if (err) return fn(err);
        if (errMsg) return fn(null, errMsg);
        
        next(++x, len);
      });
    }(0, whenarr.length));
  };

  o.whenOR = (sess, cfg, graph, node, namespace, whenarr, fn) => {
    fnguard.isobj(sess, cfg, graph, node).isany(namespace).isfn(fn);

    (function next (x, len, errorMessage) {
      if (x >= len) return fn(null, errorMessage);
      o.geterror(sess, cfg, graph, node, namespace, whenarr[x], (err, errMsg) => {
        if (err) return fn(err);
        if (errMsg) {
          next(++x, len, errMsg);
        } else {
          fn(null, null); // no error message -passing.
        }
      });
    }(0, whenarr.length));
  };

  o.geterror = (sess, cfg, graph, node, namespace, spec, fn) => {
    fnguard.isobj(sess, cfg, graph, spec, namespace).isfn(fn);
    const type = spec.type,
          ANDRe = /^AND$/i,
          ORRe  = /^OR$/i;

    if (ANDRe.test(type)) {
      o.whenAND(sess, cfg, graph, node, namespace, spec.whenarr, fn);
    } else if (ORRe.test(type)) {
      o.whenOR(sess, cfg, graph, node, namespace, spec.whenarr, fn);
    } else {
      o.getopts(sess, cfg, graph, node, namespace, spec, (err, options, graph) => {
        if (err) return fn(err);
        
        if (o.getfn(spec.fnname)(
          o.getargs(graph, node, spec, namespace), options, sess, cfg, graph, node)) {
          fn(null, null);
        } else {
          fn(null, spec.errkey || 'errkey');
        }
      });
    }
  };

  o.getpass = (sess, cfg, graph, node, namespace, spec, fn) => (
    o.geterror(sess, cfg, graph, node, namespace, spec, (err, errmsg) => {
      if (err || errmsg) return fn(err, errmsg, false);

      fn(null, null, true);
    }));

  return o;
};
