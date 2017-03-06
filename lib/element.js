// DOM-Level-1-compliant structure
var Node = require('./node');
function Element (type, name, data, attribs, children) {
  Node.call(this, type, name, data, attribs, children);
}
Element.prototype = Object.create(Node.prototype,{constructor:{
  value: Element,
  enumerable: false,
  configurable: false,
  writable: false
}});

var domLvl1 = {
	tagName: "name"
};

Object.keys(domLvl1).forEach(function(key) {
	var shorthand = domLvl1[key];
	Object.defineProperty(Element.prototype, key, {
		get: function() {
			return this[shorthand] || null;
		},
		set: function(val) {
			this[shorthand] = val;
			return val;
		}
	});
});

module.exports = Element;
