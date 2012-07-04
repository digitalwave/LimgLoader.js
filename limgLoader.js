
/** @name LimgLoader
 *  @description Image preloading utility
 *  @depends _underscore, jQuery
 *  @author Imre Ardelean <blastart@gmail.com>
 *  @website <http://digitalwave.hu>
 */


;(function($, undefined) {
'use strict';

  
var _u = { A: Array.prototype, O: Object.prototype, F: Function.prototype };
// this code copied from Underscore.js 1.3.3  
_u.indexOf = function(arr, p) { /** @author (c) Jeremy Ashkenas, DocumentCloud Inc. */
    if (arr === null || typeof arr === "undefined") { return -1; }  
    var i, l;
    if (_u.A.indexOf && arr.indexOf === _u.A.indexOf) { return arr.indexOf(p); }
    for (i = 0, l = arr.length; i < l; i++) { if (i in arr && arr[i] === p) { return i; } }
    return -1;
};


var LimgLoader = function(options) {
    /**
     * @type {Object}
     * @constructor
     * @requires LimgLoaderPic
     * @return {Object} Returns a new LimgLoader object.
     * @param {Object} [options] - see below
     * @example
        var loader = LimgLoader({connection_limit: 6});
        var mydata = {baz: 1}
        
        loader
            .onStateChange(function(e, queue_length, data) {
                (this instanceof LimgLoaderPic) === true;
                e.type === 'statechange';
                this.data === mydata
                this.state === "loaded || error || timeout";
                this.src === "foo1.jpg";
                data.baz === mydata.baz;
            })
            .onBeforeLoad(function(e, queue_length, data) {
                e.type === 'beforeload'; 
            })
            .add('foo1.jpg', mydata)
            .add($('#myimage'), mydata)
            .add('foo3.jpg', mydata)
        ;
        
     *
    */

    if (!(this instanceof LimgLoader)){ return (new LimgLoader(arguments)); }
    
    var o, self = this, queue = {list: [], uniques: {}},
        loadables = [], events = new EventShim()
    ;

    o = $.extend({    
        connection_limit: 8, /** {Integer}  how many images can be loaded at once */
        stateChange: null,   /** {Function} fired when the preloading is finished */
        beforeLoad: null,    /** {Function} called before an image is queued */
        timeout:  240000,    /** {[Integer, falsy]} Loading timeout */
        debug: false         /** {Boolean} show/hide debugging messages */
    }, (options || {}));
    
    
    if (o.debug && !($ && $.fn && $.fn.on) && console && console.log) {
        console.log("LimgLoader: jQuery.js is required.");
    }
    
    queue.size = function() { return queue.list.length + loadables.length; };
    
    queue.check = function () {
        if (queue.list.length && loadables.length < (o.connection_limit || 1)) {
            var pic = queue.list.shift();

            events.trigger('beforeload', pic, queue.size(), pic.data);
            loadables.push(pic.load(o.timeout));
        }
    };
    
    queue.add = function(src, data) {
        if (typeof src === "string" && !!src && !queue.uniques[src]) {
            queue.uniques[src] = 1;
            
            var pic = new LimgLoaderPic(src, this.loaded, data);                
            queue.list.push(pic);
            queue.check();
            
            return pic;
        }
        return null;
    };
    
    queue.remove = function(pic) {
        var x = _u.indexOf(loadables, pic);
        
        if (x > -1) {
            loadables.splice(x, 1);
        } else {
            x = _u.indexOf(queue.list, pic);
            if (x > -1) { queue.list.splice(x, 1); }
        }
        delete queue.uniques[pic.src];
        events.trigger('statechange', pic.purge(), queue.size(), pic.data);  
        queue.check();
        return pic;
    };
    
    events.on('statechange', o.stateChange).on('beforeload', o.beforeLoad);
    
    return {
        add: queue.add,
        
        loaded: function(pic) {
            if(pic.state !== 'loaded' && o.debug && console && console.log) {
                console.log('['+pic.state+']: This url cannot be loaded: '+ pic.src);        
            }
            return queue.remove(pic);
        },
        
        onStateChange: function(callback) {
            events.on('statechange', callback); return this;
        },
   
        onBeforeLoad: function(callback) {
            events.on('beforeload', callback); return this;
        },
   
        unbind: function() {
            events.off('statechange').off('beforeload'); return this;
        }
    };
};




function LimgLoaderPic(url, _callback, _data) {

    /**
     * @type {Object}
     * @this {LimgLoaderPic instance}
     * @constructor 
     * @return {Object} Returns a new LimgLoaderPic object.
     * @param {String, elem, $(elem)} url     - the loadable url or image element
     * @param {Object, Function} _callback    - function to execute after the image is loaded.
     * @param {any} [_data]                   - optional | this.data
     * @example 
        var yourdata = {myimg: $('#mypic')};
        var callback = function(pic) {
            pic.data.myimg.src = (pic.state === "loaded") ? pic.src : 'error.png';
            pic.purge(); // release memory
        };
        var loadable = new LimgLoaderPic('foo.jpg', callback, yourdata);
        loadable.load(120000); // timeout in ms
    */
    
    this.src = (url && typeof url === "string" ? url : '');

    if (!this.src && (url instanceof $ || (url.nodeType === 1 && url.src))) {
        this.isNode = true; // it is a dom element
        this.$img = $(url);
        this.src = this.$img[0].src +'';
    } else {
        this.isNode = false; 
        this.$img = $((new Image())).appendTo(this.parent_node);
    }

    this.data = _data || null;
    this.callback = _callback || $.noop;
    this.timer = this.binded = false;
    this.state = 'unloaded';
    return this;
}

LimgLoaderPic.prototype = {
    parent_node: document.createElement('div'),
    
    load: function(timeout) {
        if (this.state === 'loading') { return this; }
        this.state = 'loading';
        return this.bindAll().set_timeout(timeout).set_src();
    },
    
    reload: function(timeout) {
        this.state = 'unloaded'; return this.load(timeout);
    },    
    
    set_timeout: function(ms, bypass) {
        if (ms || ms === false) { this.clear_timeout(); }
        if (ms) {
            this.timer = (function(pic, ms) {
                return setTimeout(function() { pic.onTimeout.call(pic); }, ms);
            })(this, Math.abs(ms));
        }
        if (this.state !== "loading") { this.load(); }
        return this;
    },
    
    clear_timeout: function() {
        if (this.timer) { clearTimeout(this.timer); this.timer = false;}
        return this;
    },
    
    set_src: (function() {
        var lpxgif = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
        return function() {
            var img = this.$img[0], src = this.src;
            img.src = ''; 
            setTimeout(function() { // IE8
                img.src = src;
                if (img.complete || img.complete === undefined) {  
                    img.src = lpxgif;  
                    img.src = src;
                }  
            }, 0);
            return this;        
        };
    })(),
    
    onReadyStateChange: function (e) { // dom event
        var self = (e && e.data) ? e.data.self : this;
        if (self.$img[0].readyState !== 'complete') { return; }
        self.state = 'loaded';
        self.callback(self.unbindAll());
    },
    
    onLoad: function(e) { // dom event
        var self = (e && e.data) ? e.data.self : this;
        self.unbindAll().state = 'loaded';
        self.callback(self);
    },
    
    onError: function(e) { // dom event
        var self = (e && e.data) ? e.data.self : this;
        self.unbindAll().state = 'error';
        self.callback(self);
    },
    
    onTimeout: function() {
        if (this.unbindAll().state !== "loaded") {
            this.state = 'timeout';
        }
        this.callback(this);
        return this;
    },
    
    bindAll: function() {
        if (this.binded) { return this; }
        this.binded = true;
        this.$img.on({
            'load.imgloader': this.onLoad,
            'readystatechange.imgloader': this.onReadyStateChange,
            'error.imgloader': this.onError
        }, {self: this});
        return this;
    },
    
    unbindAll: function() {
        this.binded = false;
        this.clear_timeout().$img.off('.imgloader');
        return this;
    },

    purge: (function() { //dereferencing: keeps .state && .data && .src
        var their = function () {
            var r = {}; for (var p in this) { if(this.hasOwnProperty(p)) { r[p] = this[p]; } } return r;
        };
        return function(keep_proto) {
            if (this.binded) { this.unbindAll(); }
            if (this.$img || this.callback){
                if (!this.isNode) { // parentNode.removeChild
                    this.$img.remove(); delete this.$img;
                } 
                delete this.callback;
                delete this.isNode;
                delete this.timer;
                delete this.binded;
            }
            return keep_proto ? this : their.call(this);
        };
    })()
};


/* Test pattern:
var img = 'http://www.jpl.nasa.gov/images/earth/earth2-browse.jpg?v='+$.now();
function cb(pic) {
    this.again = (this.again) ? this.again+1 : 1; 
    if (this.again <= 2) { console.log(this.data+'pic: ', this.reload()); }
}
if((new LimgLoaderPic(img, cb,'foo')).load() && (new LimgLoaderPic($('<img src="'+img+'" />'), cb,'bar')).load()) {}
*/





/**
 *$().limgLoad(fn) a jQuery plugin implementation of the LimgLoaderPic.
 * @param {Function} callback - function to execute after the image is loaded.
 * @param {Number} [timeout]  - optional
 * @example
 * $('img').limgLoad(function(pic) { $(this).addClass(pic.state); }, 120000);
*/
jQuery.fn.limgLoad = (function($) {
    function _apply(pic) {
        pic.data.call(pic.$img[0], pic.purge());
    }
    return function(callback, timeout) {
        if(typeof callback !== "function") { return this; }
        return this.each(function(i) {
            return (new LimgLoaderPic(this, _apply, callback)).load(timeout);      
        });
    };
})(jQuery);




function EventShim() {
    /**
     * @return {Object} Returns a new EventShim object.
     * @constructor 
     * @example
     *  var x = new EventShim();
     *
     *  x.on('name', function(e, many, of, args) {
     *      e.type === 'name';
     *      e.data === mydata;
     *      this === mycontext;
     *      many === 'foo';
     *  }, mydata);
     *   
     *  x.trigger('name', mycontext, 'foo', 'baz', 'bar');
    */
    
    var e = {}, c = {}, valid = function(n) { return (typeof n === "string" && !!n); };
    return {
        on: function(name, fn, data) {
            if (typeof fn === "function" && valid(name)) {
                if (!e[name]) { e[name] = []; }
                e[name].push({fn: fn, e: [{data: (data || undefined), type: name}]});
            }
            return this;
        },
        off: function(name) {
            if (valid(name) && e[name]) { e[name] = undefined; } return this;
        },
        trigger: function(name, context /*many,of,args*/ ) {
            if (valid(name) && e[name]) {
                var args = Array.prototype.slice.call(arguments, 2);            
                for (var evt in e[name]) {
                    if(!e[name].hasOwnProperty(evt)) { continue; }
                    e[name][evt].fn.apply((context || c), e[name][evt].e.concat(args));
                } 
                
            }
            return this;
        }
    };
}


// AMD loader here.
window.LimgLoader = LimgLoader;
window.LimgLoaderPic = LimgLoaderPic;

})(jQuery); 
