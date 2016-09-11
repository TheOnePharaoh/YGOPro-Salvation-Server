/*jslint node : true*/
'use strict';
var express = require('express'),
    fs = require('fs'),
    https = require('https'),
    php = require("node-php"),
    path = require("path"),
    toobusy = require('toobusy-js'),
    app = express(),
    vhost = require('vhost'),
    serveIndex = require('serve-index');

function createVirtualStaticHost(domainName, dirPath) {
    return vhost(domainName, express['static'](dirPath));
}

function createVirtualPHPHost(domainName, dirPath) {
    return vhost(domainName, php.cgi(dirPath));
}


app.use(createVirtualStaticHost('localhost', require('path').resolve(process.cwd() + '\\..\\http')));
app.use(createVirtualPHPHost(process.env.FORUM, require('path').resolve(process.cwd() + '\\..\\..\\..\\invision')));
app.use(createVirtualStaticHost(process.env.ProductionSITE, require('path').resolve(process.cwd() + '\\..\\http')));
app.use(createVirtualPHPHost(process.env.ProductionFORUM, require('path').resolve(process.cwd() + '\\..\\..\\..\\invision')));

//app.use('/ygopro', serveIndex(require('path').resolve(process.cwd() + '\\..\\http\\ygopro', {
//    'icons': true
//})));

app.use(function (req, res, next) {
    if (toobusy()) {
        res.send(503, "I'm busy right now, sorry.");
    } else {
        next();
    }
});



require('fs').watch(__filename, process.exit);


try {
    var privateKey = fs.readFileSync(process.env.SSL + 'ssl.key');
    var certificate = fs.readFileSync(process.env.SSL + 'ssl.crt');


    https.createServer({
        key: privateKey,
        cert: certificate
    }, app).listen(443);
    var http = express.createServer();

    // set up a route to redirect http to https
    http.get('*', function (req, res) {
        res.redirect(process.env.ProductionSITE + req.url)
    })

    // have it listen on 8080
    http.listen(80);
} catch (nossl) {
    app.listen(80);
}