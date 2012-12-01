/*
 * grab.js
 *
 * (C) 2012 Tristan Slominski
 */

var grab = function grab ( str, name ) {

  if ( ! str ) return;

  var rx = new RegExp( '\\b' + name + '\\s*=\\s*([^;,]+)', 'i' ),
      cap = rx.exec(str);

  if ( cap ) {
    return cap[ 1 ].trim().replace( /^['"]|['"]$/g, '' );
  }

}; // grab

module.exports = grab;