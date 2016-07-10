/*
	Client-side code
*/

function init() {

	// New client will send a connection request to the server 
	var socket = io.connect("localhost:8080");

	// Session ID of the new connected client 
	var sessionId = '';

	// Function to update list of participants 
	// If the session ID is the current client's ID, then append the word '(You)' which indicates 
	// the current client 
	function updateParticipants(participants) {
		$('#participants').html('');
		for (var i = 0; i < participants.length; i++) {
		  $('#participants').append('<span id="' + participants[i].id + '">' + participants[i].name + ' ' + (participants[i].id === sessionId ? '(You)' : '') + '<br /></span>');
		} 
	}

	/*
		When a connection request from client is OK, then 
		the callback function will show the client's session ID 
		and send event 'newUser' to the server 
	*/
	socket.on('connect', function () {
		sessionId = socket.io.engine.id;
		console.log('Connected ' + sessionId);
		socket.emit('newUser', {id: sessionId, name: $('#name').val()});
	});

	socket.on('disconnect', function () {
		console.log('Disconnected ' + sessionId);
		socket.emit('disconnectUser', {id: sessionId});
	});
	
	/*
		When the client receives an event 'newConnection' from the server,
		the callback function will update the list of participants 
	*/
	socket.on('newConnection', function (data) {    
		updateParticipants(data.participants);
	});

	/*
		When the client receives an event 'userDisconnected' from the server, 
		the program will remove the span element from the participants element
	*/
	socket.on('userDisconnected', function(data) {
		$('#' + data.id).remove();
	});

	/*
		When the client receives an event 'nameChanged' from the server,
		it'll update the span with the given ID accordingly
	*/
	socket.on('nameChanged', function (data) {
		$('#' + data.id).html(data.name + ' ' + (data.id === sessionId ? '(You)' : '') + '<br />');
	});

	/*
		When the client receives an event 'incomingMessage' from the server,
		it'll prepend it to the messages section
	*/
	socket.on('incomingMessage', function (data) {
		var message = data.message;
		var name = data.name;
		$('#messages').prepend('<b>' + name + '</b><br />' + message + '<hr />');
	});

	/*
		Log an error if unable to connect to server
	*/
	socket.on('error', function (reason) {
		console.log('Unable to connect to server', reason);
	});

	// This function will do a simple ajax POST call to our server with
	// whatever message we have in our textarea
	function sendMessage() {
		var outgoingMessage = $('#outgoingMessage').val();
		var name = $('#name').val();
		$.ajax({
		  url:  '/message',
		  type: 'POST',
		  contentType: 'application/json',
		  dataType: 'json',
		  data: JSON.stringify({message: outgoingMessage, name: name})
		});
	}

	// If user presses Enter key on textarea, call sendMessage if there
	// is something to share
	function outgoingMessageKeyDown(event) {
		if (event.which == 13) {
		  event.preventDefault();
		  if ($('#outgoingMessage').val().trim().length <= 0) {
			return;
		  }
		  sendMessage();
		  $('#outgoingMessage').val('');
		}
	}

	// Helper function to disable/enable Send button
	function outgoingMessageKeyUp() {
		var outgoingMessageValue = $('#outgoingMessage').val();
		$('#send').attr('disabled', (outgoingMessageValue.trim()).length > 0 ? false : true);
	}

	// When a user updates his/her name, let the server know by
	// emitting the "nameChange" event
	function nameFocusOut() {
		var name = $('#name').val();
		socket.emit('nameChange', {id: sessionId, name: name});
	}

	/* Elements setup */
	$('#outgoingMessage').on('keydown', outgoingMessageKeyDown);
	$('#outgoingMessage').on('keyup', outgoingMessageKeyUp);
	$('#name').on('focusout', nameFocusOut);
	$('#send').on('click', sendMessage);

}

$(document).on('ready', init);