/**
 * plugin.js
 *
 * Copyright, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/*global tinymce:true */

tinymce.PluginManager.add('code', function(editor) {
	function showSourceEditor() {
		editor.windowManager.open({
			title: "Source code",
			body: {
				type: 'textbox',
				name: 'code',
				multiline: true,
				minWidth: editor.getParam("code_dialog_width", 600),
				minHeight: editor.getParam("code_dialog_height", 500),
				value: editor.getContent({source_view: true}),
				spellcheck: false
			},
			onSubmit: function(e) {
				editor.setContent(e.data.code);
			}
		});
	}

	editor.addButton('code', {
		icon: 'code',
		tooltip: 'Source code',
		onclick: showSourceEditor
	});

	editor.addMenuItem('code', {
		icon: 'code',
		text: 'Source code',
		context: 'tools',
		onclick: showSourceEditor
	});
});