import get from "lodash-es/get.js";
import set from "lodash-es/set.js";
import unset from "lodash-es/unset.js";
import has from "lodash-es/has.js";
import flattenObject from "flatten-object";

//import console from 'a-nicer-console'

/**
 * Implementation on top of plain objects that brings a variety of array-like functionality.
 * It also supports `dotted.string.notation` for accessing properties.
 * @function HybridObject
 * @param {Object} [data]
 * @exports HybridObject
 * @namespace HybridObject
 */
function HybridObject(data = {}) {
    Object.assign(this, data);
}

/**
 * Get a deep clone of either all data in the object or a partial by providing `path`
 * @param {String} [path]
 * @memberof HybridObject
 * @method clone
 * @instance
 * @see https://developer.mozilla.org/en-US/docs/Web/API/structuredClone
 * @since 1.0.0
 * @returns {HybridObject}
 * @example
 * const hObj = new HybridObject({
 *     a: {
 *         b: {
 *             c: 1
 *            }
 *         }
 * });
 * const clone = hObj.clone();
 * console.log(clone.get('a.b.c')); // 1
 * console.log(hObj.get('a.b.c')); // 1
 * hObj.set('a.b.c', 2);
 * console.log(clone.get('a.b.c')); // 1
 * console.log(hObj.get('a.b.c')); // 2
 */
HybridObject.prototype.clone = function (path) {
    return new HybridObject(structuredClone(path ? this.get(path) : this));
};

/**
 * Returns an array of the object's own enumerable string-keyed property [key, value] pairs
 * Equivalent to `Array.entries()`
 * @memberof HybridObject
 * @method entries
 * @instance
 * @since 1.0.0
 * @returns {Array}
 * @example
 * const hObj = new HybridObject({
 *     a: {
 *         ab: 1
 *     },
 *     b: {
 *         bb: 2
 *     }
 * });
 * console.log(hObj.entries()); // [["a",{"ab":1}],["b",{"bb":2}]]
 */
HybridObject.prototype.entries = function () {
    return Object.entries(this);
};

/**
 * Equivalent of Array.every
 * @param {Function} callbackFn Args: value, path, flattenedObject [, thisArg]
 * @param {Object|undefined} [thisArg] Value to use as `this` when executing callbackFn
 * @memberof HybridObject
 * @method every
 * @instance
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every
 * @since 1.0.0
 * @returns {Boolean}
 * @example
 * const hObj = new HybridObject({
 *     a: 1,
 *     b: {
 *        bb: 2
 *     },
 *     c: 3
 * });
 * console.log(hObj.every(value => typeof value === 'number')); // true
 */
HybridObject.prototype.every = function (callbackFn, thisArg) {
    const flat = this.flatten();
    for (let [path, value] of Object.entries(flat)) {
        if (!callbackFn(value, path, flat, thisArg)) {
            return false;
        }
    }
    return true;
};

/**
 * Equivalent of Array.filter
 * @param {Function} callbackFn Args: value, path, flattenedObject [, thisArg]
 * @param {Object|undefined} [thisArg] Value to use as `this` when executing callbackFn
 * @memberof HybridObject
 * @method filter
 * @instance
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
 * @since 1.0.0
 * @returns {HybridObject}
 * @example
 * const hObj = new HybridObject({
 *     a: 1,
 *     b: {
 *         bb: 2
 *     },
 *     c: 3,
 *     d: 'foo'
 * });
 * // as HybridObject:
 * console.log(hObj.filter(value => typeof value === 'number')); // {a:1,b:{bb:2},c:3}
 * // Use finalValues() to return the values as an array:
 * console.log(hObj.filter(value => typeof value === 'number').finalValues()); // [1,2,3]
 */
HybridObject.prototype.filter = function (callbackFn, thisArg) {
    const filtered = {};
    const flat = this.flatten();
    for (let [path, value] of Object.entries(flat)) {
        if (callbackFn(value, path, flat, thisArg)) {
            set(filtered, path, value);
        }
    }
    return new HybridObject(filtered);
};

/**
 * Equivalent of Array.find, return the first element that satisfies the provided callback function.
 * @param {Function} callbackFn Args: value, path, flattenedObject [, thisArg]
 * @param {Object|undefined} [thisArg] Value to use as `this` when executing callbackFn
 * @memberof HybridObject
 * @method find
 * @instance
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
 * @since 1.0.0
 * @returns {*} but never an object or array as they would become part of the path
 * @example
 * const hObj = new HybridObject({
 *     a: 1,
 *     b: {
 *         bb: 2
 *     },
 *     c: 3,
 *     d: 'foo'
 * });
 * console.log(hObj.find(value => typeof value === 'number' && value > 1)); // 2
 */
HybridObject.prototype.find = function (callbackFn, thisArg) {
    const flat = this.flatten();
    for (let [path, value] of Object.entries(flat)) {
        if (callbackFn(value, path, flat, thisArg)) {
            return value;
        }
    }
};

/**
 * Equivalent of Array.findIndex. Returns the flattend path of the first value found
 * @param {Function} callbackFn Args: value, path, flattenedObject [, thisArg]
 * @param {Object|undefined} [thisArg] Value to use as `this` when executing callbackFn
 * @memberof HybridObject
 * @method findPath
 * @instance
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
 * @since 1.0.0
 * @returns {String|undefined}
 * @example
 * const hObj = new HybridObject({
 *     a: 1,
 *     b: {
 *         bb: 2
 *     },
 *     c: 3,
 *     d: 'foo'
 * });
 * console.log(hObj.findPath(value => typeof value === 'number' && value > 1)); // 'b.bb'
 */
HybridObject.prototype.findPath = function (callbackFn, thisArg) {
    const flat = this.flatten();
    const value = this.find(callbackFn, thisArg);
    return value === undefined
        ? undefined
        : this.paths().find((key) => flat[key] === value);
};

/**
 * Retrieve an array of all the values of the the flattened object. This is not to be confused hObj.values() which,
 * just like Object.values(obj), returns the values at the top level of the object.
 * @memberof HybridObject
 * @method finalValues
 * @instance
 * @since 1.0.0
 * @returns {Array}
 * @example
 * const hObj = new HybridObject({
 *     a: 1,
 *     b: {
 *        bb: 2
 *     },
 *     c: 3
 * });
 * console.log(hObj.finalValues()); // [1,2,3]
 */
HybridObject.prototype.finalValues = function () {
    return Object.values(this.flatten());
};

/**
 * Sets the value at path of object. If a portion of path doesn't exist, it's created.
 * Arrays are created for missing index properties while objects are created for all other missing properties.
 * Uses Lodash's `set` method, but without the `object` argument.
 * @param {Array|string} path The path of the property to set
 * @param {*} value
 * @memberof HybridObject
 * @method set
 * @instance
 * @see https://lodash.com/docs/#set
 * @since 1.0.0
 * @returns {HybridObject}
 * @example
 * const obj = new HybridObject({
 *    a: {
 *       b: {
 *         c: 1
 *      }
 *   }
 * });
 * obj.set('a.b.c', 2);
 * obj.get('a.b.c'); // 2
 * obj.set('a.b.d', 2);
 * obj.get('a.b.d'); // 2
 * obj.set('a.b.e.f', 2);
 * obj.get('a.b.e.f'); // 2
 */
HybridObject.prototype.set = function (path, value) {
    return set(this, path, value);
};

/**
 * Removes the property at path of object.
 * Uses Lodash's `unset` method, but without the `object` argument.
 * @param {Array|string} path The path of the property to unset
 * @memberof HybridObject
 * @method unset
 * @instance
 * @see https://lodash.com/docs/#unset
 * @since 1.0.0
 * @returns {Boolean}
 * @example
 * const obj = new HybridObject({
 *   a: {
 *    b: {
 *     c: 1
 *   }
 * });
 * obj.unset('a.b.c');
 * obj.get('a.b.c'); // undefined
 * obj.unset('a.b.d');
 */
HybridObject.prototype.unset = function (path) {
    return unset(this, path);
};

/**
 * Gets the value at path of object. If the resolved value is undefined, the defaultValue is returned in its place.
 * Uses Lodash's `get` method, but without the `object` argument.
 * @param {Array|string} path The path of the property to get
 * @param {*} [defaultValue] The default value to return if the path doesn't exist
 * @memberof HybridObject
 * @method get
 * @instance
 * @see https://lodash.com/docs/#get
 * @since 1.0.0
 * @returns {String|Object}
 */
HybridObject.prototype.get = function (path, defaultValue) {
    return get(this, path, defaultValue);
};

/**
 * Convert data to JSON
 * @param {Boolean} [pretty]
 * @memberof HybridObject
 * @method toJson
 * @instance
 * @since 1.0.0
 * @returns {String}
 */
HybridObject.prototype.toJson = function (pretty = false) {
    return JSON.stringify(this, null, pretty ? "\t" : null);
};

/**
 * Retrieve a version of the object with all 'keys.flattened.to.paths'
 * @memberof HybridObject
 * @method flatten
 * @instance
 * @since 1.0.0
 * @returns {Object}
 */
HybridObject.prototype.flatten = function () {
    return flattenObject(this);
};

/**
 * Retrieve an array with all 'keys.flattened.to.paths'
 * @memberof HybridObject
 * @method paths
 * @instance
 * @since 1.0.0
 * @returns {Array}
 */
HybridObject.prototype.paths = function () {
    return Object.keys(this.flatten());
};

/**
 * Equivalent of Array.forEach
 * @param {Function} callbackFn Args: value, path, flattenedObject [, thisArg]
 * @param {Object|undefined} [thisArg] Value to use as `this` when executing callbackFn
 * @memberof HybridObject
 * @method forEach
 * @instance
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
 * @since 1.0.0
 * @returns {undefined}
 */
HybridObject.prototype.forEach = function (callbackFn, thisArg) {
    const flat = this.flatten();
    for (let [path, value] of Object.entries(flat)) {
        callbackFn(value, path, flat, thisArg);
    }
};

/**
 * Checks if path is a direct property of object.
 * Uses Lodash's `has` method, but without the `object` argument.
 * @param {Array|string} path The path to check
 * @memberof HybridObject
 * @method has
 * @instance
 * @see https://lodash.com/docs/#has
 * @since 1.0.0
 * @returns {Boolean} Returns true if path exists, else false.
 */
HybridObject.prototype.has = function (path) {
    return has(this, path);
};

/**
 * Equivalent of Array.includes, though without the index argument
 * @param {Primitive} searchElement The value to search for
 * @memberof HybridObject
 * @method includes
 * @instance
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
 * @since 1.0.0
 * @returns {Boolean}
 */
HybridObject.prototype.includes = function (searchElement) {
    return Object.values(this.flatten()).includes(searchElement);
};

/**
 * Retrieve an array of all keys at the top level of the object
 * @memberof HybridObject
 * @method keys
 * @instance
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/keys
 * @since 1.0.0
 * @returns {Array}
 */
HybridObject.prototype.keys = function () {
    return Object.keys(this);
};

/**
 * Equivalent of Array.map
 * @param {Function} callbackFn callbackFn Args: value, path, flattenedObject [, thisArg]
 * @param {Object|undefined} [thisArg] Value to use as `this` when executing callbackFn
 * @memberof HybridObject
 * @method map
 * @instance
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
 * @since 1.0.0
 * @returns {HybridObject}
 */
HybridObject.prototype.map = function (callbackFn, thisArg) {
    const mapped = {};
    const flat = this.flatten();
    for (let [path, value] of Object.entries(flat)) {
        set(mapped, path, callbackFn(value, path, flat, thisArg));
    }
    return new HybridObject(mapped);
};

/**
 * Merge the object into the target object
 * @param {Object} target The target object
 * @memberof HybridObject
 * @method assign
 * @instance
 * @since 1.0.0
 * @returns {Object}
 * @example
 *  const obj = new HybridObject({
 *   a: {
 *   b: {
 *   c: 1
 *  }
 * });
 * const target = {
 * a: {
 * b: {
 * c: 2
 * }
 * }
 * };
 * obj.assign(target);
 * target.a.b.c; // 1
 */
HybridObject.prototype.assign = function (...objs) {
    objs = objs.map(obj => new HybridObject(obj));
    return Object.assign(this, ...objs);
};

/**
 * Get the number of keys at the top level of the object.
 * Equivalent of `Array.length`, but implemented as a function.
 * @memberof HybridObject
 * @method length
 * @instance
 * @since 1.0.0
 * @returns {Number}
 */
HybridObject.prototype.length = function () {
    return this.keys().length;
};

/**
 * Equivalent of Array.reduce
 * @param {Function} callbackFn Args: accumulator, value, path, flattenedObject [, thisArg]
 * @param {Object|undefined} [initialValue] Value to use as the first argument to the first call of the callback.
 * @param {Object|undefined} [thisArg] Value to use as `this` when executing callbackFn
 * @memberof HybridObject
 * @method reduce
 * @instance
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce
 * @since 1.0.0
 * @returns {Object}
 * @example
 * const obj = {
 *     a: 1,
 *     b: 2,
 *     c: 3,
 * };
 * const result = obj.reduce((accumulator, value, path, flattenedObject) => {
 *     return accumulator + value;
 * }, 0);
 * console.log(result); // 6
 */
HybridObject.prototype.reduce = function (callbackFn, initialValue, thisArg) {
    const flat = this.flatten();
    let accumulator = initialValue;
    for (let [path, value] of Object.entries(flat)) {
        accumulator = callbackFn(accumulator, value, path, flat, thisArg);
    }
    return accumulator;
};

/**
 * Equivalent of Array.some
 * @param {Function} callbackFn Args: value, path, flattenedObject [, thisArg]
 * @param {Object|undefined} [thisArg] Value to use as `this` when executing callbackFn
 * @memberof HybridObject
 * @method some
 * @instance
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some
 * @since 1.0.0
 * @returns {Boolean}
 */
HybridObject.prototype.some = function (callbackFn, thisArg) {
    const flat = this.flatten();
    for (let [path, value] of Object.entries(flat)) {
        if (callbackFn(value, path, flat, thisArg)) {
            return true;
        }
    }
    return false;
};

/**
 * Equivalent of Array.sort
 * @param {Function} [compareFn] Args: a, b
 * @memberof HybridObject
 * @method sort
 * @instance
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
 * @since 1.0.0
 * @returns {HybridObject}
 * @example
 * const obj = {
 *    a: 1,
 *  b: 2,
 * c: 3,
 * };
 * const sorted = obj.sort((a, b) => {
 *    return a - b;
 * });
 * console.log(sorted); // { a: 1, b: 2, c: 3 }
 * console.log(sorted.keys()); // ['a', 'b', 'c']
 * console.log(sorted.values()); // [1, 2, 3]
 * console.log(sorted.entries()); // [ [ 'a', 1 ], [ 'b', 2 ], [ 'c', 3 ] ]
 * console.log(sorted.flatten()); // { a: 1, b: 2, c: 3 }
 * console.log(sorted.flatten().keys()); // ['a', 'b', 'c']
 * console.log(sorted.flatten().values()); // [1, 2, 3]
 * console.log(sorted.flatten().entries()); // [ [ 'a', 1 ], [ 'b', 2 ], [ 'c', 3 ] ]
 * console.log(sorted.flatten().flatten()); // { a: 1, b: 2, c: 3 }
 */
HybridObject.prototype.sort = function (compareFn) {
    const flat = this.flatten();
    const sorted = Object.entries(flat).sort(
        ([pathA, valueA], [pathB, valueB]) => {
            if (compareFn) {
                return compareFn(valueA, valueB);
            }
            return valueA - valueB;
        }
    );
    return new HybridObject(
        sorted.reduce((accumulator, [path, value]) => {
            set(accumulator, path, value);
            return accumulator;
        }, {})
    );
};

/**
 * Equivalent of Object.values(object), retrieves an array of all values
 * @memberof HybridObject
 * @method values
 * @instance
 * @since 1.0.0
 * @returns {Array}
 */
HybridObject.prototype.values = function () {
    return Object.values(this);
};

const obj = { a: 1, b: 2 };
const hybridObj = new HybridObject(obj);
console.log(hybridObj.values());

export default HybridObject;
