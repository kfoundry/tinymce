tinymce.PluginManager.add('templplaceholders', function(editor, url) {
  var image_sizes = ['200x200', '728x90','160x600']; // This should eventually come from Metadata

  var templConfigurators = function (w, h) {
    return {
      offer: {
        title: 'Select Offer',
        url: '/offers/select',
        width: 500,
        height: 175,
        onsubmit: function(e) {
          var doc = this.getEl('body').firstChild.contentWindow.document;
          var form_data = {};

          var f = _($($("form", doc)).serializeArray());
          _(f).each(function (o) { form_data[o.name] = o.value; });

          $.getJSON('/offers/' + form_data.offer_id + '.json', function (offer) {
            var size = w + 'x' + h;
            var idx = jQuery.inArray(size, image_sizes) + 1;
            // Idea from https://gist.github.com/jlong/2428561
            var offerURI = document.createElement('a');
            var sido = "__sido={{__kf_sido__}}";
            offerURI.href = offer.url;
            queryParams = offerURI.search.substr(1).split('&');
            queryParams.push(sido);
            offerURI.search = '?' + queryParams.join('&');
            editor.insertContent('<a href="' + offerURI.href + '" class=c360-offer data-offer-id="' + form_data.offer_id + '"><img src="' + offer['img_url' + idx] + '" width="' + w + '" height="' + h + '"></a>');
          });
        }
      },

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
          editor.insertContent('<img src=' + e.data.img_url + ' class=c360-image width="' + w + '" height="' + h + '">');
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
    var radioButtons = [];
    for (var i = 0, iLen = image_sizes.length; i < iLen; i++) {
      var size = image_sizes[i];
      radioButtons.push({type: 'radio', name: size, label: size , onclick: radioBehaviorFunc});
    }
    return {
      width: 180,
      height: 125,     
      title: 'Image Size',
      body: radioButtons,
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
      editor.insertContent('<!-- PLUGIN EDITED CONTENT BEGIN. (EDIT AT YOUR OWN RISK) --> <img src="http://placehold.it/' + label + '" class="c360-placeholder c360-' + placeholder + '" width="' + w + '" height="' + h + '"><!-- PLUGIN EDITED CONTENT END --->');
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
      'icon': 'offer',
      'placeholder': 'offer'
    },
    'insertimage': {
      'tooltip': 'Insert Image',
      'icon': 'image',
      'placeholder': 'img'
    },
    'insertpersonalreco': {
      'tooltip': 'Insert Personal Reco',
      'icon': 'magic',
      'placeholder': 'personalreco'
    }
  };

  tinymce.each(templButtons, function (config, btn) {
    var param = 'kf_' + config.placeholder + '_enabled';
    if (editor.getParam(param, false)) {
      editor.addButton(btn, tinymce.extend(btnConfig(config.placeholder), config));
    }
  });

});