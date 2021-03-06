function _bindi()
{
  this.DEFAULT_PHASE = 0x1;
  this.UPDATE_PHASE = 0x2;
  this.NAME = "bi";
  this.PREFIX = this.NAME + "-";
  this.COMPONENT_NAME = this.PREFIX + "name";

  this.config = {
    removeMarkup: false
  };

  this.functions = {};

  var BINDI_HTML_VALUE = "html";
  var BINDI_LOADED = this.PREFIX + "loaded";
  var BINDI_NAME = this.COMPONENT_NAME;
  var BINDI_ATTR = this.NAME;
  var BINDI_AS = this.PREFIX + "as";
  var INTERPOLATION_START_TOKEN = "%";
  var INTERPOLATION_END_TOKEN = "%";
  var LIST_SEPARATOR_TOKEN = " ";
  var BINDI_DEF_VALUE_TOKEN = ":";
  var BINDI_INTERPOLATION_REGEX_START = '[' + INTERPOLATION_START_TOKEN + '](';
  var BINDI_INTERPOLATION_REGEX_END = ')(('  + BINDI_DEF_VALUE_TOKEN + ')([^' + INTERPOLATION_END_TOKEN + ']*))?[' + INTERPOLATION_END_TOKEN + ']';
  var FX_CALL_REGEX = {
      interpolationModel: ".*((" + INTERPOLATION_START_TOKEN + ")(.*)(" + INTERPOLATION_END_TOKEN + ")).*",
      fxCallModel: /(?:[^\s"]+|"[^"]*")+/g
    };

  var registerListeners = [];
  var preRenderListeners = [];
  var initListeners = []
  var postRenderListeners = [];
  var cloneListeners = [];
  var bindListeners = [];
  var addListeners = [];
  var removeListeners = [];
  var preInterpretListeners = [];
  var preBindListeners = [];

  var self = this;

  var componentModelId= 0;

  this.ComponentModel = function(name, e)
  {
    this.id = ++componentModelId;
    this.element = e;
    this.name = name;
  };

  var components = {};
  var bindiAttributes = [BINDI_ATTR, BINDI_NAME];

  this.setInterpolationTokens = function(startToken, endToken, defValueToken)
  {
    INTERPOLATION_START_TOKEN = startToken;
    INTERPOLATION_END_TOKEN = endToken;
    BINDI_DEF_VALUE_TOKEN = defValueToken;
    BINDI_INTERPOLATION_REGEX_START = '(' + INTERPOLATION_START_TOKEN + ')(';
    BINDI_INTERPOLATION_REGEX_END = ')('  + BINDI_DEF_VALUE_TOKEN + '([^' + INTERPOLATION_END_TOKEN + ']*))?(' + INTERPOLATION_END_TOKEN + ')';
    FX_CALL_REGEX = {
        interpolationModel: ".*((" + INTERPOLATION_START_TOKEN + ")(.*)(" + INTERPOLATION_END_TOKEN + ")).*",
        fxCallModel: "\\S+",
        fxCallIndicator: "g"
      };
  }

  this.getComponents = function()
  {
    return (components);
  }

  this.clearComponents = function()
  {
    components = {};
  }

   var removeElementTimeout = function(element)
  {
    return function()
    {
      element.remove();
    };
  }


  this.getMaxElementDelay = function(element)
  {
    var durationProperties = ["animation-duration", "transition-duration"];
    var delayProperties = ["animation-delay", "transition-delay"];
    var delay = 0;
    var tmpDelay;
    var tmpDuration;

    for (var i = 0; i < delayProperties.length; i++)
    {
      tmpDuration = getComputedStyle(element)[durationProperties[i]];
      tmpDuration = parseFloat(tmpDuration) * (tmpDuration.substr(-2) == "ms" ? 1 : 1000);
      tmpDelay = getComputedStyle(element)[delayProperties[i]];
      tmpDelay = parseFloat(tmpDelay) * (tmpDelay.substr(-2) == "ms" ? 1 : 1000);
      tmpDelay += tmpDuration;
      if (tmpDelay > delay)
        delay = tmpDelay;
    }
    return (delay);
  }

  this.remove = function(name)
  {
    var time;

    if (components[name])
    {
      for (var i = 0; i < components[name].elements.length; i++)
      {
        this.notifyRemoveSusbcribers(components[name].elements[i]);
        time = this.getMaxElementDelay(components[name].elements[i].element);
        if (time <= 0)
          removeElementTimeout(components[name].elements[i].element)();
        else
          setTimeout(removeElementTimeout(components[name].elements[i].element), time);
      }
      components[name].elements = [];
    }
  }

  this.register = function(attribute)
  {
    for (var i = 0; i < bindiAttributes.length; i++)
    {
      if (bindiAttributes[i] == attribute)
        return ;
    }
    bindiAttributes.push(attribute);
  }

  this.addComponentToCollection = function(name, component)
  {
    components[name].elements.push(component);
  }

  this.getElementIndex = function(element)
  {
    var k = 0;
    var elem = element;
    while(elem.previousElementSibling)
    {
      k++;
      elem = elem.previousElementSibling;
    }
    return k;
  }

  this.insertElementAfterModel = function(collection, name, element)
  {
    var elem = collection.model.element;

    for (var i = 0; i < collection.elements.length; i++)
      elem = elem.nextElementSibling;
    elem.insertAdjacentElement('afterend', element);

  }

  this.insertElementAtIndex = function(collection, element)
  {
    var parent = collection.parent;
    var index = collection.index;
    if (!index) index = 0;
    if (index >= parent.children.length)
    {
      parent.appendChild(element);
    } else {
      parent.insertBefore(element, parent.children[index + collection.elements.length]);
    }
  }

  this.insertElement = function(collection, element)
  {
    var next = collection.next;
    var previous = collection.previous;
    var parent = collection.parent;

    if (next)
      next.insertAdjacentElement('beforebegin', element);
    else if (previous)
      previous.insertAdjacentElement('afterend', element);
    else if (parent)
      parent.append(element);
  }

  this.cloneNode = function(element, param)
  {
    return (element.cloneNode(param));
  }

  this.onClone = function(onClone)
  {
    cloneListeners.push(onClone);
  }

  this.onBind = function(onBind)
  {
    bindListeners.push(onBind);
  }

  this.onPreRender = function(onPreRender)
  {
    preRenderListeners.push(onPreRender);
  }

  this.onRegister = function(onRegister)
  {
    registerListeners.push(onRegister);
  }

  this.onInit = function(onInit)
  {
    initListeners.push(onInit);
  }

  this.onAdd = function(onAdd)
  {
    addListeners.push(onAdd);
  }

  this.onRemove = function(onRemove)
  {
    removeListeners.push(onRemove);
  }

  this.onPreInterpret = function(onPreInterpret)
  {
    preInterpretListeners.push(onPreInterpret);
  }

  this.onPreBind = function(onPreBind)
  {
    preBindListeners.push(onPreBind);
  }

  this.notifyPreRenderSubscribers = function(componentName, tagName, variableName, variableValue, phase)
  {
    for (var i = 0; i < preRenderListeners.length; i++)
      variableValue = preRenderListeners[i](componentName, tagName, variableName, variableValue, phase);
    return (variableValue);
  }

  this.notifyRegisterSubscribers = function(name, component, model, element)
  {
    for (var i = 0; i < registerListeners.length; i++)
      registerListeners[i](name, component, model, self);
  }

  this.notifyInitSubscribers = function(config)
  {
    for (var i = 0; i < initListeners.length; i++)
      initListeners[i](config, self);
  }

  this.notifyCloneSubscribers = function(component)
  {
    for (var i = 0; i < cloneListeners.length; i++)
      cloneListeners[i](component, self);
  }

  this.notifyBindSubscribers = function(component, element, data)
  {
    for (var i = 0; i < bindListeners.length; i++)
      bindListeners[i](component, element, data, self);
  }

  this.notifyRemoveSusbcribers = function(element)
  {
    var maxDuration = undefined;
    var duration;

    for (var i = 0; i < removeListeners.length; i++)
    {
      duration = removeListeners[i](element, self);
      if (duration && (!maxDuration || (parseInt(duration) > maxDuration)))
        maxDuration = duration;
    }
    return (maxDuration || 0);
  }

  this.notifyAddSusbcribers = function(element)
  {
    for (var i = 0; i < addListeners.length; i++)
      addListeners[i](element, self);
  }

  this.notifyPreInterpretSubscribers = function(element)
  {
    for (var i = 0; i < preInterpretListeners.length; i++)
      preInterpretListeners[i](element, self);
  }

  this.notifyPreBindSubscribers = function(element, attributesList, data)
  {
    var newAttributes = [];
    var ret;

    for (var i = 0; i < preBindListeners.length; i++)
    {
      ret = preBindListeners[i](element, attributesList, data, self);
      if (ret !== null && ret.constructor === Array)
        newAttributes = newAttributes.concat(ret);
    }
    return (newAttributes);
  }

  this.registerComponent = function(name, element)
  {
    var model = new this.ComponentModel(name, element);
    var component = this.cloneModelFromModel(model);
    var parent = element.parentElement;

    if (!components.hasOwnProperty(name))
    {
      this.notifyRegisterSubscribers(name, component, model);
      components[name] = {
        model: model,
        previous: element.previousElementSibling,
        next: element.nextElementSibling,
        // index: this.getElementIndex(element),
        parent: parent,
        elements: []
      };
    }
    if (this.bindComponentWithDefault(component, component.element) > 0)
    {
      this.insertElement(components[name], component.element);
      component.element.setAttribute(BINDI_LOADED, true);
      components[name].elements.push(component);
    }
    model.element.remove();
  }

  this.foreachJson = function(obj, fx)
  {
    for (var key in obj)
    {
      if (obj.hasOwnProperty(key))
      {
        fx(key, obj[key]);
      }
    }
  }

  this.escapeBinding = function(str)
  {
    return str.replace('%', '%%');
  }

  var getBinding = function(str)
  {
    if (str === undefined) str = "\\w+";
    return (new RegExp(BINDI_INTERPOLATION_REGEX_START + str + BINDI_INTERPOLATION_REGEX_END));
  }

  this.unescape = function(str)
  {
    if (str === undefined)
      return undefined;
    if (str[0] === '"')
      str = str.substr(1);
    if (str[str.length - 1] === '"')
      str = str.substr(0, str.length - 1);
    return (str);
  }

  this.interpret = function(str, noInterpolation)
  {
    var istr;
    var expr = {
      name: undefined,
      def: undefined,
      expr: undefined,
      args: []
    };
    var defValue;

    if (noInterpolation === true)
      expr.expr = str;
    else
    {
      if ((istr = str.match(new RegExp(FX_CALL_REGEX.interpolationModel))) === null)
        return (undefined);
      expr.expr = istr[1];
      str = istr[3];
    }
    matches = str.match(/(?:[^\s"]+|"[^"]*")+/g);
    if (!matches)
      return (undefined);
    for (var i = 0; i < matches.length; i++)
    {
      matches[i] = matches[i].trim();
      if (i == 0)
        expr.name = matches[i];
      else
      {
        defValue = matches[i].split(/\:(?=([^"]*"[^"]*")*[^"]*$)/);
        expr.args.push({
          key: defValue[0],
          def: this.unescape(defValue[2])
        });
      }
    }
    if (expr.args == 0)
      {
        defValue = expr.name.split(/\:(?=([^"]*"[^"]*")*[^"]*$)/);
        expr.name = defValue[0];
        expr.def = this.unescape(defValue[2]);
      }
    return (expr);
  }

  this.replaceBinding = function(componentName, element, tagName, variableName, variableValue, bindings, phase)
  {
    var oldVariableValue = variableValue;

    variableValue = this.notifyPreRenderSubscribers(componentName, tagName, variableName, variableValue, phase);
    if (tagName != BINDI_HTML_VALUE)
      element.setAttribute(tagName, element.getAttribute(tagName).replace(bindings, variableValue));
    else
    {
      element.textContent = element.textContent.replace(bindings, variableValue);
    }
    return (oldVariableValue == variableValue ? 0 : 1);
  }

  this.splitConcat = function(attr)
  {
    if (attr && attr != "")
      attr = attr.split(LIST_SEPARATOR_TOKEN);
    else
      attr = [];
    attr = attr.concat(bindiAttributes);
    return (attr);
  }

  this.bindAttributes = function(componentName, fakeComponent, data)
  {
    var element = fakeComponent.element;
    var attr = element.getAttribute(BINDI_ATTR);
    var occurences = 0;

    attr = this.splitConcat(attr);
    attr = attr.concat(this.notifyPreBindSubscribers(fakeComponent, attr, data));
    for (var i = 0; i < attr.length; i++)
    {
      if (attr[i] == BINDI_HTML_VALUE)
        occurences += self.bindAttr(componentName, fakeComponent, attr[i], data, function()
        {
          return (element.textContent);
        }, function(v)
        {
          element.textContent = v;
        });
      else
        occurences += self.bindAttr(componentName, fakeComponent, attr[i], data, function()
        {
          return element.getAttribute(attr[i]);
        }, function(v)
        {
          element.setAttribute(attr[i], v);
        });
    }
    return (occurences);
  }


  this.dataOrDefault = function(expr, data)
  {
    for (var i = 0; i < expr.args.length; i++)
    {
      if (data && data[expr.args[i].key] !== undefined)
        expr.args[i].value = data[expr.args[i].key];
      else if (expr.args[i].def !== undefined)
        expr.args[i].value = expr.args[i].def;
      else
        expr.args[i].value = expr.args[i].key;
    }
  }

  this.execFx = function(expr)
  {
    return ((bindi.functions[expr.name] || window[expr.name]).apply(this, expr.args.map(function(obj)
    {
      return (obj.value);
    })));
  }

  this.addElementToExpr = function(expr, element)
  {
    expr.args.push({
      key: element,
      value: element
    });
    return expr;
  }

  this.execExpr = function(expr, attrValue, data, fakeComponent)
  {
    var value;
    var attrValue;

    // expression is a function call
    if (expr.args.length > 0)
    {
      this.dataOrDefault(expr, data);
      expr = this.addElementToExpr(expr, fakeComponent);
      value = this.execFx(expr);
    }
    else if (typeof window[expr.name] === "function" || bindi.functions[expr.name] !== undefined)
    {
      var nexpr = {
        name: expr.name,
        args: [{
          value: fakeComponent
        },
        {
          value: data
        }]
      };
      value = this.execFx(nexpr);
    }
    else
      value = data !== undefined && data[expr.name] !== undefined ? data[expr.name] : expr.def;
    return (attrValue.replace(expr.expr, value));
  }

  this.bindAttr = function(componentName, fakeComponent, attr, data, get, set)
  {
    var attrValue;
    var expr;
    var value;
    var occurences = 0;
    var element = fakeComponent.element;

    this.notifyPreInterpretSubscribers(fakeComponent);
    attrValue = get();
    if (attrValue === null)
      return (occurences);
    while ((expr = this.interpret(attrValue)) !== undefined)
    {
      attrValue = this.execExpr(expr, attrValue, data, fakeComponent);
      set(attrValue);
      if (expr.args.length > 0 || expr.def)
        ++occurences;
    }
    return (occurences);
  }

  this.removeMarkupFromElement = function(element)
  {
    if (this.config.removeMarkup === true)
      this.config.removeMarkup = bindiAttributes;
    for (var i = 0; i < this.config.removeMarkup.length; i++)
    {
      if (element.hasAttribute(this.config.removeMarkup[i]))
        element.removeAttribute(this.config.removeMarkup[i]);
    }
  }

  this.bindComponentWithDefault = function(component, element)
  {
    var occurences = 0;
    var occurencesElement = 0;

    for (var i = 0; i < element.children.length; i++)
      occurences += this.bindComponentWithDefault(component, element.children[i]);
    occurencesElement += this.bindAttributes(component.name, {element: element}, undefined);
    this.attachDataToComponent(element, undefined);
    // if (occurencesElement > 0)
      this.notifyBindSubscribers(component, element, undefined);
    if (this.config.removeMarkup !== false)
      this.removeMarkupFromElement(element);
    return (occurences + occurencesElement);
  }

  this.bindComponentWithData = function(component, element, data)
  {
    for (var i = 0; i < element.children.length; i++)
      this.bindComponentWithData(component, element.children[i], data);
    this.bindAttributes(component.name, {element: element}, data);
    this.attachDataToComponent(element, data);
    this.notifyBindSubscribers(component, element, data);
    if (this.config.removeMarkup !== false)
      this.removeMarkupFromElement(element);
    return (element);
  }

  this.attachDataToComponent = function(element, data)
  {
    element.bindi = data;
  }

  this.cloneModel = function(componentName)
  {
    return (new this.ComponentModel(componentName, this.cloneNode(components[componentName].model.element, true)));
  }

  this.cloneModelFromModel = function(model)
  {
    return (new this.ComponentModel(model.name, this.cloneNode(model.element, true)));
  }

  this.evaluate = function(component)
  {
    var oldElement = component.element;

    component.element = this.cloneNode(components[component.name].model.element, true);
    this.bindComponentWithData(component, component.element, component.bindi);
    component.element.setAttribute(BINDI_LOADED, true);
    oldElement.insertAdjacentElement('afterend', component.element);
    oldElement.remove();
    this.addComponentToCollection(component.name, component);

  }

  this.addFromObject = function(componentName, object)
  {
    newComponent = this.cloneModel(componentName);

    this.notifyCloneSubscribers(newComponent);
    newComponent.bindi = object;
    this.bindComponentWithData(newComponent, newComponent.element, object);
    newComponent.element.setAttribute(BINDI_LOADED, true);
    this.notifyAddSusbcribers(newComponent);
    this.insertElement(components[componentName], newComponent.element);
    this.addComponentToCollection(componentName, newComponent);
  }

  this.addFromArray = function(componentName, array)
  {
    for (var i = 0; i < array.length; i++)
      this.addFromObject(componentName, array[i]);
  }

  this.add = function(componentName, data)
  {
    if (data.constructor === Array)
      self.addFromArray(componentName, data);
    else
      self.addFromObject(componentName, data);
  }

  this.update = function(componentName, data)
  {
    this.remove(componentName);
    this.add(componentName, data);
  }

  this.updateMarkupConfig = function(config)
  {
    var REMOVE_MARKUP_KEY = "removeMarkup";

    if (config[REMOVE_MARKUP_KEY])
      self.config[REMOVE_MARKUP_KEY] = config[REMOVE_MARKUP_KEY];
  }

  this.updateTokenConfig = function(config)
  {
    if (config.tokens)
    {
      this.setInterpolationTokens(config.tokens.start || INTERPOLATION_START_TOKEN, config.tokens.end || INTERPOLATION_END_TOKEN, config.tokens.defValue || BINDI_DEF_VALUE_TOKEN);
    }
  }

  this.reset = function()
  {
    components = {}
    this.functions = {}
  }

  this.init = function(config)
  {
    var elements = document.querySelectorAll('[' + BINDI_NAME + ']');

    if (config !== null && typeof config === 'object')
    {
      this.updateMarkupConfig(config);
      this.updateTokenConfig(config);
    }
    this.notifyInitSubscribers(config);
    for (var i = 0; i < elements.length; i++)
    {
      // if (!self.contains(elements[i]))
      // {
        self.registerComponent(elements[i].getAttribute(BINDI_NAME), elements[i]);
      // }
    }
  }

  return (this);
};

var bindi = new _bindi();
