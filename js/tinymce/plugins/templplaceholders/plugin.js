tinymce.PluginManager.add('templplaceholders', function(editor, url) {
  var templConfigurators = function (w, h) {
    return {
      personalreco: {
        title: 'Personalized Reco',
        url: '/campaigns/personalizedreco',
        width: 600,
        height: 250,
        onsubmit: function(e) {
            var doc = this.getEl('body').firstChild.contentWindow.document;
            var form_data = {};
            var f = _($($("form", doc)).serializeArray());

            _(f).each(function (o) { form_data[o.name] = o.value; });

            // alert("Submitted.e=" + JSON.stringify(e));
            // Insert content when the window form is submitted
            editor.insertContent('<!--{{reco-start}}--> <img src="http://comune.albanolaziale.rm.it/_media/images/books.jpg" width="' + w + '" height="' + h + '" data-reco="' + form_data.reco_num + '" data-reco-def="' + form_data.default_reco + '"><!--{{reco-end}}-->');
        }
      },
      image: {
        body: [
          {type: 'textbox', label: 'Image URL', name: 'img_url'}
        ],
        onsubmit: function (e) {
          editor.insertContent('<img src=' + e.data.img_url + ' width="' + w + '" height="' + h + '">');
        }
      }      
    }
  };
  
  editor.on("dblclick", function(ed, e) {
        var nodeName = ed.target.nodeName;
        var placeholder = '';
        var classes = ed.target.className;

        if (nodeName === 'IMG') {
          if (classes.indexOf('c360-personalreco') !== -1) {
            placeholder = 'personalreco';
          } else if (classes.indexOf('c360-offer') !== -1) {
            placeholder = 'offer';
          } else if (classes.indexOf('c360-img') !== -1) {
            placeholder = 'image';
          }
        }

        if (placeholder !== '') {
          var w = ed.target.getAttribute("width");
          var h = ed.target.getAttribute("height");
          var dblclickWindows = templConfigurators(w, h);

          editor.windowManager.open(tinymce.extend({
            title: 'Configure ' + placeholder,
            buttons: [{
              text: 'Ok',
              onclick: 'submit'
            }, {
              text: 'Close',
              onclick: 'close'
            }]
          }, dblclickWindows[placeholder]));
        }
    });

  var windos = [];
  var nWindos = 0;
  var radioBehavior = function (idx) {
    return function (e) {
      var radioBtns = windos[idx].find("radio");
      tinymce.each(radioBtns, function (radioBtn) { radioBtn.checked(false); });
      this.checked(!this.checked());
    };
  };

  // Add a button that opens a window
  var windoConfig = function (idx) {
    var radioBehaviorFunc = radioBehavior(idx);
    return {
      width: 180,
      height: 125,     
      title: 'Image Size',
      body: [
        {type: 'radio', name: '200x200', label: '200x200' , onclick: radioBehaviorFunc},
        {type: 'radio', name: '728x90', label: '728x90', onclick: radioBehaviorFunc},
        {type: 'radio', name: '160x600', label: '160x600', onclick: radioBehaviorFunc}
      ],
      buttons: [{
                text: 'Ok',
                onclick: 'submit'
               }, {
                text: 'Close',
                onclick: 'close'
               }]
   };
  };

  var onSubmitFunc = function (placeholder) {
    return function(e) {
      var label = '';
      tinymce.each(e.data, function (val, key) { if (val) label = key; });
      var parts = label.split('x'), w = parts[0], h = parts[1];
      editor.insertContent('<!-- PLUGIN EDITED CONTENT BEGIN. (EDIT AT YOUR OWN RISK) --> <img src="http://placehold.it/' + label + '" class="c360-' + placeholder + '" width="' + w + '" height="' + h + '"><!-- PLUGIN EDITED CONTENT END --->');
    };
  };

  var btnConfig = function (placeholder) {
    return {
      onclick: function() {
        // Open window
        windos[nWindos] = editor.windowManager.open(tinymce.extend(windoConfig(nWindos), {'onsubmit': onSubmitFunc(placeholder)}));
        nWindos++;
      }
    };
  };


  var templButtons = {
    'insertoffer': {
      'tooltip': 'Insert Offer',
      'icon': 'undo',
      'placeholder': 'offer'
    },
    'insertimage': {
      'tooltip': 'Insert Image',
      'icon': 'cut',
      'placeholder': 'img'
    },
    'insertpersonalreco': {
      'tooltip': 'Insert Personal Reco',
      'icon': 'redo',
      'placeholder': 'personalreco'
    }
  };

  tinymce.each(templButtons, function (config, btn) {
    editor.addButton(btn, tinymce.extend(btnConfig(config.placeholder), config));
  });

});