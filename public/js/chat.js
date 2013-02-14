$(function() {
  var USERS = window.USERS = {}
    , windowStatus
    , afkDeliveredMessages = 0
    , roomName = $('#room_name').text();

  focusInput();
  //Socket.io
  var socket = io.connect();

  socket.on('error', function (reason){
    console.error('Unable to connect Socket.IO', reason);
  });

  socket.on('connect', function (){
    console.info('successfully established a working connection');
    if($('.chat .chat-box').length == 0) {
      socket.emit('history request');
    }
  });

  socket.on('new msg', function(data) {
	  if(data.gender == "male"){
		  $(" .messagewindow ").append("<p class='me-chat'>" + data.msg + "</p>");
	  }
	  else{
		  $(" .messagewindow ").append("<p class='you-chat'>" + data.msg + "</p>");
	  }
	  
	alert(JSON.stringify(data));
  });

  socket.on('user leave', function(data) {
    alert("user leave");
  });

  $("#reply").click(function(){
	  var inputText = $("#message").val().trim();
	    if(inputText) {
	      var chunks = inputText.match(/.{1,1024}/g)
	        , len = chunks.length;

	      for(var i = 0; i<len; i++) {
	        socket.emit('my msg', {
	          msg: chunks[i]
	        });
	      }

	      $(this).val('');

	      return false;
	    }
  });
  $("#message").keypress(function(e) {
    var inputText = $(this).val().trim();
    if(e.which == 13 && inputText) {
      var chunks = inputText.match(/.{1,1024}/g)
        , len = chunks.length;

      for(var i = 0; i<len; i++) {
        socket.emit('my msg', {
          msg: chunks[i]
        });
      }

      $(this).val('');

      return false;
    }
  });
  
  var textParser = function(text) {
    text = text
      .replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig,"<a href=\"$1\" target='_blank'>$1</a>")
      .replace(/(@)([a-zA-Z0-9_]+)/g, "<a href=\"http://twitter.com/$2\" target=\"_blank\">$1$2</a>");

   return  injectEmoticons(text);
  };

  var parseChatBox = function(chatBox) {
    var chatBoxMsg = chatBox.find('p');
    parseChatBoxMsg(chatBoxMsg);
    return chatBox;
  };

  var parseChatBoxMsg = function(chatBoxMsg) {
    var msg = chatBoxMsg.html();
    return chatBoxMsg.html(textParser(msg));
  };

  var patterns = {
    angry: /\&gt;:-o|\&gt;:o|\&gt;:-O|\&gt;:O|\&gt;:-\(|\&gt;:\(/g,
    naughty: /\&gt;:-\)|\&gt;:\)|\&gt;:-\&gt;|\&gt;:\&gt;/g,
    sick: /:-\&amp;|:\&amp;|=\&amp;|=-\&amp;|:-@|:@|=@|=-@/g,
    smile: /:-\)|:\)|=-\)|=\)/g,
    wink: /;-\)|;\)/g,
    frown: /:-\(|:\(|=\(|=-\(/g,
    ambivalent: /:-\||:\|/g,
    gasp: /:-O|:O|:-o|:o|=-O|=O|=-o|=o/g,
    laugh: /:-D|:D|=-D|=D/g,
    kiss: /:-\*|:\*|=-\*|=\*/g,
    yuck: /:-P|:-p|:-b|:P|:p|:b|=-P|=-p|=-b|=P|=p|=b/g,
    yum: /:-d|:d/g,
    grin: /\^_\^|\^\^|\^-\^/g,
    sarcastic: /:-\&gt;|:\&gt;|\^o\)/g,
    cry: /:'\(|='\(|:'-\(|='-\(/g,
    cool: /8-\)|8\)|B-\)|B\)/g,
    nerd: /:-B|:B|8-B|8B/g,
    innocent: /O:-\)|o:-\)|O:\)|o:\)/g,
    sealed: /:-X|:X|=X|=-X/g,
    footinmouth: /:-!|:!/g,
    embarrassed: /:-\[|:\[|=\[|=-\[/g,
    crazy: /%-\)|%\)/g,
    confused: /:-S|:S|:-s|:s|%-\(|%\(|X-\(|X\(/g,
    moneymouth: /:-\$|:\$|=\$|=-\$/g,
    heart: /\(L\)|\(l\)/g,
    thumbsup: /\(Y\)|\(y\)/g,
    thumbsdown: /\(N\)|\(n\)/g,
    "not-amused": /-.-\"|-.-|-_-\"|-_-/g,
    "mini-smile": /c:|C:|c-:|C-:/g,
    "mini-frown": /:c|:C|:-c|:-C/g,
    content: /:j|:J/g,
    hearteyes: /\&lt;3/g
  };

  var emoticHTML = "<span class='emoticon $emotic'></span>";

  var injectEmoticons = function(text) {
    for(var emotic in patterns) {
      text = text.replace(patterns[emotic],emoticHTML.replace("$emotic", "emoticon-" + emotic));
    }
    return text;
  }

  // TITLE notifications
  var hidden
    , change
    , vis = {
        hidden: "visibilitychange",
        mozHidden: "mozvisibilitychange",
        webkitHidden: "webkitvisibilitychange",
        msHidden: "msvisibilitychange",
        oHidden: "ovisibilitychange" /* not currently supported */
    };             
  
  for (var hidden in vis) {
    if (vis.hasOwnProperty(hidden) && hidden in document) {
        change = vis[hidden];
        break;
    }
  }
  
  if (change) {
    document.addEventListener(change, onchange);
  } else if (/*@cc_on!@*/false) { // IE 9 and lower
    document.onfocusin = document.onfocusout = onchange
  } else {
    window.onfocus = window.onblur = onchange;
  }

  function onchange (evt) {
    var body = document.body;
    evt = evt || window.event;

    if (evt.type == "focus" || evt.type == "focusin") {
      windowStatus = "visible";
    } else if (evt.type == "blur" || evt.type == "focusout") {
      windowStatus = "hidden";
    } else {
      windowStatus = this[hidden] ? "hidden" : "visible";
    }

    if(windowStatus == "visible" && afkDeliveredMessages) {
      afkDeliveredMessages = 0;
      updateTitle();
    }

    if (windowStatus == "visible") {
      focusInput();
    }
  }

  function focusInput() {
    $(".chat-input input.text").focus();
  }
});


