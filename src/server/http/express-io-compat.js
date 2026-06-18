// express-io-compat.js
//
// The project was originally built on the (now abandoned) `express.io`
// package, which glued Express 3 and Socket.IO 0.9 together and added a
// request-style socket routing layer (io.route / req.io.respond / req.io.emit
// / io.room / io.broadcast). This module reproduces just the parts of that API
// the game relies on, on top of modern Express 4 + Socket.IO 4, so the
// existing socket handlers keep working unchanged.
//
// It also restores the synchronous Socket.IO 0.9 `io.sockets.clients()` helper
// (Socket.IO 4 made socket/room lookups asynchronous) by reading the adapter
// directly.

var socketIO = require('socket.io');
var cookie = require('cookie');
var signature = require('cookie-signature');

module.exports = function attachExpressIO(app, server, opts) {
    opts = opts || {};

    var sessionStore = opts.sessionStore;
    var sessionSecret = opts.sessionSecret;
    var sessionKey = opts.sessionKey || 'connect.sid';

    var io = socketIO(server, opts.ioOptions || {});

    // --- express.io style socket routing -----------------------------------
    io.router = {};

    io.route = function(route, next, options) {
        if (options && options.trigger === true) {
            // trigger a previously-registered route, passing `next` as the request
            var handler = io.router[route];
            if (typeof handler === 'function') {
                handler(next);
            }
            return;
        }

        if (typeof next === 'function') {
            io.router[route] = next;
        } else {
            // object form: register `route:key` handlers
            for (var key in next) {
                io.router[route + ':' + key] = next[key];
            }
        }
    };

    io.broadcast = function() {
        io.sockets.emit.apply(io.sockets, arguments);
    };

    io.room = function(room) {
        return makeRoom(room, io.sockets);
    };

    // Socket.IO 0.9 exposed a synchronous list of connected sockets; the game
    // code still calls io.sockets.clients([room]). Rebuild it from the v4
    // adapter so those call sites don't have to become asynchronous.
    io.sockets.clients = function(room) {
        var ids;
        if (room) {
            var set = io.sockets.adapter.rooms.get(room);
            ids = set ? Array.from(set) : [];
        } else {
            ids = Array.from(io.sockets.sockets.keys());
        }
        return ids
            .map(function(id) { return io.sockets.sockets.get(id); })
            .filter(Boolean);
    };

    // --- socket session loading (replaces express.io authorization) --------
    // express.io parsed the signed session cookie during the socket handshake
    // and attached the loaded session to the handshake. Guests (no/!invalid
    // cookie) are still allowed to connect, matching the original behaviour.
    io.use(function(socket, next) {
        var handshake = socket.handshake;
        handshake.session = null;
        handshake.sessionID = null;

        var rawCookie = handshake.headers && handshake.headers.cookie;
        if (!rawCookie || !sessionStore) {
            return next();
        }

        var cookies = cookie.parse(rawCookie);
        handshake.cookies = cookies;

        var raw = cookies[sessionKey];
        if (!raw) {
            return next();
        }

        var sid = raw;
        if (sid.indexOf('s:') === 0) {
            sid = signature.unsign(sid.slice(2), sessionSecret);
        }
        if (!sid) {
            return next();
        }

        handshake.sessionID = sid;
        sessionStore.get(sid, function(err, session) {
            if (err) {
                return next();
            }
            handshake.session = session || null;
            next();
        });
    });

    // --- wire registered routes onto each connecting socket ----------------
    io.on('connection', function(socket) {
        Object.keys(io.router).forEach(function(key) {
            setRoute(socket, key, io.router[key], io);
        });
    });

    // --- HTTP req.io (lets HTTP handlers trigger socket routes) ------------
    // Registered as middleware so HTTP routes such as GET /logout can forward
    // to the matching socket route via req.io.route('logout').
    app.use(function(req, res, next) {
        req.io = {
            broadcast: function() {
                io.broadcast.apply(io, arguments);
            },
            route: function(route) {
                var ioRequest = {};
                for (var k in req) {
                    ioRequest[k] = req[k];
                }
                ioRequest.io = {
                    broadcast: function() {
                        io.broadcast.apply(io, arguments);
                    },
                    respond: function() {
                        res.json.apply(res, arguments);
                    },
                    route: function(r) {
                        io.route(r, ioRequest, { trigger: true });
                    },
                    data: req.body
                };
                io.route(route, ioRequest, { trigger: true });
            }
        };
        next();
    });

    return io;
};

function makeRoom(name, target) {
    return {
        name: name,
        broadcast: function(event, message) {
            if (target.broadcast) {
                target.broadcast.to(name).emit(event, message);
            } else {
                target.in(name).emit(event, message);
            }
        }
    };
}

function setRoute(socket, key, callback, io) {
    socket.on(key, function(data, respond) {
        if (typeof data === 'function') {
            respond = data;
            data = undefined;
        }

        var handshake = socket.handshake;
        var request = {
            data: data,
            session: handshake.session,
            sessionID: handshake.sessionID,
            socket: socket,
            headers: handshake.headers,
            cookies: handshake.cookies,
            handshake: handshake
        };

        request.io = makeRequestIO(socket, request, io);
        request.io.respond = respond || function() {};

        callback(request);
    });
}

function makeRequestIO(socket, request, io) {
    return {
        socket: socket,
        manager: io,
        broadcast: function(event, message) {
            socket.broadcast.emit(event, message);
        },
        emit: function(event, message) {
            socket.emit(event, message);
        },
        room: function(room) {
            return makeRoom(room, socket);
        },
        join: function(room) {
            socket.join(room);
        },
        leave: function(room) {
            socket.leave(room);
        },
        route: function(route) {
            io.route(route, request, { trigger: true });
        },
        disconnect: function(cb) {
            socket.disconnect(cb);
        }
    };
}
