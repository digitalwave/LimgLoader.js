LimgLoader.js
=============

Check the limgLoader.js for more details.

LimgLoader()
------------
Example:

var img = 'http://www.jpl.nasa.gov/images/earth/earth2-browse.jpg?v=';
var cachefix = +(new Date()); 

var loader = LimgLoader({ connection_limit: 1 });

var mydata = { baz: 1 };

loader.onStateChange(function (e, queue_length, data) {
    console.log(
        e.type + ' | ' + this.state + ' | ' + this.src,
        e.type === 'statechange',
        this.data === mydata,
        this.state, // === "loaded || error || timeout"
        this.src !== "foobar.jpg",
        data.baz === mydata.baz
    );
}).onBeforeLoad(function (e, queue_length, data) {
    console.log(
        e.type === 'beforeload',
        e.type,
        this.state,
        this.src
    );
});


loader.add(img + '_A__' + (++cachefix), mydata); // returns LimgLoaderPic
loader.add(img + '_B__' + (++cachefix), mydata);
loader.add(img + '_C__' + (++cachefix), mydata);


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

