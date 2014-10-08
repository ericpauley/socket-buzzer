var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

state = {
    buzz: null,
    team1:{
        score:0,
        users:0,
        clients: {}
    },
    team2:{
        score:0,
        users:0,
        clients: {}
    }
}

io.on('connection', function(socket){

    var client = {
        name: "User",
    }
    var team = null;


    socket.on('join', function(){
        if(team == null){
            if(state.team1.users<state.team2.users){
                team = state.team1;
            }else{
                team = state.team2;
            }
            team.clients[socket.id] = client;
            team.users += 1
            io.emit('state', state);
        }
    });

    socket.on('name', function(name){
        client.name = name;
        io.emit('state', state);
    })

    socket.on('buzz', function(){
        if(!state.buzz){
            state.buzz=socket.id;
            io.emit('state', state);
            io.emit('buzz');
        }
    });

    socket.on('reset', function(){
        state.buzz=null;
        io.emit('state', state);
    });

    socket.on('disconnect', function(){
        if(team){
            team.users -= 1;
            delete team.clients[socket.id];
            io.emit("state", state);
        }
    });

    socket.emit("state", state);

    socket.emit("id", socket.id);

    socket.on('team1name', function(name){
        state.team1.name = name;
        socket.emit(state);
    })

    socket.on('team2name', function(name){
        state.team2.name = name;
        socket.emit(state);
    })
});

http.listen(80, function(){
    console.log('listening on *:80');
});