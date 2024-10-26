// Filename: specmob.js
// Timestamp: 2018.05.07-14:26:00 (last modified)
// Author(s): Bumblehead (www.bumblehead.com)
//
// spec data directs the collection of values here.
//
// async code is unavoidable as some data and validation methods,
// unknown until runtme, may require async results.
//
// 'ns' is short for 'namespace'

import fnguard from 'fnguard'
import castas from 'castas'

const check = fnguard.spec
const AND = 'AND'
const OR = 'OR'

const isPlainObj = check.isobjlike

const isgraph = graph => Boolean(
  typeof graph === 'object' && graph &&
    typeof graph.has === 'function' && graph.has('/'))

const stringify = obj => (
  Array.isArray(obj) || isPlainObj(obj)
    ? JSON.stringify(obj, null, '  ') : obj)

const specmoberr_specfnorcbnotfound = (fnorcb, name) => new Error(
  `undefined: spec${fnorcb}, ${fnorcb}name “${name}” unavailable`)

const specmoberr_invalidcbname = name => new Error(
  `invalid: cbname “${name}”`)

const specmoberr_invalidfnname = name => new Error(
  `invalid: fnname “${name}”`)

const specmoberr_invalidtypename = name => new Error(
  `invalid: pattern type “${name}”`)

const specmoberr_valisnotarr = optarr => new Error(
  `must be an array: ${stringify(optarr)}`)

const specmoberr_propundefined = spec => new Error(
  `invalid spec definition, "prop" required: ${stringify(spec)}`)

const fnres_multival = (val, graph) => ([val, graph])

export default ({ speccb, specfn, specerrfn, typeprop, nsre } = {}, o = {}) => {
  // allow speccb and specfn to be accessed directly from created
  // spec system w/out need of constructing any pattern
  o.fn = specfn
  o.cb = speccb
  o.typeprop = typeprop || 'type'
  o.objgetfn = (obj, name) => {
    return (obj && name in obj && typeof obj[name] === 'function')
      ? obj[name]
      : null
  }

  o.nodegetkey = node =>
    node && typeof node.get === 'function' && node.get('key')

  o.stringify = stringify

  o.specerr = ({
    isfatal = true,
    errtype = 'error',
    errmsg = 'errmsg',
    meta }) => ({
    isfatal,
    errtype,
    errmsg,
    meta
  })

  o.isspecerr = err => Boolean(
    typeof err === 'object' && err &&
      typeof err.errtype === 'string')

  o.isinsterr = err => Boolean(
    err instanceof Error)

  o.isgraph = isgraph

  // err may be,
  //  * pre-populated err object
  //  * instance of Error
  //  * string
  //
  // returns populated err object
  o.geterr = err => {
    if (o.isspecerr(err)) {
      err = o.specerr(err)
    } else if (o.isinsterr(err)) {
      err = o.specerr({
        errmsg: err.message,
        meta: err
      })
    } else if (typeof err === 'string') {
      err = o.specerr({
        errmsg: err,
        meta: { err }
      })
    }

    return err
  }

  o.emiterr = (sess, cfg, graph, node, err, val, fn, specerr) => (
    specerrfn(sess, cfg, graph, node, specerr = o.geterr(err), (err, graph) => {
      if (!specerr.isfatal) fn(null, val, graph)
    }))

  o.errInst = (graph, node, msg) => (
    Object.assign(new Error((
      node ? node.get('key') + '\n' + msg : msg
    )), {
      graph: graph && graph.toJS(),
      node: node && node.toJS()
    }))

  o.errnamespaceundefined = (graph, node, spec, space) => o
    .errInst(graph, node, (
      "spec must not resolve to an `undefined` value." +
        " Instead, resolve `null` or set a default value." +
        `\nspec: ${stringify(spec)},\nspace: ${stringify(space)}`))

  // return the named callback from cbobj, and name
  o.getcb = name => o.objgetfn(speccb, name, 'cbfn')

  // return the named function from fnfobj, and name
  o.getfn = name => o.objgetfn(specfn, name, 'fnfn')

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
  o.getspecfn = name => o.objgetfn(o, `ret${(name || 'opts')}`, 'spec')

  o.isvalidspec = spec =>
    check.isobj(spec)

  o.isvalidspecprop = prop =>
    check.isnum(prop) || check.isstr(prop)

  // when multiple values are constructed seperately and used to compose a
  // single object definition, the specification for a value may be used here
  // to compose the object 'cumval', returning a result that is merged with
  // cumval or is defined on cumval.
  o.valfinish = (cumval, spec, val) => {
    if ((spec.spread === true
      || spec.type === undefined
      || spec.type === 'opts'
    ) && check.isobj(val)) {
      cumval = Object.assign(cumval, val)
    } else if (o.isvalidspecprop(spec.name)) {
      cumval[spec.name] = val
    } else if (o.isvalidspecprop(spec.cumprop)) {
      cumval[spec.cumprop] = val
    } else {
      cumval = val
    }

    return cumval
  }

  //
  // convenience function to return current val or spec-generated 'defaultval'
  //
  o.valordefval = (sess, cfg, graph, node, ns, opts, val, fn) => {
    fnguard
      .isobjlike(graph)
      .isobj(sess, cfg, opts)
      .isany(node, ns, val)
      .isfn(fn)

    if ((val === null || val === undefined) && opts.def !== undefined) {
      o.retopt(sess, cfg, graph, node, ns, opts.def, fn)
    } else if (val === undefined) {
      fn(o.errnamespaceundefined(graph, node, opts, ns))
    } else {
      fn(null, val, graph)
    }
  }

  // return a namespace value, either 'this' or a property lookup from
  // the given namespace. namespace is seperated from thisval, allowing
  // namespace to be an accumulated result composed from thisval
  //
  // ex,
  //
  //   getnamespaceargval( graph, node, opts, ns, 'thisval', 'this')
  //
  // return,
  //
  //   'thisval'
  //
  o.getnsargval = (sess, graph, node, opts, ns, thisval, arg) => {
    let argval = null

    if (arg === 'this') {
      argval = ns.this
    } else if (String(arg).startsWith('ns.')) {
      argval = check.isobj(ns) ? o.objlookup(arg.slice(3), ns) : undefined
    } else if (nsre && nsre.test(arg)) {
      argval = check.isobj(ns) ? o.objlookup(arg, ns) : undefined
    } else if (String(arg).startsWith('sess.')) {
      argval = o.objlookup(arg.slice(5), sess)
    } else if (arg === 'ns') {
      argval = ns
    } else {
      argval = arg
    }

    if (argval === undefined)
      throw o.errnamespaceundefined(graph, node, ns, opts)

    return argval
  }

  // return an array of arguments from a given namespace. a convenience for use
  // w/ functions to be called with array paramters rather than object params,
  // for example "add = ([num1, num2]) => num1 + num2"
  //
  // ex,
  //
  //   {
  //     args: ['prop1', 'prop2', 'this']
  //   }
  //
  //   {
  //     prop1: 'val1',
  //     prop2: 'val2'
  //   }
  //
  // return,
  //
  //   ['val1', 'val2', { prop1: 'val1', prop2:'val2' }]
  //
  o.getargs = (sess, graph, node, opts, ns) =>
    opts.args ? opts.args.map(prop => (
      o.getnsargval(sess, graph, node, opts, ns, ns, prop))) : []

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
  o.objlookup = (nsstr, obj) => (
    String(nsstr).split('.').reduce(
      (a, b) => a ? (b in a ? a[b] : a[Number(b)]) : undefined, obj))

  // obtain a value from namespace given a property lookup string
  //
  // ex,
  //
  //   { hello: { my: 'world' } }
  //
  //   { type: 'objprop',
  //     prop: 'hello.my' }
  //
  // return,
  //
  //   'world'
  //
  o.retobjprop = (sess, cfg, graph, node, ns, opts, fn) => {
    fnguard.isobjlike(graph, node).isobj(sess, cfg, opts).isany(ns)

    if (check.isundefined(opts.prop)) {
      return fn(specmoberr_propundefined(opts))
    }

    o.valordefval(sess, cfg, graph, node, ns, opts, (
      o.objlookup(opts.prop, ns)
    ), fn)
  }

  // return the value from the given function
  //
  // ex,
  //
  //   {
  //     type: "fn",
  //     fnname: "getdatenow"
  //   }
  //
  // return,
  //
  //   1488110309443
  //
  o.retfn = (sess, cfg, graph, node, ns, spec, fn) => {
    fnguard.isobjlike(graph, node).isobj(sess, cfg, spec).isany(ns).isfn(fn)

    let args

    o.getopts(sess, cfg, graph, node, ns, spec, (err, opts, graph) => {
      if (err) return fn(err)

      try {
        // TODO phase-out. if argsdyn, skip
        args = spec.argsdyn ? opts : o.getargs(sess, graph, node, spec, ns)
      } catch (e) {
        return fn(e)
      }

      o.callfn(sess, cfg, graph, node, args, spec, (err, fin, graph) => {
        if (err) return fn(err)

        o.valordefval(sess, cfg, graph, node, ns, spec, fin, fn)
      })
    })
  }

  // 'fn' uses different param ordering to be more user-space convenience
  //
  // standard: (sess, cfg, graph, node, ..., fn)
  //       cb: (args, opts, fn, sess, cfg, graph, node)
  //
  o.callfn = (sess, cfg, graph, node, args, spec, fn) => {
    const func = o.getfn(spec.fnname)
    if (typeof func !== 'function') {
      return specfn
        ? fn(specmoberr_invalidfnname(spec.fnname))
        : fn(specmoberr_specfnorcbnotfound('fn', spec.fnname))
    }

    if (func.constructor.name === 'AsyncFunction') {
      func(args, sess, cfg, graph, node, fnres_multival).then(fin => (
        o.isinsterr(fin)
          ? o.emiterr(sess, cfg, graph, node, fin, fin, fn)
          : (func.length >= 6 && Array.isArray(fin)
            ? fn(null, fin[0], fin[1])
            : fn(null, fin, graph))))
        .catch(e => fn(e))
    } else {
      const fin = func(args, sess, cfg, graph, node, fnres_multival)
      return o.isinsterr(fin)
        ? o.emiterr(sess, cfg, graph, node, fin, fin, fn)
        : (func.length >= 6 && Array.isArray(fin)
          ? fn(null, fin[0], fin[1])
          : fn(null, fin, graph))
    }
  }

  // return the value from the given callback
  //
  // ex,
  //
  //   {
  //     type: "cb",
  //     cbname: "requestdatenowfromservice"
  //   }
  //
  // return,
  //
  //   1488110309443
  //
  o.retcb = (sess, cfg, graph, node, ns, spec, fn) => {
    let args

    fnguard.isobjlike(graph, node).isobj(sess, cfg, spec).isany(ns).isfn(fn)

    o.getopts(sess, cfg, graph, node, ns, spec, (err, opts, graph) => {
      if (err) return fn(err)

      try {
        // TODO phase-out. if argsdyn, skip
        args = spec.argsdyn ? opts : o.getargs(sess, graph, node, spec, ns)
      } catch (e) {
        return fn(e)
      }

      o.callcb(sess, cfg, graph, node, args, spec, (err, fin, graph) => {
        if (err) return fn(err)

        o.valordefval(sess, cfg, graph, node, ns, spec, fin, fn)
      })
    })
  }

  // 'cb' uses different param ordering to be more user-space convenience
  //
  // standard: (sess, cfg, graph, node, ..., fn)
  //       cb: (args, opts, fn, sess, cfg, graph, node)
  //
  o.callcb = (sess, cfg, graph, node, args, spec, fn) => {
    const func = o.getcb(spec.cbname)
    if (!func) {
      return speccb
        ? fn(specmoberr_invalidcbname(spec.cbname))
        : fn(specmoberr_specfnorcbnotfound('cb', spec.cbname))
    }

    func(args, (err, fin, ngraph = graph) => (
      err
        ? o.emiterr(sess, cfg, ngraph, node, err, fin, fn)
        : fn(null, fin, ngraph)
    ), sess, cfg, graph, node)
  }

  // create an object, with multiple named-properties, dynamically constructed
  //
  // ex,
  //
  //   {
  //     type: "obj",
  //     objarr: [{
  //       myprop1: "myvalue1"
  //     },{
  //       myprop2: "myvalue2"
  //     }]
  //   }
  //
  // return,
  //
  //   {
  //     myprop1: "myvalue1"
  //     myprop2: "myvalue2"
  //   }
  //
  o.retobj = (sess, cfg, graph, node, ns, opt, fn) => {
    fnguard.isobjlike(graph, node).isobj(sess, cfg).isany(ns).isfn(fn)

    let optarr = Array.isArray(opt) ? opt : (opt || {}).optarr || [],
        nodekey = o.nodegetkey(node)

    if (!Array.isArray(optarr)) {
      return fn(specmoberr_valisnotarr(optarr))
    }

    (function next (x, len, specarr, graph, resobj) {
      if (x >= len) return fn(null, resobj, graph) // no errors

      // eslint-disable-next-line max-len
      o.retopt(sess, cfg, graph, graph.get(nodekey), ns, specarr[x], (err, val, graph) => {
        if (err) return fn(err)

        if (check.isstr(specarr[x].name)) {
          resobj[specarr[x].name] = val
        } else if (check.isobj(val)) {
          resobj = Object.assign(resobj, val)
        } else {
          resobj.value = val
        }

        queueMicrotask(() => next(++x, len, specarr, graph, resobj))
      })
    }(0, optarr.length, optarr, graph, {}))
  }

  // create an array, with multiple elements, dynamically constructed
  //
  // ex,
  //
  //   {
  //     type: "optarr",
  //     optarr: [{
  //       type: "fn",
  //       fnname: "gettuesday"
  //     },{
  //       type: "fn",
  //       fnname: "getwednesday"
  //     }]
  //   }
  //
  // return,
  //
  //   ['tuesday', 'wednesday']
  //
  o.retoptarr = (sess, cfg, graph, node, ns, opts, fn) => {
    fnguard.isobjlike(graph, node).isobj(sess, cfg, ns, opts).isfn(fn)

    ;(function next (x, len, specarr, graph, resarr) {
      if (x >= len) return fn(null, resarr, graph) // no errors

      o.retopt(sess, cfg, graph, node, ns, specarr[x], (err, res, graph) => {
        if (err) return fn(err)

        resarr.push(res)

        next(++x, len, specarr, graph, resarr)
      })
    }(0, opts.optarr.length, opts.optarr, graph, []))
  }

  o.retliteral = (sess, cfg, graph, node, ns, opts, fn) =>
    fn(null, opts.value, graph)

  o.retopts = (sess, cfg, graph, node, ns, opts, fn) =>
    fn(null, opts, graph)

  o.retthis = (sess, cfg, graph, node, ns, opts, fn) =>
    fn(null, ns, graph)

  // valid default types:
  //   regexp, this,
  //   objprop, cb,
  //   literal, fn, optarr,
  //   objarr, method
  o.retopt = (sess, cfg, graph, node, ns, opts, fn) => {
    fnguard.isobjlike(graph).isobj(sess, cfg).isany(ns, opts, node).isfn(fn)

    const typeofstr = typeof opts
    if ((typeofstr === 'boolean'
      || typeofstr === 'string'
      || typeofstr === 'number')
      || (opts && opts.spread)) {
      return fn(null, opts, graph)
    } else if (!opts) {
      return fn(null, null, graph)
    }

    const specfn = o.getspecfn(opts[o.typeprop])
    if (typeof specfn !== 'function') {
      return fn(specmoberr_invalidtypename(opts[o.typeprop]))
    }

    specfn(sess, cfg, graph, node, ns, opts, (err, res, graph) => {
      if (err) return fn(err)

      o.getfiltered(sess, cfg, graph, node, ns, res, opts.filterinarr, fn)
    })
  }

  // returns array basekey matches on activekeys values
  //
  //  let query = {
  //    basekey,
  //    activekeys
  //  }
  //
  // *slow* pushes entire into the final array whos value matches
  o.retDataWHERE = (sess, cfg, graph, node, basearr = [], ns, query, fn) => {
    fnguard.isobjlike(graph).isobj(sess, cfg, ns, query).isfn(fn)

    let { basekey, keyarr = [] } = query,
        casttype

    (function next (x, basearr, graph, resarr) {
      if (!x--) return fn(null, resarr, graph)

      o.retopt(sess, cfg, graph, node, basearr[x], basekey, (err, value, graph) => {
        if (err) return fn(err)

        if (!casttype) {
          casttype = basearr.length
            ? typeof (basearr[0] && basearr[0][basekey.prop])
            : 'string'

          if (casttype !== 'string' && castas[casttype]) {
            keyarr = keyarr.map(key => castas[casttype](key))
          }
        }

        if (~keyarr.indexOf(value)) {
          resarr.push(basearr[x])
        }

        queueMicrotask(() => next(x, basearr, graph, resarr))
      })
    }(basearr.length, basearr, graph, []))
  }

  // convenience method for obtaining one of two "opts" definitions (the
  // opts namespace is used by functions and callbacks).
  //
  // 1. spec.opts,
  //
  //    a static object literal that is passed as an opts object
  //
  //    ex, { opts: { username: 'chuck' } }
  //
  // 2. spec.optarr,
  //
  //    a list of dynamic patterns used to define the opts namespace
  //    each element becomes a named-property on the opts object
  //
  //    ex, {
  //          optarr: [{
  //            name: 'username',
  //            type: 'fn',
  //            fnname: 'getsessionusername'
  //          }]
  //        }
  //
  // 3. spec.opts AND spec.optarr
  //
  //    if both option types are defined, dynamic properties will be assigned
  //    with spec.opts to a new object
  //
  o.getopts = (sess, cfg, graph, node, ns, spec, fn) => {
    fnguard.isobjlike(graph, node).isobj(sess, cfg, spec).isany(ns).isfn(fn)

    if (spec.argsdyn && spec.args) {
      (function next (args, argsdyn, graph) {
        if (!argsdyn.length)
          return fn(null, args, graph)

        o.retobj(sess, cfg, graph, node, ns, args[argsdyn[0]], (err, res, graph) => {
          if (err) return fn(err)

          args[argsdyn[0]] = res

          next(args, argsdyn.slice(1), graph)
        })
      })(spec.args.slice(), spec.argsdyn.slice(), graph)
    } else if (spec.optarr) {
      o.retobj(sess, cfg, graph, node, ns, spec, (err, opts, graph) => {
        if (err) return fn(err)
        // copy to spec.opts if exists
        //
        // allows literal opts to be defined alongside dynamically generated ones
        fn(null, Object.assign({}, spec.opts || {}, opts || {}), graph)
      })
    } else if (spec.opts) {
      fn(null, spec.opts, graph)
    } else {
      fn(null, {}, graph)
    }
  }

  o.getfiltered = (sess, cfg, graph, node, ns, val, filterarr, fn) => {
    if (Array.isArray(filterarr)) {
      o.applyfilterarr(sess, cfg, graph, node, ns, val, filterarr, fn)
    } else {
      fn(null, val, graph)
    }
  }

  // for things like filtering out a base value to display a formatted value,
  //
  // applies a series of mutations to a value...
  //
  o.applyfilterarr = (sess, cfg, graph, node, ns, val, filterarr = [], fn) => {
    fnguard.isobjlike(graph, node)
      .isobj(sess, cfg).isany(ns).isarr(filterarr).isfn(fn)

    ;(function next (filterarr, x, len, graph, prev) {
      if (x >= len) return fn(null, prev.val, graph)

      o.retopt(sess, cfg, graph, node, prev, filterarr[x], (err, val, graph) => {
        if (err) return fn(err)

        next(filterarr, ++x, len, graph, Object.assign(prev, { val }))
      })
    }(filterarr, 0, filterarr.length, graph, Object.assign({ this: val, val }, ns)))
  }

  o.whenAND = (sess, cfg, graph, node, ns, whenarr, fn) => {
    fnguard.isobjlike(graph, node).isobj(sess, cfg).isany(ns).isfn(fn)

    ;(function next (x, len) {
      if (x >= len) return fn(null, null) // no errors

      o.geterror(sess, cfg, graph, node, ns, whenarr[x], (err, errMsg) => {
        if (err) return fn(err)
        if (errMsg) return fn(null, errMsg)

        next(++x, len)
      })
    }(0, whenarr.length))
  }

  o.whenOR = (sess, cfg, graph, node, ns, whenarr, fn) => {
    fnguard.isobjlike(graph, node).isobj(sess, cfg).isany(ns).isfn(fn)

    ;(function next (x, len, errorMessage) {
      if (x >= len) return fn(null, errorMessage)
      o.geterror(sess, cfg, graph, node, ns, whenarr[x], (err, errMsg) => {
        if (err) return fn(err)
        if (errMsg) {
          next(++x, len, errMsg)
        } else {
          fn(null, null) // no error message -passing.
        }
      })
    }(0, whenarr.length))
  }

  o.geterror = (sess, cfg, graph, node, ns, spec, fn) => {
    fnguard.isobjlike(graph).isobj(sess, cfg, spec, ns).isfn(fn)

    switch(spec[o.typeprop]) {
    case AND:
      o.whenAND(sess, cfg, graph, node, ns, spec.whenarr, fn)
      break
    case OR:
      o.whenOR(sess, cfg, graph, node, ns, spec.whenarr, fn)
      break
    default:
      o.retopt(sess, cfg, graph, node, ns, Object.assign({
        [o.typeprop]: 'fn' // fn by default
      }, spec), (err, ispass) => (
        (!err && ispass)
          ? fn(null, null)
          : fn(err, spec.errkey || 'errkey')))
    }
  }

  o.getpass = (sess, cfg, graph, node, ns, spec, fn) => (
    o.geterror(sess, cfg, graph, node, ns, spec, (err, errmsg) => {
      if (err || errmsg) return fn(err, errmsg, false)

      fn(null, null, true)
    }))

  return o
}
