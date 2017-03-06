function destroyer (thingy) {
  if (thingy.destroy) {
    thingy.destroy();
  } else {
    console.error('no destroy on', thingy);
    process.exit(0);
  }
}

var _pcnt = 0;
function Plain (type, name, data, attribs, children) {
  //++_pcnt;
  if (!type) {
    console.trace();
    process.exit(0);
  }
  this.type = type;
  this.name = name;
  this.data = data;
  this.attribs = attribs;
  this.parent = null;
  this.children = children;
  this.startIndex = null;
  this.endIndex = null;
  this.next = null;
  this.prev = null;
}
Plain.prototype.destroy = function () {
  if (!this.type) return;
  this.type = null;
  this.prev = null;
  this.endIndex = null;
  this.startIndex = null;
  this.next = null;
  if (this.children) {
    this.children.forEach(destroyer);
  }
  this.children = null;
  this.parent = null;
  this.attribs = null;
  this.data = null;
  this.name = null;
  //console.log('after destroy, '+(--_pcnt));
};
Plain.prototype.firstChild = function () {
  if (!this.children) {
    return null;
  }
  return this.children[0];
};
Plain.prototype.lastChild = function () {
  if (!this.children) {
    return null;
  }
  return this.children[this.children.length-1];
};

module.exports = Plain;
