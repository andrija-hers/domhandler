// This object will be used as the prototype for Nodes when creating a
// DOM-Level-1-compliant structure.
var Plain = require("./plain");

function Node (type, name, data, attribs, children) {
  Plain.call(this, type, name, data, attribs, children);
}
Node.prototype = Object.create(Plain.prototype,{constructor:{
  value: Node,
  enumerable: false,
  configurable: false,
  writable: false
}});
Node.prototype.nodeType = function () {
  return nodeTypes[this.type] || nodeTypes.element;
};

var domLvl1 = {
	tagName: "name",
	childNodes: "children",
	parentNode: "parent",
	previousSibling: "prev",
	nextSibling: "next",
	nodeValue: "data"
};

var nodeTypes = {
	element: 1,
	text: 3,
	cdata: 4,
	comment: 8
};

Object.keys(domLvl1).forEach(function(key) {
	var shorthand = domLvl1[key];
	Object.defineProperty(Node.prototype, key, {
		get: function() {
			return this[shorthand] || null;
		},
		set: function(val) {
			this[shorthand] = val;
			return val;
		}
	});
});

module.exports = Node;
