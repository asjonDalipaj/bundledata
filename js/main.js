$(document).ready(function(){

	/* Create db if not exists */
	var db = new localStorageDB("bundle_data", localStorage);

    /* Create the "translations" table if not exists*/
    !(db.tableExists('translations')) ? db.createTable("translations", ["key", "description", "locale"]) : null;

    /* Variables initialization */
    /* Getting data from localstorage */
    var items = getFromLocal('translations');
    var index;
    var ctnr = $('.container'); /* Container */
    var list = $('.list-group');
    var form = $('#formGrp');
    var button = $('#main-button');
    var templateButton = $('#createTemplate');
    var templateBox = $('#templateBox');
    var templateCode = $('#templateCode');
    var successMsg = $("#alert_placeholder");
    /* Load items list */
    loadList(items);
    /* Setting container position if the list is full */
    items.length != 0 ? setContainerClasses() : setDefaultClasses();

	/* If input fields are empty disable button - Todo*/
	$(button).prop('disabled', true);
	$('input').on('input', function() {
		if( $('input').filter(function() { return !!this.value; }).length > 0 ) {
			$(button).prop('disabled', false);
		} else {
			$(button).prop('disabled', true);
		}
	});

	/* Set required fields on input */
	$(form).find('input').on('input',  function (e) {
		setRequiredField(e.currentTarget);
	});

	/* Set same key per each key input and set required fields */
	$(form).find('.key-field input').on('change', function (e) {
		var elem = $(e.currentTarget);
		$(form).find(".key-field input").not(elem).each(function (e) {
			$(this).val(elem.val());
			$(this).next('label').addClass('disabled');
			$(this).attr('data-empty', 'false');
			$(this).prop('disabled', true);
			setRequiredField($(this));
		})
	});

	/* Bind input enter with button submit */
	$('input').keypress(function(e){
		if(e.which === 13) {
			$(button).click();
		}
	});

	/* Delete one item */
	$('ul').delegate("span", "click", function(event){
		event.stopPropagation();
		index = $('span').index(this);
		var elem = $('li').eq(index);
		/* Deleting from localstorage */
		db.deleteRows("translations", {key: elem.text().trim()});
		db.commit();
		elem.remove();
		items = getFromLocal('translations');
		items.length == 0 ? setDefaultClasses() : null;
	});

	/* Edit panel initiate */
	$('ul').delegate('li', 'click', function(){
		/* Save index clicked on the list */
		index = $('li').index(this);
		loadTranslationsInForm($(this).text().trim());
	});

	/* Saving changes */
	$('#edit-button').click(function(){
		items[index] = $('#edit-input').val();
		loadList(items);
		storeToLocal("translations", items);
	});

	/* Clear form fields */
	$('#clearFldButton').click(function(){
		resetFieldProperties();
	});

	/* Clearing list */
	$('#clearListButton').click(function(){
		clearList();
	});

	/* Creating the template */
	$(templateButton).click(function(){
		buildTemplate(items);
	});

	/* Select whole code text */
	$(templateCode).click(function() { 
	    var sel, range;
	    var el = $(this)[0];
	    if (window.getSelection && document.createRange) { //Browser compatibility
	      sel = window.getSelection();
	      if(sel.toString() == ''){ //no text selection
	         window.setTimeout(function(){
	            range = document.createRange(); //range object
	            range.selectNodeContents(el); //sets Range
	            sel.removeAllRanges(); //remove all ranges from selection
	            sel.addRange(range);//add Range to a Selection.
	        },1);
	      }
	    }else if (document.selection) { //older ie
	        sel = document.selection.createRange();
	        if(sel.text == ''){ //no text selection
	            range = document.body.createTextRange();//Creates TextRange object
	            range.moveToElementText(el);//sets Range
	            range.select(); //make selection.
	        }
	    }
	});

	$('#scrollTop').on('click', function() {
	  
	  // Boolean to prevent double execution of the complete-property
	  var scrollDone = false,
	      button = $(this);
	  
	  // CSS class for active state
	  button.addClass('active');
	  
	  $("html, body").animate(
	    { 
	      scrollTop: "0" 
	    },
	    {
	      complete : function(){
	        if(!scrollDone){
	          scrollDone = true;
	          button.removeClass('active');
	        }
	      }
	    }
	    
	  );
	  
	});
	

	/* Initiate form validation with rules */
	$(form).validetta({
		bubbleGapTop: 10,
		bubbleGapLeft: -5,
		realTime : false,
		onValid: function(e) {
			e.preventDefault();
			/* Add input values into localStorage */
			$(form).find('fieldset.key-field input').each(function (e) {
				($(this).val() != "") ? db.insertOrUpdate("translations", {key: $(this).val().toLowerCase().trim() , description: $(this).parent().next('.translation-field').find('input').val()}, { key: $(this).val().toLowerCase().trim(), description: $(this).parent().next('.translation-field').find('input').val(), locale: $(this).attr('id').replace('_Key','')}) : null;
			})
			db.commit();
			items = getFromLocal('translations');
			loadList(items);
			setContainerClasses();
			$(button).prop('disabled', true);
			resetFieldProperties();
			/* Show and control alert message */
			showAlert('Successfully saved!', 'The standards are being followed.', 'alert-success');
			$(templateButton).prop('disabled', false);
		}
	});

	/* Loads localstorage's values into the list */
	function loadList(items){
		$('li').remove();
		if(items.length > 0) {
			for(var i = 0; i < items.length; i++) {
				$('ul').append('<li class= "list-group-item hvr-underline-reveal hvr-icon-forward" data-toggle="modal" data-target="#editModal"><i class="fa fa-edit hvr-icon pull-left"></i> ' + items[i].key + '<span class="fas fa-times pull-right"></span></li>');
			}
		}
	};

	/* Loads the translations input form */
	function loadTranslationsInForm(key){
		var translationsItems = getTranslationsFromKey(key);
		if(translationsItems.length > 0) {
			/* Management for editing the values*/
			$(button).attr('value', 'Save changes'); // Make the button clickable
			$(button).prop('disabled', false); // Switch button description
			for(var i = 0; i < translationsItems.length; i++) {
				var currentTarget = $(form).find('#'+ translationsItems[i].locale + '_Key');
				var currentTargetTranslation = currentTarget.parent().next('.translation-field').find('input');
				currentTarget.val(translationsItems[i].key);
				currentTargetTranslation.val(translationsItems[i].description);
				setRequiredField(currentTarget);
				currentTarget.prop('disabled', true);
				setRequiredField(currentTargetTranslation);
			}
		}
	}

	/* Clear List and deketes the localstorage values */
	function clearList(){
		$('li').remove();
		items = [];
		db.deleteRows('translations');
		db.commit();
		setDefaultClasses();
	};

	/* Stores into localstorage the items */
	function storeToLocal(key, items){
		//localStorage[key] = JSON.stringify(items);
		db.insertOrUpdate(key, {key: items.key, description: items.description});
		db.commit();
	}

	/* Retrives the data from localstorage */
	function getFromLocal(table){
		if(db.tableExists(table))
			return db.queryAll("translations", { distinct: ["key"]});
		else 
			return [];
	}

	/* Retrives the translations from passed key */
	function getTranslationsFromKey(key){
		if(db.queryAll("translations", { query: {key: key}}).length != 0)
			return db.queryAll("translations", { query: {key: key}});
			return [];
	}

	/* Manages the container animation adter inserting/removing rows from localstorage*/
	function setContainerClasses (){
		/* Container positioning */
		ctnr.removeClass("col-sm-offset-3").removeClass("col-sm-6").addClass("col-sm-12");
		/* Form positioning */
		form.addClass("col-sm-6");
		/* List positioning */
		list.addClass("col-sm-6 pull-right").show();
		templateButton.prop('disabled', false);
		templateBox.prop('hidden', true);
	}

	/* Set container's default classes */
	function setDefaultClasses (){
		/* Container positioning */
		ctnr.addClass("col-sm-offset-3").addClass("col-sm-6").removeClass("col-sm-12");
		/* Form positioning */
		form.removeClass("col-sm-6");
		/* List positioning */
		list.removeClass("col-sm-6 pull-right").hide();
		/* Button properties */
		button.attr('value', 'Add');
		templateButton.prop('disabled', true);
		templateBox.prop('hidden', true)
	}

	/* Resets the fields/button properties/classes */
	function resetFieldProperties (){
		$(form).find("input[type=text]").each(function (e) {
			/* Reset form values */
			$(this).val("");
			$(this).removeAttr('data-validetta data-vd-message-required data-empty')
			$(this).prop('disabled', false);
			$(button).prop('disabled', true);
			$(button).attr('value', 'Add');
			$('span.validetta-bubble').remove();
		})

		$(form).find("label").each(function (e) {
			/* Reset form values */
			$(this).removeClass('disabled');
		})
	}

	/* Loops for each input field and manages the mandatory rules */
	function setRequiredField(elem){
		/* Check for both key field and translation field to be valid and not empty */
		var elem = $(elem);
		if (elem.parent().hasClass('translation-field')){
			var transFld = elem;
			var keyFld = elem.parent().prev('.key-field').find('input');
			transFld.val() != '' ? (keyFld.attr('data-validetta', 'required'), keyFld.attr('data-vd-message-required', 'Please enter the key')) : (keyFld.removeAttr('data-validetta'), keyFld.removeAttr('data-vd-message-required'));
		}
		else{
			var transFld = elem.parent().next('.translation-field').find('input');
			var keyFld = elem;
			keyFld.val() != '' ? (transFld.attr('data-validetta', 'required,minLength[2],maxLength[27]'), transFld.attr('data-vd-message-required', 'Please enter the translation')) : (keyFld.removeAttr('data-validetta'), keyFld.removeAttr('data-vd-message-required'));
		}
		elem.attr('data-empty', !elem.val());
	}

	/* Builds the bundle_data template */

	function buildTemplate (items) {

		var finalText = '';
		var headTemplate = `--REMEMBER TO COMMIT AT THE END\n/*\nTicket number.: TO_BE_FILLED\nAuthor: TO_BE_FILLED\nAnalyst: TO_BE_FILLED\nDescription: UPDATE BUNDLE_DATA\n*/\n`;
		var template = `\nMERGE INTO BUNDLE_DATA A USING\n(SELECT\n(SELECT MAX("OID") + 1 FROM BUNDLE_DATA) as "OID",\n'%locale' as LOCALE,\n'%key' as "KEY",\n'%message' as MESSAGE\nFROM DUAL) B\nON (A.LOCALE = B.LOCALE AND A."KEY" = B."KEY")\nWHEN NOT MATCHED THEN\nINSERT (\n"OID", LOCALE, "KEY", MESSAGE)\nVALUES (\nB."OID", B.LOCALE, B."KEY", B.MESSAGE)\nWHEN MATCHED THEN\nUPDATE SET\nA.MESSAGE = B.MESSAGE;\n`;
    	var separator = `\n-------------------------------------------------------\n`

		if(items.length > 0) {
			for(var i = 0; i < items.length; i++) {
				var translatItems = getTranslationsFromKey(items[i].key);
					for(var j = 0; j < translatItems.length; j++) {
						var tempText = template.replace('%key',items[i].key);
		    			tempText = tempText.replace('%locale',translatItems[j].locale);
		    			tempText = tempText.replace('%message',translatItems[j].description);
		    			tempText += separator;
		    			if (finalText == '')
		    				finalText = headTemplate + tempText;
		    			else
		    				finalText += tempText;
					}
			}

			showAlert('Template successfully created', '', 'alert-success');
	    	$(templateCode).text(finalText);
	    	$(templateBox).prop('hidden', false);

	    	/* InitHighlight */
	    	hljs.initHighlighting.called = false;
	    	hljs.initHighlighting();

	    } else {
			showAlert('Template not created', 'No items in list', 'alert-danger');
		}
	}

	/**
	  Bootstrap Alerts -
	  Function Name - showalert()
	  Inputs - message, alerttype, infomessage
	  Example - showalert("Invalid Login","Retry", "alert-error")
	  Types of alerts -- "alert-error","alert-success","alert-info","alert-warning"
	  Required - You only need to add a alert_placeholder div in your html page wherever you want to display these alerts "<div id="alert_placeholder"></div>"
	**/

	function showAlert(message, infoMessage, alerttype) {

		(infoMessage == '') ? $(successMsg).append('<div id="alertdiv" class="alert ' +  alerttype + '"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>' + message + '</strong></div>') : $(successMsg).append('<div id="alertdiv" class="alert ' +  alerttype + '"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a><strong>' + message + '</strong>' + infoMessage + '</div>');

		$('#alertdiv').fadeTo(2000, 1000).slideUp(2000, function(){
			$("#success-alert").slideUp(2000);
		});
	}

});