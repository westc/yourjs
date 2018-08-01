(function (EMPTY_OBJECT, queuedEmbeds, doc) {
  embedYJSConsole = function (details, opt_fnCode) {
    var script = doc.getElementsByClassName('yourjs-console-embed')[0];

    if (!script || script.nodeName.toUpperCase() !== 'SCRIPT') {
      throw new Error('No "script.yourjs-console-embed" was found.');
    }

    script.removeAttribute('class');

    queue(script, details, opt_fnCode);
  };

  function queue(script, details, opt_fnCode) {
    queuedEmbeds.push([script, details, opt_fnCode]);
    if (/^(complete|loaded)$/.test(doc.readyState)) {
      runQueue();
    }
  }

  function has(obj, key) {
    return EMPTY_OBJECT.hasOwnProperty.call(obj, key);
  }

  function forEachProp(value, callback) {
    value = Object(value);
    for (var k in value) {
      if (has(value, k)) {
        callback(value[k], k, value);
      }
    }
  }

  function extend(target, source) {
    forEachProp(source, function (value, key) {
      target[key] = value;
    });
    return target;
  }

  function runQueue() {
    queuedEmbeds.forEach(function (args) {
      var script = args[0],
        details = args[1],
        opt_fnCode = details.code || args[2];

      var div = document.createElement('div');
      extend(
        div.style,
        extend(
          {
            boxShadow: '0 0 5px 0 #000',
            borderRadius: '10px 10px 0 0',
            position: 'relative',
            overflow: 'hidden',
            height: '500px',
            width: '100%'
          },
          details.style
        )
      );

      var iframe = document.createElement('iframe');
      extend(extend(iframe, { frameBorder: 0, src: 'about:blank' }).style, {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%'
      });

      var urlHasParams, url = 'http://yourjs.' + (details.isLocal ? 'local' : 'com') + '/console/';
      forEachProp(details.params, function (value, key) {
        url += (urlHasParams ? '&' : '?') + escape(key) + '=' + escape(value);
        urlHasParams = 1;
      });

      if (opt_fnCode) {
        opt_fnCode = (opt_fnCode + '').replace(/function.*?\{([^]*)\}/g, '$1');

        var indentation = opt_fnCode.match(/^[ \xA0\t]+(?=\S)/mg).reduce(function (min, line) {
          return Math.min(min, line.length);
        }, Infinity);
        indentation = isFinite(indentation) ? indentation : 0;

        opt_fnCode = opt_fnCode.replace(
          new RegExp('^[\\xA0 ]{' + indentation + '}|^\t{' + Math.floor(indentation / (details.tabSize || 4)) + '}', 'mg'),
          ''
        );

        var interval = setInterval(function () {
          var frmWin = iframe.contentWindow,
            frmDoc = frmWin.document;
          if (frmWin && /^(loaded|complete)$/i.test(frmDoc.readyState)) {
            postURL(frmDoc, url, { code: opt_fnCode });
            clearInterval(interval);
          }
        }, 50);
      }
      else {
        iframe.src = url;
      }

      div.appendChild(iframe);
      script.parentNode.insertBefore(div, script);
    });
    queuedEmbeds = [];
  }

  function postURL(doc, url, opt_data) {
    var body = doc.body,
      form = extend(doc.createElement("FORM"), { method: 'POST', action: url });
    form.style.display = "none";
    forEachProp(opt_data, function (value, key) {
      form.appendChild(extend(doc.createElement("TEXTAREA"), {
        name: key,
        value: 'object' === typeof value ? JSON.stringify(value) : value
      }));
    });
    body.appendChild(form);
    form.submit();
    body.removeChild(form);
    return form;
  }

  doc.addEventListener("DOMContentLoaded", function () {
    runQueue();
  });
})({}, [], document);
