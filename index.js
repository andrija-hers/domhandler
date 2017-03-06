var ElementType = require("domelementtype");

var re_whitespace = /\s+/g;
var Plain = require("./lib/plain");
var Node = require("./lib/node");
var Element = require("./lib/element");

function domDestroyer () {
  this.forEach((child) => {
    if (!child.destroy) {
    } else {
      child.destroy();
    }
  });
  this.destroy = null;
}

function DomHandler(callback, options, elementCB){
	if(typeof callback === "object"){
		elementCB = options;
		options = callback;
		callback = null;
	} else if(typeof options === "function"){
		elementCB = options;
		options = defaultOpts;
	}
	this._callback = callback;
	this._options = options || defaultOpts;
	this._elementCB = elementCB;
	this.dom = [];
  this.dom.destroy = domDestroyer.bind(this.dom);
	this._done = false;
	this._tagStack = [];
	this._parser = this._parser || null;
}

//default options
var defaultOpts = {
	normalizeWhitespace: false, //Replace all whitespace with single spaces
	withStartIndices: false, //Add startIndex properties to nodes
	withEndIndices: false, //Add endIndex properties to nodes
};

DomHandler.prototype.onparserinit = function(parser){
	this._parser = parser;
};

//Resets the handler back to starting state
DomHandler.prototype.onreset = function(){
	DomHandler.call(this, this._callback, this._options, this._elementCB);
};

//Signals the handler that parsing is done
DomHandler.prototype.onend = function(){
	if(this._done) return;
	this._done = true;
	this._parser = null;
	this._handleCallback(null);
};

DomHandler.prototype._handleCallback =
DomHandler.prototype.onerror = function(error){
	if(typeof this._callback === "function"){
		this._callback(error, this.dom);
    this._callback = null;
    if (this._tagStack.length) {
      console.log('at end, stack is', this._tagStack.length, 'long');
      process.exit(0);
    }
    this.dom = null;
	} else {
		if(error) throw error;
	}
};

DomHandler.prototype.onclosetag = function(){
	//if(this._tagStack.pop().name !== name) this._handleCallback(Error("Tagname didn't match!"));
	
	var elem = this._tagStack.pop();

	if(this._options.withEndIndices){
		elem.endIndex = this._parser.endIndex;
	}

	if('function' === typeof this._elementCB) this._elementCB(elem);
};

DomHandler.prototype._addDomElement = function(type, name, data, attribs, children){
	var parent = this._tagStack[this._tagStack.length - 1];
	var siblings = parent ? parent.children : this.dom;
	var previousSibling = siblings[siblings.length - 1];
  var element;

	//element.next = null;

  if (this._options.withDomLvl1) {
    if (type === "tag") {
      element = new Element(type, name, data, attribs, children);
    } else {
      element = new Node(type, name, data, attribs, children);
    }
  } else {
    element = new Plain(type, name, data, attribs, children);
  }

	if(this._options.withStartIndices){
		element.startIndex = this._parser.startIndex;
	}
	if(this._options.withEndIndices){
		element.endIndex = this._parser.endIndex;
	}

  /*
	if (this._options.withDomLvl1) {
		element.__proto__ = element.type === "tag" ? ElementPrototype : NodePrototype;
	} else {
    element.__proto__ = PlainPrototype;
  }
  */

	if(previousSibling){
		element.prev = previousSibling;
		previousSibling.next = element;
	} else {
		element.prev = null;
	}

	siblings.push(element);
	element.parent = parent || null;
  if (!(element.children || element.next || element.prev || element.parent || siblings===this.dom)) {
    console.trace();
    console.error(element, 'will not clean up');
    console.error('siblings are', parent ? 'parent children' : 'this.dom');
    process.exit(1);
  }
  if (element.next === element || element.prev === element) {
    console.trace();
    console.error('element', element, 'points to itself');
    process.exit(2);
  }
  return element;
};

DomHandler.prototype.onopentag = function(name, attribs){
  /*
	var element = {
		type: name === "script" ? ElementType.Script : name === "style" ? ElementType.Style : ElementType.Tag,
		name: name,
		attribs: attribs,
		children: []
	};
  */

	this._tagStack.push(this._addDomElement(
    name === "script" ? ElementType.Script : name === "style" ? ElementType.Style : ElementType.Tag,
    name,
    null,
    attribs,
    []
  ));
};

DomHandler.prototype.ontext = function(data){
	//the ignoreWhitespace is officially dropped, but for now,
	//it's an alias for normalizeWhitespace
	var normalize = this._options.normalizeWhitespace || this._options.ignoreWhitespace;

	var lastTag;

	if(!this._tagStack.length && this.dom.length && (lastTag = this.dom[this.dom.length-1]).type === ElementType.Text){
		if(normalize){
			lastTag.data = (lastTag.data + data).replace(re_whitespace, " ");
		} else {
			lastTag.data += data;
		}
	} else {
		if(
			this._tagStack.length &&
			(lastTag = this._tagStack[this._tagStack.length - 1]) &&
			(lastTag = lastTag.children[lastTag.children.length - 1]) &&
			lastTag.type === ElementType.Text
		){
			if(normalize){
				lastTag.data = (lastTag.data + data).replace(re_whitespace, " ");
			} else {
				lastTag.data += data;
			}
		} else {
			if(normalize){
				data = data.replace(re_whitespace, " ");
			}

      /*
			this._addDomElement({
				data: data,
				type: ElementType.Text
			});
      */
      this._addDomElement(ElementType.Text, null, data, null, null);
		}
	}
};

DomHandler.prototype.oncomment = function(data){
	var lastTag = this._tagStack[this._tagStack.length - 1];

	if(lastTag && lastTag.type === ElementType.Comment){
		lastTag.data += data;
		return;
	}

  /*
	var element = {
		data: data,
		type: ElementType.Comment
	};
  */

	this._tagStack.push(this._addDomElement(ElementType.Comment, null, data, null, null));
	//this._tagStack.push(element);
};

DomHandler.prototype.oncdatastart = function(){
	this._tagStack.push(this._addDomElement(ElementType.Text, null, "", null, null));
};

DomHandler.prototype.oncommentend = DomHandler.prototype.oncdataend = function(){
	this._tagStack.pop();
};

DomHandler.prototype.onprocessinginstruction = function(name, data){
	this._addDomElement(ElementType.Directive, name, data, null, null);
};

module.exports = DomHandler;
