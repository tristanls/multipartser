/*
 * index.js : Evented multipart parser
 *
 * (C) 2012 Tristan Slominski
 */

var events = require( 'events' ),
    grab = require( './grab' );

var isStreamFinished = function (lastSplit) {
  return lastSplit === '--' || lastSplit === '--\r\n';
};

//
// ## function multipartser ()
// Multipartser factory that returns a multipartser event emitter.
//
var multipartser = function multipartser () {

  var _boundary,
      body = '';
      emitter = new events.EventEmitter();

  // set boundary for parsing
  emitter.boundary = function boundary ( __boundary ) {

    _boundary = __boundary;
    return emitter;

  }; // emitter.boundary

  // parse data
  emitter.data = function data ( data ) {

    body += data;

    // see if body contains a full part
    var splits = body.split( "--" + _boundary );
    var lastSplit = splits[ splits.length - 1 ];

    // nothing to do if no full parts found
    if ( splits.length < 3 ) {
      // but we could be finished if the last chunk of data is just '-'
      if ( isStreamFinished( lastSplit ) ) {
        body = undefined;
      }
      return emitter;
    }

    // we found at least one part
    // the first element should be empty string indicating that
    // boundary was at the beginning of the body
    if ( !splits[ 0 ].match(/^\s*$/) ) {
      emitter.emit( 'error', { noBoundaryAtBodyBeginning : true } );
      return;
    }

    var parts = [];

    // grab all splits except the first and last one
    for ( var i = 1; i < splits.length - 1; i++ ) {
      parts.push( splits[ i ] );
    }

    // check if we are done, or if there is more stuff coming
    if ( !isStreamFinished( lastSplit) ) {

      // we are not finished, change body to contain just the remaining part
      body = "\r\n--" + _boundary + lastSplit;

    } else {
      body = undefined;
    }

    emitter.emit( 'parts', parts );
    return emitter;

  }; // emitter.data

  emitter.end = function end () {

    if ( typeof( body ) !== 'undefined' ) {
      emitter.emit( 'error', { unparsedBody : true, body : body } );
    }

    emitter.emit( 'end' );
    return emitter;

  }; // emitter.end

  // parse the multipart parts
  emitter.on( 'parts', function ( parts ) {

    parts.forEach( function ( part ) {

      // part should start with \r\n
      if ( part.indexOf( "\r\n" ) !== 0 ) {
        emitter.emit( 'error', { missingRNAtPartBeginning : true, part : part } );
        return;
      }

      // trim leading \r\n
      part = part.slice( 2 );

      // part should end with \r\n
      if ( part.substring( part.length - 2 ) !== "\r\n" ) {
        emitter.emit( 'error', { missingRNAtPartEnding: true } );
        return;
      }

      // trim trailing \r\n
      part = part.slice( 0, part.length - 2 );

      // 'part' now contains part content only
      // get Content-Disposition line
      var rnIndex = part.indexOf( "\r\n" );
      var contentDisposition = part.slice( 0, rnIndex );
      var contentType = null;

      // trim Content-Disposition line
      part = part.slice( rnIndex + 2 );

      // if next line starts with Content-Type and not \r\n, we have a file
      if ( part.indexOf( "Content-Type" ) === 0 ) {

        rnIndex = part.indexOf( "\r\n" );
        contentType = part.slice( 0, rnIndex );
        // trim Content-Type line
        part = part.slice( rnIndex + 2 );

      } // if ( part.indexOf( "Content-Type" ) == 0 )

      // trim \r\n separator between headers and part contents
      part = part.slice( 2 );

      var name = grab( contentDisposition, 'name' );
      var filename = grab( contentDisposition, 'filename' );

      if ( contentType ) {

        var capture = contentType.match( /^Content-Type:\s*(.*)/ );

        if ( ! capture ) {
          emitter.emit( 'error', { missingContentType : true } );
          return;
        }

        contentType = capture[ 1 ].trim();

      } // if ( contentType )

      if ( filename && contentType ) {

        // we have a file
        emitter.emit( 'part', { type : 'file', name : name, filename : filename,
          contents : part, contentType : contentType } );
        return;

      } else {

        // we have a value
        emitter.emit( 'part', { type : 'field', name : name, value : part } );
        return;

      } // else

    }); // parts.forEach

  }); // emitter.on 'parts'

  return emitter;

}; // multipartser

module.exports = multipartser;
