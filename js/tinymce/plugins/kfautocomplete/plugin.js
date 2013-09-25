(function (exports) {

  var autocomplete_data = {};
  var DOWN_ARROW_KEY = 40;
  var UP_ARROW_KEY = 38;
  var ESC_KEY = 27;
  var ENTER_KEY = 13;
  var END_WORD_KEYS = [32, 59, 186, 188, 190];

  var autocomplete_data = {};

  /**
   * Search for autocomplete options after text is entered and display the 
   * option list if any matches are found. 
   */
  function keyUpEvent(ed, e) {
    if (valid(e.keyCode)) {
      hideOptionList();
    }
    if ((!autocomplete_data.visible && e.keyCode != ESC_KEY && e.keyCode != ENTER_KEY) && (e.keyCode != DOWN_ARROW_KEY && e.keyCode != UP_ARROW_KEY && e.keyCode != ENTER_KEY && e.keyCode != ESC_KEY) && valid(e.keyCode)) {
      var currentWord = getCurrentWord(ed);
      if (currentWord) {
        var matches = matchingOptions(currentWord);
        if (currentWord.length > 0) {
          populateList(currentWord, ed);
        }
        if (currentWord.length == 0 || matches.length == 0) {
          hideOptionList();
        }        
      }
    }
  }


  /**
   * Populates autocomplete list with matched words.
   *
   */
  function populateList(currentWord, ed) {
    var wordLessTrigger = currentWord.replace(autocomplete_data.startTrigger, "");

    if (autocomplete_data.optionsUrl) {
      if (wordLessTrigger.length <= 1)
        return false;

      jQuery.ajax({
        type: "GET",
        url: autocomplete_data.optionsUrl,
        cache: false,
        data: "q=" + wordLessTrigger,
        success: function (data) {
          //hideLoading();
          if (data.ok && data.DATA) {
            var options = [];
            for (var i in data.DATA) {
              if (data.DATA[i].name)
                options.push(data.DATA[i].name);
            }
            autocomplete_data.options = options;

            matches = matchingOptions(wordLessTrigger);

            if (matches.length > 0) {
              displayOptionList(matches, wordLessTrigger, ed);
              highlightNextOption();
            }
          } else {
            // No data
          }
        },
        error: function (jqXHR, textStatus) {
          // Error
        }
      }); // ajax

    } else {
      matches = matchingOptions(wordLessTrigger);

      if (matches.length > 0) {
        displayOptionList(matches, wordLessTrigger, ed);
        highlightNextOption();
      }
    }
  } // populateList


  /**
   * Prevent return from adding a new line after selecting an option.  
   */
  function keyPressEvent(ed, e) {
    if (e.keyCode == ENTER_KEY && autocomplete_data.cancelEnter) {
      autocomplete_data.cancelEnter = false;
      return tinymce.dom.Event.cancel(e);
    }
  }

  /**
   * Handle navigation inside the option list when it is visible.  
   * These events should not propagate to the editor. 
   */
  function keyDownEvent(ed, e) {
    if (autocomplete_data.visible) {
      if (e.keyCode == DOWN_ARROW_KEY) {
        highlightNextOption();
        return tinymce.dom.Event.cancel(e);
      }
      if (e.keyCode == UP_ARROW_KEY) {
        highlightPreviousOption();
        return tinymce.dom.Event.cancel(e);
      }
      if (e.keyCode == ENTER_KEY) {
        selectOption(ed, getCurrentWord(ed));
        autocomplete_data.cancelEnter = true;
        return false; // the enter evet needs to be cancelled on keypress so 
        // it doesn't register a carriage return
      }
      if (e.keyCode == ESC_KEY) {
        hideOptionList();
        return tinymce.dom.Event.cancel(e);
      }
      // onMatch callback
      if (autocomplete_data.onMatch && END_WORD_KEYS.indexOf(e.keyCode)) {
        var word = getCurrentWord(ed);
        var matches = matchingOptions(word);
        var completeMatch = new RegExp("^" + matches[0] + "$", "i");
        if (matches.length == 1 && word.match(completeMatch)) {
          t.onMatch.dispatch(ed, matches[0]);
        }
      }
    }
  }

  function clickEvent(ed, e) {
    hideOptionList();
  }

  /**
   * Add all the options to the option list and display it right beneath 
   * the caret where the user is entering text. There didn't appear to be 
   * an easy way to retrieve the exact pixel position of the caret inside 
   * tinyMCE so the difficult method had to suffice. 
   */
  function displayOptionList(matches, matchedText, ed) {
    var matchesList = "";
    var highlightRegex = new RegExp("(" + matchedText + ")");


    for (var i in matches) {
      if (matches[i].key != null) {
        matchesList += "<li data-value='" + matches[i].key + "'>" + matches[i].key.replace(highlightRegex, "<mark>$1</mark>") + " " + matches[i].description + "</li>";
      }
      else {
        matchesList += "<li data-value='" + matches[i] + "'>" + matches[i].replace(highlightRegex, "<mark>$1</mark>") + "</li>";
      }
    }
    jQuery(autocomplete_data.list).html(matchesList);

    // work out the position of the caret
    var tinymcePosition = jQuery(ed.getContainer()).position();
    var toolbarPosition = jQuery(ed.getContainer()).find(".mce-toolbar").first();
    var nodePosition = jQuery(ed.selection.getNode()).position();
    var textareaTop = 0;
    var textareaLeft = 0;
    if (ed.selection.getRng().getClientRects().length > 0) {
      textareaTop = ed.selection.getRng().getClientRects()[0].top + ed.selection.getRng().getClientRects()[0].height;
      textareaLeft = ed.selection.getRng().getClientRects()[0].left;
    } else {
      textareaTop = parseInt(jQuery(ed.selection.getNode()).css("font-size")) * 1.3 + nodePosition.top;
      textareaLeft = nodePosition.left;
    }

    jQuery(autocomplete_data.list).css("margin-top", tinymcePosition.top + toolbarPosition.innerHeight() + textareaTop + 35);
    jQuery(autocomplete_data.list).css("margin-left", tinymcePosition.left + textareaLeft);
    jQuery(autocomplete_data.list).css("display", "block");
    autocomplete_data.visible = true;
    optionListEventHandlers(ed);
  }

  /**
   * Allow a user to select an option by clicking with the mouse and 
   * highlighting the options on hover. 
   */
  function optionListEventHandlers(ed) {
    jQuery(autocomplete_data.list).find("li").hover(function () {
      jQuery(autocomplete_data.list).find("[data-selected=true]").attr("data-selected", "false");
      jQuery(this).attr("data-selected", "true");
    });
    jQuery(autocomplete_data.list).find("li").click(function () {
      selectOption(ed, getCurrentWord(ed));
    });
  }

  function createOptionList() {
    var ulContainer = document.createElement("ul");
    jQuery(ulContainer).addClass("auto-list");
    jQuery('#c360-wysiwyg-container').append(ulContainer);
    return ulContainer;
  }

  function hideOptionList() {
    jQuery(autocomplete_data.list).css("display", "none");
    autocomplete_data.visible = false;
  }

  function highlightNextOption() {
    var current = jQuery(autocomplete_data.list).find("[data-selected=true]");
    if (current.size() == 0 || current.next().size() == 0) {
      jQuery(autocomplete_data.list).find("li:first-child").attr("data-selected", "true");
    } else {
      current.next().attr("data-selected", "true");
    }
    current.attr("data-selected", "false");
  }

  function highlightPreviousOption() {
    var current = jQuery(autocomplete_data.list).find("[data-selected=true]");
    if (current.size() == 0 || current.prev().size() == 0) {
      jQuery(autocomplete_data.list).find("li:last-child").attr("data-selected", "true");
    } else {
      current.prev().attr("data-selected", "true");
    }
    current.attr("data-selected", "false");
  }

  /**
   * Select/insert the currently selected option.  The option will be inserted at the 
   * caret position with a delimiter at the end and the optional enclosing text.  If the 
   * enclosing text has already been inserted (this would happen when you are editing 
   * an autocompleted option), then it won't be inserted again. 
   */
  function selectOption(ed, matchedText) {
    var current = jQuery(autocomplete_data.list).find("[data-selected=true]").attr("data-value");
    if (current == null) {
      current = jQuery(autocomplete_data.list).find("li:first-child").attr("data-value");
    }


    var selectionNode = ed.selection.getNode();
    var nodeText = jQuery(selectionNode).text(); // selectionNode.innerText;
    var rocAfterClosingText = restOfContentAfterClosingText(ed);
    var roc = restOfContent(ed);
    var contentTillTrigger = nodeText.substr(0, (nodeText.length - ed.sm.sofar.length - roc.length));

    jQuery(selectionNode).text(contentTillTrigger + current.toString() + autocomplete_data.endTrigger + rocAfterClosingText);    

    hideOptionList();
    var range = ed.getDoc().createRange();
    var textNode = ed.selection.getNode().lastChild;
    range.setStart(textNode, 0);
    range.setEnd(textNode, contentTillTrigger.length + current.length + autocomplete_data.endTrigger.length);
    ed.selection.setRng(range);
    ed.selection.collapse(false);

    // onSelect callback
    if (autocomplete_data.onSelect) {
      t.onSelect.dispatch(ed, current);
    }
    hideOptionList();
  }

  /**
   * Check if the enclosing string has already been placed past the current node.  
   */
  function closingTextExists(editor) {
    var content = restOfContent(editor);
    var matches = new RegExp('^[a-zA-Z0-9_-]*' + autocomplete_data.endTrigger).exec(content);
    if (matches != null && matches.length > 0) {
      return true;
    }
    return false;
  }

  /**
   * find all of the content of the current node past (and including) the current caret position. 
   */
  function restOfContent(ed) {
    var nodeText = jQuery(ed.selection.getNode()).text(); //ed.selection.getNode().innerText;
    var positionInNode = ed.selection.getSel().focusOffset;
    return nodeText.substring(positionInNode);
  }

  function restOfContentAfterClosingText(ed) {
    var roc = restOfContent(ed);
    if (closingTextExists(ed)) {
      return roc.substring(roc.indexOf(autocomplete_data.endTrigger) + autocomplete_data.endTrigger.length);      
    } else {
      return roc;
    }
  }

  /**
   * Find all options whose beginning matches the currently entered text. 
   */
  function matchingOptions(currentWord) {
    // return ['raghu', 'ravan'];
    var options = autocomplete_data.options;
    var matches = [];
    for (var i in options) {
      if (options[i].key == null && (currentWord.length == 0 || beginningOfWordMatches(currentWord, options[i]))) {
        matches.push(options[i]);
      }
      else if (options[i].key != null && (currentWord.length == 0 || beginningOfWordMatches(currentWord, options[i].key))) {
        matches.push(options[i]);
      }
    }
    return matches;
  }

  function beginningOfWordMatches(beginning, option) {
    var test = new RegExp("^" + beginning, "i");
    return (option.match(test));
  }

  /**
   * Retrieves the 'word' as specified by the first occurrence of a
   * delimiter prior to the caret position.
   */
  function getCurrentWord(ed) { 
    var nodeText = jQuery(ed.selection.getNode()).text(); //.innerText; //ed.selection.getSel().focusNode == null ? "" : ed.selection.getSel().focusNode.nodeValue;
    var positionInNode = ed.selection.getSel().focusOffset; //ed.selection.getSel().focusOffset;
    if (nodeText == null || nodeText.length == 0) {
      return "";
    }

    var currentState = 0, sm = new AutocompleteStateMachine();
    for (var i = 0; i < positionInNode; i++) {
      var nextChar = nodeText.charCodeAt(i).toString();
      currentState = sm.next(currentState, String.fromCharCode(nextChar));
    }

    var currentWord = null;
    var triggerStart = autocomplete_data.startTrigger;
    if (sm.isFinalState(currentState)) {
      currentWord = sm.sofar;
      ed.sm = sm;
    }
    return currentWord;
  }


  var valid = function (keycode) {
    var valid = 
            (keycode > 47 && keycode < 58)   || // number keys
            keycode == 32 || keycode == 13   || // spacebar & return key(s) (if you want to allow carriage returns)
            (keycode > 64 && keycode < 91)   || // letter keys
            (keycode > 95 && keycode < 112)  || // numpad keys
            (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
            (keycode == 8) || // backspace
            (keycode > 218 && keycode < 223);   // [\]' (in order)
    return valid;
  };

  var StateMachine = function () {
    return {
      maxStates: 0,
      states: ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'],
      stateFunc: function (state) {
        var func = this['state'+this.states[state]];
        if (typeof func === 'function') {
          return func;
        } else {
          return null;
        }
      },
      addState: function (state, func) {
        if (state < this.states.length) {
          this['state' + this.states[state]] = func;
          if (state > this.maxStates) {
            this.maxStates = state;
          }       
        }
      },
      next: function(currentState, nextChar) {
        return this.stateFunc(currentState).call(this, nextChar);
      },
      isFinalState: function(currentState) {
        return currentState === 2
      }

    }
  }

  var AutocompleteStateMachine = function () {
    var sm = new StateMachine();
    var validInVariableName = function (ch) {
      return /^[a-zA-Z0-9_]+$/.test(ch.toString());
    };

    sm.addState(0, function(input) {
        this.sofar = '';
        if (input === '$') {
          return 1;
        } else {
          return 0;
        }
      });
    sm.addState(1, function(input) {
        this.sofar = '';
        if (input === '{') {
          return 2;
        } else {
          return 0;
        }
      });
    sm.addState(2, function(input) {
        if (input === '}') {
          return 0;
        } else if (validInVariableName(input)) {
          this.sofar = this.sofar + input;
          return 2;
        } else {
          return 0;
        }
      });
    sm.addState(3, function(state) {
        var func = null;
        switch(state) {
          case 0: 
            func = this.stateZero;
            break;
          case 1: 
            func = this.stateOne;
            break;
          case 2: 
            func = this.stateTwo;
            break;
          default:
            func = null;
        }
        return func;
      });
    return sm;
  }

  function parseOptions(param) {
    return param.options == null && typeof param != "boolean" ? param.split(",") : param.options;
  }

  //  tinymce.PluginManager.add('kfautocomplete', function(editor, url) {
  tinymce.PluginManager.add('kfautocomplete', function(editor, url) {
      autocomplete_data = {
        list: createOptionList(),
        visible: false,
        cancelEnter: false,
        delimiter: editor.getParam('kfautocomplete_delimiters', '160,32').split(","),
        options: parseOptions(editor.getParam('kfautocomplete_options', '')),
        optionsUrl: parseOptions(editor.getParam('kfautocomplete_options_url', false)),
        startTrigger: editor.getParam('kfautocomplete_trigger_start', '${'),
        endTrigger: editor.getParam('kfautocomplete_trigger_end', '}'),
        enclosing: '}',
        onSelect: editor.getParam('autocomplete_on_select', false),
        onMatch: editor.getParam('autocomplete_on_match', false)
      };

    editor.on('keyup', function (event) { return keyUpEvent(editor, event); });
    editor.on('keypress', function (event) { return keyPressEvent(editor, event); });
    editor.on('keydown', function (event) { return keyDownEvent(editor, event); });
  });
})(this);