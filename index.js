var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/node_modules/angular-hotkeys/build'));

var idindex = 2;

function getId() {
    return idindex++;
}

function countClients(team){
    var count = 0;
    for(var clientId in state.clients){
        if(state.clients[clientId].team == team){
            count ++;
        }
    }
    return count;
}

var state = {
    buzz: null,
    clients: {},
    teams: {
        0: {
            name: "Team 1",
            score: 0,
        },
        1: {
            name: "Team 2",
            score: 0,
        }
    }
};

io.on('connection', function(socket) {

    var client = {
        name: "User",
        focus: true,
        team: null,
        score: 0,
    };

    state.clients[socket.id] = client;

    socket.emit('state', state);

    socket.on('autojoin', function() {
        for (var teamId in state.teams) {
            if (client.team === null || countClients(teamId) < countClients(client.team))
                client.team = teamId;
        }
        io.emit('client', {
            id: socket.id,
            client: client
        });
    });

    socket.on('name', function(name) {
        client.name = name;
        io.emit('client', {
            id: socket.id,
            client: client
        });
    });

    socket.on('focus', function(focus) {
        client.focus = Boolean(focus.focus);
        io.emit('client', {
            id: socket.id,
            client: client
        });
    });

    socket.on('buzz', function() {
        if (!state.buzz) {
            state.buzz = socket.id;
            io.emit('buzz', {
                id: socket.id
            });
        }
    });

    socket.on('reset', function() {
        state.buzz = null;
        io.emit('buzz', {
            id: null
        });
    });

    socket.on('disconnect', function() {
        if (client.team) {
            delete state.clients[socket.id];
            if (socket.id == state.buzz) {
                io.emit("buzz", {
                    id: socket.id,
                    client: null
                });
            }
            io.emit("client", {
                id: socket.id,
                client: null
            });
        }
    });

    socket.on('score', function(data) {
        state.teams[data.team].score += data.score;
        io.emit('score', {
            team: data.team,
            score: state.teams[data.team].score
        });
    });

    io.emit('client', {
        id: socket.id,
        client: client
    });
});

http.listen(process.env.PORT || 80, process.env.IP || null, function() {
    console.log('listening on *:80');
});
