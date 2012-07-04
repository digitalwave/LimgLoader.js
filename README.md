LimgLoader.js
=============

Check the limgLoader.js for more details.

LimgLoader()
------------
Example:

    var loader_queue = LimgLoader({
        connection_limit: 8, // {Integer} how many images can be loaded at once 
        timeout:  240000,    // {Integer, falsy} Loading timeout 
        debug: true         // {Boolean} show/hide debugging messages 
    });
    
    var mydata = {baz: 1}
    
    loader_queue
        .onStateChange(function(e, queue_length, data) { // image is loaded
            (this instanceof LimgLoaderPic) === true;
            e.type === 'statechange';
            this.data === mydata
            this.state === "loaded || error || timeout";
            this.src === "foo1.jpg";
            data.baz === mydata.baz;
        })
        .onBeforeLoad(function(e, queue_length, data) { // called before an image is queued 
            e.type === 'beforeload';
            data.baz++;
        })
        .add('foo1.jpg', mydata)
        .add($('#myimage'), mydata)
        .add('foo3.jpg', mydata)
    ;


LimgLoaderPic()
---------------
Example:

    var yourdata = {myimg: $('#mypic')};
    
    var callback = function(pic) {
        // @this === pic;
        pic.data.myimg.src = (pic.state === "loaded") ? pic.src : 'error.png';
        pic.purge(); // release memory
    };
    
    var loadable = new LimgLoaderPic('foo.jpg', callback, yourdata);
    
    loadable.load(120000); // timeout in ms

    

$().limgLoad(fn, timeout)
-------------------------
Example:

    $('img').limgLoad(function(pic) {
        $(this).addClass(pic.state);
    }, 120000);






License
-------

MIT License

