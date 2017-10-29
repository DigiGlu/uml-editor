var Parser = function() {
  this.classAndInterfaceLists = {};
}

Parser.prototype.parseXmlToclassAndInterfaceList = function(xml) {
  var mxCells = xml.getElementsByTagName("mxCell");

  // Remove the first 2 because they are the canvas elements
  for (var id = 2; id < mxCells.length; id++) {
      var mxCell = mxCells[id];
      var style = mxCell.getAttribute('style');
      var componentName = this.getComponentNameFromStyle(style);
      if (componentName) {
          this.doAction(mxCell, componentName);
      }
  }
  return this.classAndInterfaceLists;
}

/** CHAIN OF RESPONSIBILITY PATTERN */
Parser.prototype.doAction = function(mxCell, componentName) {
  var parser = this;

  var parseStrategyPipeline = {
    handleRequest: function(parser, mxCell, componentName) {
      var classOrInterfaceStrategy = new ClassOrInterfaceStrategy();
      var attributeStrategy = new AttributeStrategy();
      var methodStrategy = new MethodStrategy();
      var generalizationStrategy = new GeneralizationStrategy();

      classOrInterfaceStrategy
        .setNext(attributeStrategy)
        .setNext(methodStrategy)
        .setNext(generalizationStrategy);

      classOrInterfaceStrategy.handleRequest(parser, mxCell, componentName);
    }
  }

  parseStrategyPipeline.handleRequest(parser, mxCell, componentName);
}


var Handler = function() {
  this.next = {
    handleRequest: function(request) { console.log('All strategies exhausted') }
  }
}
Handler.prototype.setNext = function(next) {
  this.next = next;
  return next;
}
Handler.prototype.handleRequest = function(request) {}

var ClassOrInterfaceStrategy = function() {};
ClassOrInterfaceStrategy.prototype = new Handler();
ClassOrInterfaceStrategy.prototype.handleRequest = function(parser, mxCell, componentName) {
  if (componentName === 'class' || componentName === 'interface') {
    return parser.generateAndPushClassOrInterfaceElement(mxCell, componentName);
  }
  return this.next.handleRequest(parser, mxCell, componentName);
}

var AttributeStrategy = function() {};
AttributeStrategy.prototype = new Handler();
AttributeStrategy.prototype.handleRequest = function(parser, mxCell, componentName) {
  if (componentName === 'attribute') {
    return parser.pushAttribute(mxCell);
  }
  return this.next.handleRequest(parser, mxCell, componentName);
}

var MethodStrategy = function() {};
MethodStrategy.prototype = new Handler();
MethodStrategy.prototype.handleRequest = function(parser, mxCell, componentName) {
  if (componentName === 'method') {
    return parser.pushMethod(mxCell);
  }
  return this.next.handleRequest(parser, mxCell, componentName);
}

var GeneralizationStrategy = function() {};
GeneralizationStrategy.prototype = new Handler();
GeneralizationStrategy.prototype.handleRequest = function(parser, mxCell, componentName) {
  if (componentName === 'generalization') {
    console.log('mulai susah wkwkwkwk');
    return;
    // return parser.pushGeneralization(mxCell);
  }
  return this.next.handleRequest(parser, mxCell, componentName);
}

Parser.prototype.generateAndPushClassOrInterfaceElement = function(mxCell, componentName) {
  var initialState = {
    privateAttributes: [],
    publicAttributes: [],
    protectedAttributes: [],
    privateMethods: [],
    publicMethods: [],
    protectedMethods: [],
    implements: [],
    extends: [],
  }

  var generateElement = function(mxCell, componentName) {
    if (componentName === 'class') {
      return Object.assign({
        type: 'class',
        className: mxCell.getAttribute('value'),
      }, initialState);
    } else if (componentName === 'interface') {
      return Object.assign({
        type: 'interface',
        interfaceName: mxCell.getAttribute('value').split(' ')[1],
      }, initialState);
    }
  }

  var id = mxCell.getAttribute('id');
  this.classAndInterfaceLists[id] = generateElement(mxCell, componentName);
}

Parser.prototype.pushAttribute = function(mxCell) {
  var value = mxCell.getAttribute('value');
  var parent = mxCell.getAttribute('parent');
  var parts = value.split(' ');
  var accessibility = parts[0];
  var attribute = {
      attributeName: parts[1].slice(0, -1),
      type: parts[2],
  };
  if (accessibility === "+") {
      this.classAndInterfaceLists[parent].publicAttributes.push(attribute);
  } else if (accessibility === "-") {
      this.classAndInterfaceLists[parent].privateAttributes.push(attribute);
  } else if (accessibility === "#") {
      this.classAndInterfaceLists[parent].protectedAttributes.push(attribute);
  }
}

Parser.prototype.pushMethod = function(mxCell) {
  var value = mxCell.getAttribute('value');
  var parent = mxCell.getAttribute('parent');
  var parts = value.split(' ');
  var accessibility = parts[0];
  var method = {
      methodName: parts[1].slice(0, -1),
      returnType: parts[2],
  };
  if (accessibility === "+") {
      this.classAndInterfaceLists[parent].publicMethods.push(method);
  } else if (accessibility === "-") {
      this.classAndInterfaceLists[parent].privateMethods.push(method);
  } else if (accessibility === "#") {
      this.classAndInterfaceLists[parent].protectedMethods.push(method);
  }
}

Parser.prototype.getComponentNameFromStyle = function(style) {
  var elements = style.split(';');
  var index = -1;
  for (var i = 0; i < elements.length && index === -1; i++) {
      if (elements[i].indexOf('componentName') >= 0) {
          index = i;
      }
  }
  var componentName = null;
  if (index >= 0) {
      componentName = elements[index].split('=')[1];
  }
  return componentName;
}