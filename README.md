multipartser
====

`mutipartser` is an evented multipart form submission parser.

## Installation

    npm install multipartser

## Usage

Below gets complicated, but so does multipart parsing. Please let me know if you find any errors.

The first half just extracts the boundary from the `Content-Type` header. The second half is the one that actually does the parsing.

```javascript
var http = require( 'http' ),
    multipartser = require( 'multipartser' );

http.createServer( function ( req, res ) {

  // get boundary from 'Content-Type' header
  var contentType = req.headers && req.headers[ 'Content-Type' ];
  if ( ! contentType ) {
    res.writeHead( 400 ); // Missing Content-Type
    res.end();
    return;
  }
  
  var contentTypeParts = contentType.split( ';' );
  if ( contentTypeParts.length != 2 ) {
    res.writeHead( 400 );
    res.end();
    return;
  }

  contentType = contentTypeParts[ 0 ];

  if ( contentType != 'multipart/form-data' ) {
    res.writeHead( 415 ); // Unsupported Media Type
    res.end();
    return;
  }

  var boundary = contentTypeParts[ 1 ];
  boundary = boundary.trim().split( '=' );

  if ( boundary.length != 2 ) {
    res.writeHead( 400 ); // Missing multipart boundary
    res.end();
    return;
  }

  boundary = boundary[ 1 ];

  var parser = multipartser(); // finally.. geesh
  parser.boundary( boundary );

  parser.on( 'part', function ( part ) {

    if ( part.type == 'file' ) {
      
      console.log( 'type', part.type );
      console.log( 'name', part.name );
      console.log( 'filename', part.filename );
      console.log( 'contents', part.contents );
      console.log( 'contentType', part.contentType );

    } else if ( part.type == 'field' ) {

      console.log( 'type', part.type );
      console.log( 'name', part.name );
      console.log( 'value', part.value );

    } // else if ( part.type == 'field' )

  }); // parser.on 'part'

  parser.on( 'end', function () {
    console.log( 'completed parsing' );
  }); // parser.on 'end'

  parser.on( 'error', function ( error ) {
    console.error( error );
  }); // parser.on 'error'

  req.setEncoding( 'utf8' );
  req.on( 'data', parser.data );
  req.on( 'end', parser.end );

}).listen( 1337, '127.0.0.1' );
```