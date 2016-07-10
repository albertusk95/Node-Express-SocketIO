/*
	Server-side code
*/

// Imports modules
var express = require("express");
var app = express();
var http = require("http").createServer(app);
var bodyParser = require("body-parser");
var io = require("socket.io").listen(http);
var _ = require("underscore");

/* 
	The list of participants in our chatroom.
	The format of each participant will be:
	{
	id: "sessionId",
	name: "participantName"
	}
*/
var participants = [];

// Server configuration - hostname and listening port 
app.set("ipaddress", "localhost");
app.set("listeningport", 8080);

// Assets and views directory configuration 
app.set("views", __dirname + "/views");
app.set("view engine", "pug");
app.use(express.static(__dirname + "/assets"));

// Tells the server to support JSON requests
app.use(bodyParser.json());

// Handle route "GET /", as in "http://localhost:8080/"
app.get("/", function(request, response) {

	// Send the index.pug page to the client 
	response.render("index");
	
});

// Receives a chat message from client 
app.post("/message", function(request, response) {

	// The request body expects a param named "message"
	var message = request.body.message;

	// If the message is empty or wasn't sent it's a bad request
	if(_.isUndefined(message) || _.isEmpty(message.trim())) {
		return response.status(400).json({error: "Message is invalid"});
	}

	// We also expect the sender's name with the message
	var name = request.body.name;

	// Send an event 'incomingMessage' to all clients 
	io.sockets.emit("incomingMessage", {message: message, name: name});

	// Status OK 
	response.status(200).json({message: "Message received"});

});

// Socket.IO events 
io.on("connection", function(socket){

	/*
		When the server receives an event 'newUser' from a client, 
		then it'll add the new client to the participants' list and 
		send an event 'newConnection' to all clients 
	*/
	socket.on("newUser", function(data) {
		participants.push({id: data.id, name: data.name});
		console.log("Number of participants: " + participants.length);
		io.sockets.emit("newConnection", {participants: participants});
	});

	/*
		When the server receives an event 'nameChange' from a client, 
		then it'll update the client's name and send an event 'nameChanged'
		to all clients 
	*/
	socket.on("nameChange", function(data) {
		_.findWhere(participants, {id: data.id}).name = data.name;
		io.sockets.emit("nameChanged", {id: data.id, name: data.name});
	});

	/* 
		When a client disconnects from the server, the event "disconnect" is automatically 
		captured by the server. It will then emit an event called "userDisconnected" to 
		all participants with the id of the client that disconnected
	*/
	socket.on("disconnect", function() {
		participants = _.without(participants,_.findWhere(participants, {id: socket.id}));
		io.sockets.emit("userDisconnected", {id: socket.id, sender:"system"});
	});
	
	socket.on("disconnectUser", function(data) {
		participants = _.without(participants,_.findWhere(participants, {id: data.id}));
		console.log("Disconnected user: " + data.id);
		io.sockets.emit("userDisconnected", {id: data.id, sender:"system"});
	});

});

// Start the server 
http.listen(app.get("listeningport"), app.get("ipaddress"), function() {
	console.log("Server is running...");
});