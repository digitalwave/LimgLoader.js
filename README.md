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

The MIT License

Copyright (c) 2012 Pixel Lab

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associateddocumentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
OR OTHER DEALINGS IN THE SOFTWARE.

