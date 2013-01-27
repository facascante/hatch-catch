
/*
 * Module dependencies
 */

var app = module.parent.exports.app
  , passport = require('passport')
  , client = module.parent.exports.client
  , config = require('../config')
  , utils = require('../utils');

/*
 * Homepage
 */

app.get('/', function(req, res, next) {
  if(req.isAuthenticated()){
    client.hmset(
        'users:' + req.user.provider + ":" + req.user.username
      , req.user
    );
    console.log(req.user);
    if(!req.user.codename){
    	res.redirect('/option');
    }
    else{
    	res.redirect('/rooms');
    }
    
  } else{
    res.render('index');
  }
});

/*
 * Authentication routes
 */

if(config.auth.twitter.consumerkey.length) {
  app.get('/auth/twitter', passport.authenticate('twitter'));

  app.get('/auth/twitter/callback', 
    passport.authenticate('twitter', {
      successRedirect: '/',
      failureRedirect: '/'
    })
  );
}

if(config.auth.facebook.clientid.length) {
  app.get('/auth/facebook', passport.authenticate('facebook'));

  app.get('/auth/facebook/callback', 
    passport.authenticate('facebook', {
      successRedirect: '/',
      failureRedirect: '/'
    })
  );
}

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

/*
 * Rooms list
 */

app.all('/option', utils.restrict, function(req, res) {
	if(req.method == "POST"){
		req.user.code_name = req.body.code_name;
		res.redirect('/waiting');
		
	}
	else{
		res.render('option', {users:req.user });
	}
});

/*
 * Found Match Page
 */

app.all('/found', utils.restrict, function(req, res) {
  utils.getPublicRoomsInfo(client, function(rooms) {
	
    res.render('found', { rooms: rooms, users:req.user });
  });
});

/*
 * Score Window Page
 */

app.all('/score', utils.restrict, function(req, res) {
  utils.getPublicRoomsInfo(client, function(rooms) {
	
    res.render('score', { rooms: rooms, users:req.user });
  });
});

/*
 * Chat Window Page
 */

app.all('/cwindow', utils.restrict, function(req, res) {
  utils.getPublicRoomsInfo(client, function(rooms) {
	
    res.render('cwindow', { rooms: rooms, users:req.user });
  });
});


/*
 * Waiting Page
 */

app.all('/waiting', utils.restrict, function(req, res) {
  utils.getPublicRoomsInfo(client, function(rooms) {
    res.render('waiting', { rooms: rooms, users:req.user });
  });
});

/*
 * Rooms list
 */

app.get('/rooms', utils.restrict, function(req, res) {
  utils.getPublicRoomsInfo(client, function(rooms) {

		res.render('room_list', { rooms: rooms, users:req.user });
	
  });
});

/*
 * Create a rooom
 */

app.post('/create', utils.restrict, function(req, res) {
  utils.validRoomName(req, res, function(roomKey) {
    utils.roomExists(req, res, client, function() {
      utils.createRoom(req, res, client);
    });
  });
});

/*
 * Join a room
 */

app.get('/:id', utils.restrict, function(req, res) {
  utils.getRoomInfo(req, res, client, function(room) {
    utils.getUsersInRoom(req, res, client, room, function(users) {
      utils.getPublicRoomsInfo(client, function(rooms) {
        utils.getUserStatus(req.user, client, function(status) {
          utils.enterRoom(req, res, room, users, rooms, status);
        });
      });
    });
  });
});

