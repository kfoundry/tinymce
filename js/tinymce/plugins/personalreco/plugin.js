tinymce.PluginManager.add('personalreco', function(editor, url) {
    // Add a button that opens a window
    editor.on("dblclick", function(ed, e) {
          console.debug('Editor was clicked: ' + ed.target.nodeName);
      });
    editor.addButton('personalreco', {
        tooltip: 'Personalized Reco',
        icon: 'magic',        
        onclick: function() {
            // Open window
            editor.windowManager.open({
                title: 'Personalized Reco',
                url: '/campaigns/personalizedreco',
                width: 600,
                height: 250,
                autoResize: false,
                buttons: [{
                          text: 'Ok',
                          onclick: 'submit'
                         }, {
                          text: 'Close',
                          onclick: 'close'
                         }],
                onsubmit: function(e) {
                    var doc = this.getEl('body').firstChild.contentWindow.document;
                    var form_data = {};
                    var f = _($($("form", doc)).serializeArray());

                    _(f).each(function (o) { form_data[o.name] = o.value; });

                    // alert("Submitted.e=" + JSON.stringify(e));
                    // Insert content when the window form is submitted
                    editor.insertContent('<!--{{reco-start}}--> <img src="http://placehold.it/140x100" data-reco="' + form_data.reco_num + '" data-reco-def="' + form_data.default_reco + '"><!--{{reco-end}}-->');
                }
            });
        }
    });

});