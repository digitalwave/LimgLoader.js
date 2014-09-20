
/** @name LimgLoader
 *  @description Image preloading utility
 *  @depends jQuery || Zepto || etc
 *  @author Imre Ardelean <blastart@gmail.com>
 *  @website <https://github.com/blastart/LimgLoader.js>
 */


;(function($, window, document) {
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

    _u.EventShim = function EventShim() {
        /** Event handler utility
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

        var events = {}, valid = function(n) { return (typeof n === "string" && !!n); };
        return {
            on: function(name, fn, data) {
                if (typeof fn === "function" && valid(name)) {
                    (events[name] = events[name] || []).push({
                        fn: fn, e: [
                            { data: (data || (void 0)), type: name }
                        ]
                    });
                }
                return this;
            },
            off: function(name) {
                if (valid(name) && events[name]) {
                    events[name].slice(0, events[name].length);
                    delete events[name];
                }
                return this;
            },
            destroy: function() {
                for (var p in events) { if (events.hasOwnProperty(p)) { this.off(p); } }
            },
            trigger: function(name, context /*,many,of,args*/ ) {
                if (valid(name) && events[name]) {
                    var args = Array.prototype.slice.call(arguments, 2);
                    for (var evt in events[name]) {
                        if(!events[name].hasOwnProperty(evt)) { continue; }
                        events[name][evt].fn.apply(
                            (context || this), events[name][evt].e.concat(args)
                        );
                    }
                }
                return this;
            }
        };
    };

    var LimgLoaderPic = (function() {
        /**
         * @type {Object}
         * @this {LimgLoaderPic instance}
         * @constructor
         * @requires none
         * @return {Object} Returns a new LimgLoaderPic object.
         * @param {String, elem, $(elem)} url     - the loadable url or image element
         * @param {Object, Function} _callback    - function to execute after the image is loaded.
         * @param {any} [_data]                   - optional | this.data
         * @example
            var yourdata = {myimg: $('#mypic')};
            var callback = function(pic) {
                pic.data.myimg.src = (pic.state === "loaded") ? pic.src : 'error.png';
                pic.destroy(); // release memory
            };
            var loadable = new LimgLoaderPic('foo.jpg', callback, yourdata);
            loadable.load(120000); // timeout in ms
        */

        /* Test pattern:
            var img = 'http://www.jpl.nasa.gov/images/earth/earth2-browse.jpg?v='+$.now();
            function cb(pic) {
                this.again = (this.again) ? this.again+1 : 1;
                if (this.again <= 2) { console.log(this.data+'pic: ', this.reload()); }
            }
            void ((new LimgLoaderPic(img, cb,'foo')).load() && (new LimgLoaderPic($('<img src="'+img+'" />'), cb,'bar')).load());
        */
        function LimgLoaderPic(url, _callback, _data) {


            this.src = (url && typeof url === "string" ? url : '');

            if (!this.src && (url instanceof $ || (url.nodeType === 1 && url.src))) {
                this.isNode = true; // it is a dom element
                this.$img = $(url);
                this.src = this.$img[0].src +'';
            } else {
                this.isNode = false;
                this.$img = $((new window.Image())).appendTo(this.parent_node);
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

            set_timeout: function(ms) {
                if (ms || ms === false) { this.clear_timeout(); }
                if (ms) {
                    this.timer = (function(pic, ms) {
                        return window.setTimeout(function() { pic.onTimeout.call(pic); }, ms);
                    })(this, Math.abs(ms));
                }
                if (this.state !== "loading") { this.load(); }
                return this;
            },

            clear_timeout: function() {
                if (this.timer) { window.clearTimeout(this.timer); this.timer = false;}
                return this;
            },

            set_src: (function() {
                var lpxgif = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
                return function() {
                    var img = this.$img[0], src = this.src;
                    img.src = '';
                    window.setTimeout(function() { // IE8
                        img.src = src;
                        if (img.complete || typeof img.complete === "undefined") {
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

            destroy: (function() { //dereferencing: keeps the .state && .data && .src porps
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

        $.fn.limgLoad = (function(LimgLoaderPic) {
            /**
             *$().limgLoad(fn) a jQuery plugin implementation of the LimgLoaderPic.
             * @reuires LimgLoaderPic
             * @param {Function} callback  - function to execute after the image is loaded.
             * @param {Number}   [timeout] - optional
             * @example
             * $('img').limgLoad(function(pic) { $(this).addClass(pic.state); }, 120000);
            */
            function _apply(pic) {
                pic.data.call(pic.$img[0], pic.destroy());
            }
            return function(callback, timeout) {
                if(typeof callback !== "function") { return this; }
                return this.each(function() {
                    return (new LimgLoaderPic(this, _apply, callback)).load(timeout);
                });
            };
        })(LimgLoaderPic);

        return LimgLoaderPic;
    })();



    var LimgLoader = (function(LimgLoaderPic) {
        /**
         * @type {Object}
         * @constructor
         * @requires LimgLoaderPic
         * @return {Object} Returns a new LimgLoader object.
         * @param {Object} [options] - see below
         * @example

            var img = 'http://www.jpl.nasa.gov/images/earth/earth2-browse.jpg?v=';

            var loader = LimgLoader({connection_limit: 1});
            var mydata = {baz: 1};

            loader.onStateChange(function(e, queue_length, data) {
                console.log(
                    e.type+ ' | ' +this.state+ ' | '+ this.src,
                    e.type === 'statechange',
                    this.data === mydata,
                    this.state === "loaded || error || timeout",
                    this.src !== "foobar.jpg",
                    data.baz === mydata.baz
                );
            }).onBeforeLoad(function(e, queue_length, data) {
              e.type === 'beforeload';
              konsole.log(e.type +' | '+ this.state +' | '+ this.src);
            });

            loader.add(img+'_A__'+($.now()+1), mydata);
            loader.add(img+'_B__'+($.now()+1), mydata);
            loader.add(img+'_C__'+($.now()+1), mydata);
        */
        function LimgLoader(options) {
            if (!(this instanceof LimgLoader)) { return (new LimgLoader(options)); }
            var that = this;

            this.options = $.extend({
                connection_limit: 8, /** {Integer}  how many images can be loaded at once */
                stateChange: null,   /** {Function} fired when the preloading is finished */
                beforeLoad: null,    /** {Function} called before an image is queued */
                timeout:  240000,    /** {[Integer, falsy]} Loading timeout */
                debug: false         /** {Boolean} show/hide debugging messages */
            }, (options || {}));

            this.events = new _u.EventShim();
            this.loadables = [];
            this.uniques = {};
            this.list = [];
            this.picCallback = function() { that.loaded.apply(that, arguments); };

            if (this.options.debug) {
                if (console && console.log) {
                    void (!$ && !$.on && console.log("LimgLoader: jQuery.js is required."));
                } else {
                    this.options.debug = false;
                }
            }

            this.onStateChange(this.options.stateChange).onBeforeLoad(this.options.beforeLoad);
        }

        LimgLoader.prototype.isLimgLoaderPic = function(pic, mth, apos) {
            var r = pic instanceof LimgLoaderPic;
            void (!r && this.options.debug && console.log(
                'Arg'+ (apos || 0) +' must be a instance of LimgLoaderPic to call '+mth+ ' method')
            );
            return r;
        };

        LimgLoader.prototype.destroy = function() {
            for (var p in this) {
                if (!this.hasOwnProperty(p)) { continue; }
                if (typeof this[p] === "object") {
                    for (var pp in this[p]) {
                        if (!this[p][pp].hasOwnProperty(pp)) { continue; }
                        void (this[p][pp] instanceof LimgLoaderPic && this[p][pp].destroy());
                        delete this[p][pp];
                    }
                }
                delete this[p];
            }
            return this;
        };

        LimgLoader.prototype.onStateChange = function(callback) {
            this.events.on('statechange', callback);
            return this;
        };

        LimgLoader.prototype.onBeforeLoad = function(callback) {
            this.events.on('beforeload', callback);
            return this;
        };

        LimgLoader.prototype.unbind = function() {
            this.events.off('statechange').off('beforeload');
            return this;
        };

        LimgLoader.prototype.size = function() {
            return this.list.length + this.loadables.length;
        };
        LimgLoader.prototype.check = function () {
            if (this.list.length && this.loadables.length < (this.options.connection_limit || 1)) {
                var pic = this.list.shift();
                this.events.trigger('beforeload', pic, this.size(), pic.data);
                this.loadables.push(pic.load(this.options.timeout));
            }
        };
        LimgLoader.prototype.loaded = function(pic) {
            if (!this.isLimgLoaderPic(pic, 'loaded')) { return null; }

            if(pic.state !== 'loaded' && this.options.debug) {
                console.log('['+pic.state+']: This url cannot be loaded: '+ pic.src);
            }
            return this.remove(pic);
        };

        LimgLoader.prototype.add = function(src, data) {
            if (typeof src === "string" && !!src && !this.uniques[src]) {
                var pic = new LimgLoaderPic(src, this.picCallback, data);
                this.uniques[src] = 1;
                this.list.push(pic);
                this.check();
                return pic;
            }
            return null;
        };
        LimgLoader.prototype.remove = function(pic) {
            if (!this.isLimgLoaderPic(pic, 'loaded')) { return null; }

            var x = _u.indexOf(this.loadables, pic);

            if (x > -1) {
                this.loadables.splice(x, 1);
            }
            else if  ((x = _u.indexOf(this.list, pic)) > -1) {
                this.list.splice(x, 1);
            }
            delete this.uniques[pic.src];
            this.events.trigger('statechange', pic.destroy(), this.size(), pic.data);
            this.check();
            return pic;
        };
        return LimgLoader;
    })(LimgLoaderPic);



    // AMD loader here.
    window.LimgLoader = LimgLoader;
    window.LimgLoaderPic = LimgLoaderPic;

})(jQuery, window, document);
