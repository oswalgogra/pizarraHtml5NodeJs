//var express = require('express');
//var app = express();
//var fs = require('fs'); 
//var io = require('socket.io').listen(8089);
var io = require('socket.io')(server);
var _un = require('underscore'); // para minimizar el trabajo
var usuariosConectados = [];
var socketsClientes = [];
//var publicDir = "www/";

io.sockets.on('connection', function(socket){
	socket.set("usuario","");
	socketsClientes[socket.id] = socket;
	
	socket.broadcast.emit('datos chat',{'numConectados': usuariosConectados.length, 'usuarios': usuariosConectados});
	
	// un usuario solicita conectarse
	socket.on('ingresar usuario', function(mensaje){
		var disponible = loginDisponible(usuariosConectados,mensaje.usuario);
		var logueado = usuarioLogueado(socketsClientes,mensaje.usuario, socket.id);
		if(disponible){		
			var socketUsuario = socketsClientes[socket.id]
			socketUsuario.set("usuario",mensaje.usuario);
			usuariosConectados[usuariosConectados.length] = mensaje.usuario;
			var cantUsCon = usuariosConectados.length;
			socket.broadcast.emit('nuevo usuario', {'usuario': mensaje.usuario, "mensaje": mensaje.usuario +" ha entrado al chat.", 'numConectados': cantUsCon, 'usuarios': usuariosConectados});
			socket.emit('datos chat',{'numConectados': usuariosConectados.length, 'usuarios': usuariosConectados});
			if(!logueado)
				socket.emit('sesion iniciada',{'mensaje': 'ok', 'usuario':mensaje.usuario});
		}else{
			socket.emit('username ocupado',{'mensaje': "El username "+ mensaje.usuario +" no esta disponible, digite uno diferente"});
		}
		
	});
	
	socket.on('cambia mi posicion',function(datos){
		usuario = datos.usuario;
		x = datos.x;
		y = datos.y;
		color = datos.color;
		console.log(usuario +","+ x +","+ y +","+ color);
		socket.broadcast.emit("cambia posicion usuario",{"usuario": usuario, "color": color, "x": x, "y": y});
	});
	
	socket.on('cambia mi color',function(datos){
		usuario = datos.usuario;
		color = datos.color;
		//console.log("Cambiar el color de "+usuario+" a "+ color);
		//console.log(usuario +","+ color);
		socket.broadcast.emit("cambia color usuario",{"usuario": usuario, "color": color});
	});
	
	socket.on('desconectarme', function(datos){
		socket.get('usuario',function(err,usuario){
			if(usuario != ""){
				console.log("******* Desconectar a "+ usuario +" *****");
				socket.set("usuario","");
				usuariosConectados = sacarUsuario(usuario,usuariosConectados);
				refrescarChat();
				socket.emit('desconectado',{'mensaje':'ok'});
				socket.broadcast.emit('alguien se desconecto',{'mensaje': usuario +' se desconecto.', 'usuario': usuario});
			}
		});
	});
	
	socket.on('desconectar usuario', function(mensaje){
		if(_un.contains(usuariosConectados,mensaje.usuario))
			usuariosConectados = _un.without(usuariosConectados,mensaje.usuario);
		refrescarChat();
	});
	
	socket.on('reiniciar chat',function(datos){
		refrescarChat();
		console.log("se renicia el chat para los usuarios");
		socket.send({'mensaje': 'Chat reiniciado exitosamente!'});
	});

	socket.on("limpiar",function(datos){
		socket.broadcast.emit("limpiar",{'usuario': datos.usuario});
	});
	
	
	var refrescarChat = function (){
		socket.broadcast.emit('datos chat', {'numConectados': usuariosConectados.length, 'usuarios': usuariosConectados});
	};
	
	var loginDisponible = function(usuarios,login){
		var esta = _un.contains(usuarios,login);
		return !esta;
	};
	
	var usuarioLogueado = function(clientes,usuarioLogueado, idSocket){
		var resultado = _un.findWhere(clientes,{'usuario': usuarioLogueado, 'id': idSocket});
		return !(resultado == null);
	};
	
	var sacarUsuario = function(usuario,usuariosConectados){
		usuariosConectados = _un.reject(usuariosConectados,function(usuarioLog){
			return usuarioLog.usuario == usuario;
		});
		return usuariosConectados;
	};
});

/*app.get('/', function(req, res) {
	path = publicDir + "login.html";
	var pagina = fs.readFileSync(path); // readFileSync lee algo desde el disco duro
	res.writeHead(200,{"Content-Type":"text/html"});
	res.write(pagina);
	res.end();
});


app.get('/chat/', function(req, res) {
	path = publicDir + "chat.html";
	var pagina = fs.readFileSync(path); // readFileSync lee algo desde el disco duro
	res.writeHead(200,{"Content-Type":"text/html"});
	res.write(pagina);
	res.end();
});*/

//app.listen(process.env.VCAP_APP_PORT || 3000);
