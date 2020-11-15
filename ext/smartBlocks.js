/* globals roam42, roam42KeyboardLib, Tribute */

(() => {
  roam42.smartBlocks = {};  
  roam42.smartBlocks.initialize = async ()=>{
    var smartBlockTrigger = ";;";
    //determine if user has created a custom trigger
    let customTrigger = await roam42.settings.get("SmartBlockTrigger");
    if(customTrigger!=null && customTrigger.length>0) {
      var newTrigger = customTrigger.replaceAll('\"','').trim();
      if(newTrigger.length>0)
        smartBlockTrigger = customTrigger;
    }
    
    const exclusionBlockSymbol = '!!%%**!!%%**!!%%**!!%%**'; //used to indicate a block is not to be inserted

    const addStaticValues =  async (valueArray)=> {
      //DATE COMMANDS
      valueArray.push({key: 'today (42)',           value: 'today',     processor:'date'});
      valueArray.push({key: 'tomorrow (42)',       value: 'tomorrow', processor:'date'});      
      valueArray.push({key: 'yesterday (42)',       value: 'yesterday', processor:'date'});      
      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(  (e)=>{
        valueArray.push({key: `${e} (42)`,          value: `${e}`,      processor:'date'});
        valueArray.push({key: `Last ${e} (42)`,     value: `Last ${e}`, processor:'date'});
        valueArray.push({key: `Next ${e} (42)`,     value: `Next ${e}`, processor:'date'});
      });
      valueArray.push({key: 'Time 24 (42)',          value: getTime24Format(),      processor:'static'});
      valueArray.push({key: 'Time AM/PM (42)',       value: getTimeAPPMFormat(),      processor:'static'});
      valueArray.push({key: 'Serendipity - Random Block (42)', value: '',     processor:'randomblock'});
      valueArray.push({key: 'Serendipity - Random Page (42)', value: '',     processor:'randompage'});
      valueArray.push({key: 'Horizontal Line (42)',   value: ':hiccup [:hr]',     processor:'static'});
      valueArray.push({key: 'Workflow Starter (SmartBlock function)', processor:'function', value: async ()=>{
                        var workflowName = prompt("What is the name of the new workflow?")
                        roam42.common.setEmptyNodeValue( document.querySelector("textarea"), "#42SmartBlock " + workflowName );            
                        await roam42.common.sleep(200);
                        await roam42KeyboardLib.pressEnter();
                        await roam42.common.sleep(200);
                        await roam42KeyboardLib.pressTab();
                      }});
      valueArray.push({key: 'sb42 (SmartBlock function)',                  value: '#42SmartBlock',                     processor:'static'});
      valueArray.push({key: '<% CLIPBOARDWRITE %> (SmartBlock function)',  value: '<%CLIPBOARDWRITE:%>',           processor:'static'});
      valueArray.push({key: '<% CLIPBOARDREADTEXT %> (SmartBlock function)', value: '<%CLIPBOARDREADTEXT%>',         processor:'static'});
      valueArray.push({key: '<% CURRENTBLOCKREF %> (SmartBlock function)',   value: '<%CURRENTBLOCKREF%>',         processor:'static'});
      valueArray.push({key: '<% DATE %> (SmartBlock function)',            value: '<%DATE:%>',                     processor:'static'});
      valueArray.push({key: '<% IFDAYOFMONTH %> (SmartBlock function)',    value: '<%IFDAYOFMONTH:%>',             processor:'static'});
      valueArray.push({key: '<% IFDAYOFWEEK %> (SmartBlock function)',     value: '<%IFDAYOFWEEK:%>',              processor:'static'});
      valueArray.push({key: '<% INPUT %> (SmartBlock function)',           value: '<%INPUT:%>',                     processor:'static'});
      valueArray.push({key: '<% JAVASCRIPT %> (SmartBlock function)',      value: '<%JAVASCRIPT:%>',         processor:'static'});            
      valueArray.push({key: '<% NOBLOCKOUTPUT %> (SmartBlock function)',    value: '<%NOBLOCKOUTPUT%>',         processor:'static'});
      valueArray.push({key: '<% RESOLVEBLOCKREF %> (SmartBlock function)', value: '<%RESOLVEBLOCKREF:%>',           processor:'static'});
      valueArray.push({key: '<% TIME %> (SmartBlock function)',            value: '<%TIME%>',                       processor:'static'});
      valueArray.push({key: '<% TIMEAMPM %> (SmartBlock function)',        value: '<%TIMEAMPM%>',         processor:'static'});
      valueArray.push({key: '<% RANDOMBLOCK %> (SmartBlock function)',     value: '<%RANDOMBLOCK%>',         processor:'static'});
      valueArray.push({key: '<% RANDOMBLOCKFROMPAGE %> (SmartBlock function)',     value: '<%RANDOMBLOCKFROMPAGE%>',         processor:'static'});
      valueArray.push({key: '<% RANDOMPAGE %> (SmartBlock function)',     value: '<%RANDOMPAGE%>',         processor:'static'});
    };

    const sortObjectByKey = async o => {
      return o.sort(function(a, b) {
        return a.key.localeCompare(b.key);
      });
    };

    const sortObjectsByOrder = async o => {
      return o.sort(function(a, b) {
        return a.order - b.order;
      });
    };  

    const valuesForLookup = async (text, cb) => {
      //graab all blocks with #SmartBlock
      let sb = await roam42.common.getBlocksReferringToThisPage("42SmartBlock");
      let results = sb.flatMap(sb => {
        if (sb[0].children)
          // if has children, add it into returned list key: is text, value is UID of block
          return {
            key: sb[0].string.replace("#42SmartBlock", "").trim(),
            value: sb[0].uid,
            processor: 'blocks'
          };
        else return [];
      });
      results = await sortObjectByKey(results);
      addStaticValues( results );
      cb( results );
    };

    const insertSnippetIntoBlock = async (textToInsert)=> {
      var ta = document.querySelector("textarea");
      ta.setSelectionRange(ta.selectionStart - 2, ta.selectionStart + 1); //this deals with extra space added
      roam42.common.insertAtCaret( ta.id, textToInsert );
      setTimeout(()=>ta.setSelectionRange(ta.selectionStart + 1, ta.selectionStart + 2),200); //this deals with extra space added      
    }
    
    const getTime24Format = ()=> {
      var dt = new Date();
      return dt.getHours().toString().padStart(2, '0') + ':' + dt.getMinutes().toString().padStart(2, '0');
    }
    
    const getTimeAPPMFormat = ()=>{
        var dt = new Date();
        var hours = dt.getHours();
        var minutes = dt.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0'+minutes : minutes;
        var strTime = hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(0,2) + ' ' + ampm;
        return strTime;      
    }
    
    const asyncQuerySelector = async (node, query) => {
      try {
        return await (query ? node.querySelector(query) : node);
      } catch (error) {
        console.error(`Cannot find ${query ? `${query} in`: ''} ${node}.`, error);
        return null;
      }
    };    
    
    const proccessBlockWithSmartness = async (textToProcess, UID)=>{
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%CURRENTBLOCKREF\%\>)/g, async (match, name)=>{
        let tID = await  asyncQuerySelector(document,'textarea');
        let UID = tID.id;
        let results = '((' + UID.substring( UID.length -9) + '))';
        return results;
      });          
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%RESOLVEBLOCKREF:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var uid = match.replace('<%RESOLVEBLOCKREF:','').replace('%>','').replace('((','').replace('))','').trim();
        var queryResults = await roam42.common.getBlockInfoByUID(uid);
        if(queryResults==null) 
          return match + '--> Block Ref is not valid <--'; //no results, return origional
        else
          return queryResults[0][0].string;
      });        
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%JAVASCRIPT:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var scriptToRun = match.replace('<%JAVASCRIPT:','').replace('%>','').trim();
        var results = new Function(scriptToRun.toString())();
        return results;
      });           
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%INPUT:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var textToProcess = match.replace('<%INPUT:','').replace('%>','').trim();
        if(textToProcess.includes('\%\%')) {
          var splitPrompt = textToProcess.split('\%\%');
          return prompt( splitPrompt[0].trim(),  splitPrompt[1].trim() )
        } else {
          return prompt(textToProcess.toString());        
        }
      });
      //Random block command
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%RANDOMBLOCK\%\>)/g, async (match, name)=>{
        return '((' + await roam42.common.getRandomBlock(1) + '))';
      }); 
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%RANDOMBLOCK:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        return roam42.smartBlocks.getRandomBlocks(textToProcess);
      }); 
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%RANDOMBLOCKFROMPAGE:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        return '((' + await roam42.smartBlocks.getRandomBlocksFromPage(textToProcess) + '))';
      }); 
      //Random Page Command
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%RANDOMPAGE\%\>)/g, async (match, name)=>{
        return roam42.smartBlocks.getRandomPage();
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%TIME\%\>)/g, async (match, name)=>{
        return getTime24Format()
      }); 
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%TIMEAMPM\%\>)/g, async (match, name)=>{
        return getTimeAPPMFormat();
      });           
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%DATE:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var textToProcess = match.replace('<%DATE:','').replace('%>','').trim();
        return roam42.dateProcessing.parseTextForDates(textToProcess).trim();
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%IFDAYOFWEEK:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var textToProcess = match.replace('<%IFDAYOFWEEK:','').replace('%>','').trim();
        var day = String(new Date().getDay());
        if(day=='0') day='7'; //sunday
        if(textToProcess.replaceAll(' ','').split(',').includes(day)) 
          return ''; //
        else 
          return exclusionBlockSymbol
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%IFDAYOFMONTH:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var textToProcess = match.replace('<%IFDAYOFMONTH:','').replace('%>','').trim();
        if(textToProcess.replaceAll(' ','').split(',').includes( String(new Date().getDate()) ) ) 
          return ''; //
        else 
          return exclusionBlockSymbol
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%CLIPBOARDWRITE:)(\s*[\S\s]*?)(\%\>)/g, async (match, name)=>{
        var textToWrite = match.replace('<%CLIPBOARDWRITE:','').replace('%>','').trim();
        await navigator.clipboard.writeText( textToWrite );
        return ' ';
      });
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%CLIPBOARDREADTEXT\%\>)/g, async (match, name)=>{
        var cb = await navigator.clipboard.readText();
        await roam42.common.sleep(50);        
        return cb;
      });      
      //ALWAYS at end of process
      textToProcess = await roam42.common.replaceAsync(textToProcess, /(\<\%NOBLOCKOUTPUT\%\>)/g, async (match, name)=>{
        return exclusionBlockSymbol;
      });               
      if(textToProcess.includes(exclusionBlockSymbol)) return exclusionBlockSymbol; //skip this block
      return textToProcess; //resert new text
    }

    const blocksToInsert = item => {
      setTimeout(async () => {        
        if(item.original.processor=='date')   insertSnippetIntoBlock( await roam42.dateProcessing.parseTextForDates(item.original.value).trim() );
        if(item.original.processor=='function') await item.original.value();
        if(item.original.processor=='static') insertSnippetIntoBlock( item.original.value );
        if(item.original.processor=='randomblock') insertSnippetIntoBlock( '((' + await roam42.common.getRandomBlock(1) + '))' );
        if(item.original.processor=='randompage') insertSnippetIntoBlock(await roam42.smartBlocks.getRandomPage());

        if(item.original.processor=='blocks') {
          var results = await roam42.common.getBlockInfoByUID( item.original.value, true );
          // console.log(results)

          //loop through array outline and insert into Roam
          roam42.test=results;

          if (results[0][0].children.length == 1 && !results[0][0].children[0].children) {
            // console.log('single line')
            //has no children, just insert text into block and safe it
            var processedText = await proccessBlockWithSmartness( results[0][0].children[0].string);
            if( !processedText.includes(exclusionBlockSymbol) )
              insertSnippetIntoBlock( processedText );
          } else {
            // console.log('multiple line')
            //has children, start walking through the nodes and insert them
            let blockInsertCounter = 0 //used to track how many inserts performed so we can take a coffee break at 19, to let Roam catch up
            let firstBlock = true    //handles the first block specially
            var currentOutlineLevel = 1;

            var loopStructure = async (parentNode, level) => {
              let orderedNode = await sortObjectsByOrder(parentNode);
              for (var i = 0; i < orderedNode.length; i++) {
                //indent/unindent if needed
                if (currentOutlineLevel < level) {
                  for (var inc = currentOutlineLevel; inc < level; inc++) {
                    await roam42KeyboardLib.delay(100);
                    await roam42KeyboardLib.pressTab();
                    currentOutlineLevel += 1;
                  }
                } else if (currentOutlineLevel > level) {
                  for (var inc = currentOutlineLevel; inc > level; inc--) {
                    await roam42KeyboardLib.delay(100);
                    await roam42KeyboardLib.pressShiftTab();
                    currentOutlineLevel -= 1;
                  }
                }
                var n = orderedNode[i];
                //TEXT INSERTION HAPPENING HERE
                var insertText = n.string;
                if (insertText == "") insertText = " "; //space needed in empty cell to maintaing indentation on empty blocks
                insertText = await proccessBlockWithSmartness(insertText);
                console.log(insertText)
                if( !insertText.includes(exclusionBlockSymbol) ) {
                  if (/\#|\]\]|\:\:/.test(insertText)) //fixes a bug generated by tags
                    insertText = insertText + ' ';
                  if (firstBlock==true) {
                    firstBlock = false;
                    var txtarea = document.querySelector("textarea");
                    var strPos = txtarea.selectionStart;
                    var front = txtarea.value.substring(0, strPos);
                    var back = txtarea.value.substring(strPos, txtarea.value.length);
                    roam42.common.setEmptyNodeValue(txtarea, front + insertText + back);                    
                  } else {
                    roam42.common.setEmptyNodeValue( document.querySelector("textarea"), insertText );                                
                  }
                  
                  //roam42.common.insertAtCaret( document.querySelector("textarea").id, insertText );
                  if (insertText == " ") {
                    //if had to insert space, remove it
                    await roam42.common.sleep(100);
                    document.querySelector("textarea").setSelectionRange(0, 2); //now remove the spae before next line
                  }

                  if (/\#|\]\]|\)\)|\:\:/.test(insertText)) //fixes a bug generated by tags
                    await roam42.common.sleep(250);
                  else
                    await roam42.common.sleep(100);
                                    
                  //see if heading needs to be assigned
                  if (n.heading) {
                    var ev = {};
                    ev.target = document.querySelector("textarea");
                    roam42.jumpnav.jumpCommand( ev, "ctrl+j " + (Number(n.heading) + 4) ); //base is 4
                    var id = document.querySelector("textarea").id;
                    await roam42KeyboardLib.pressEsc(500);
                    roam42.common.simulateMouseClick( document.querySelector("#" + id) );
                  }
                  if (n["text-align"] && n["text-align"] != "left") {
                    var ev = {};
                    ev.target = document.querySelector("textarea");
                    switch (n["text-align"]) {
                      case "center":
                        roam42.jumpnav.jumpCommand(ev, "ctrl+j 2"); //base is 4
                        break;
                      case "right":
                        roam42.jumpnav.jumpCommand(ev, "ctrl+j 3"); //base is 4
                        break;
                      case "justify":
                        roam42.jumpnav.jumpCommand(ev, "ctrl+j 4"); //base is 4
                        break;
                    }
                    var id = document.querySelector("textarea").id;
                    await roam42.common.sleep(500);
                    roam42.common.simulateMouseClick(document.querySelector("#" + id));
                  }

                  await roam42KeyboardLib.pressEnter();
                  if (/query|kanban|embed|\`\`\`/.test(insertText)) 
                    await roam42.common.sleep(500);
                  
                  blockInsertCounter += 1;
                  if(blockInsertCounter > 5) {  //SmartBlocks coffee break to allow Roam to catch its breath
                      blockInsertCounter = 0;
                      await roam42.common.sleep(200);                  }

                  if (n.children) await loopStructure(n.children, level + 1);
                } 
              }
            }; //END of LOOPSTRUCTURE

            await roam42.common.sleep(100);
            var ta = document.querySelector("textarea");
            ta.setSelectionRange(ta.selectionStart - 2, ta.selectionStart + 1); //this deals with extra space added
            if (results[0][0].children){
              // console.log(results[0][0].children)
              await loopStructure(results[0][0].children, 1); //only process if has children
            }
          }
        } // end IF
      }, 10); // end setTimeout

      return " ";
    };
    
    roam42.smartBlocks.scanForNewTextAreas = (mutationList, observer) => {
      var ta = document.querySelector("textarea");
      if (!ta || ta.getAttribute("r42sb") != null) return; //no text area or this text box is already r42 active

      ta.setAttribute("r42sb", "active");

      //tribute is the autocomplete dropdown that appears in a text area
      var tribute = new Tribute({
        trigger: smartBlockTrigger,
        requireLeadingSpace: false,
        menuItemTemplate: function(item) {
          return "" + item.string;
        },
        values: valuesForLookup,
        lookup: "key",
        fillAttr: "value",
        selectTemplate: blocksToInsert
      });

      tribute.attach(ta);
    }; // End of scanForNewTextAreas
    
    roam42.smartBlocks.textBoxObserver = new MutationObserver( roam42.smartBlocks.scanForNewTextAreas );
    roam42.smartBlocks.textBoxObserver.observe(document, { childList: true, subtree: true });
  } // end of INITIALIZE

  window.roam42.smartBlocks.testingReload = () => {
    try {
      roam42.smartBlocks.textBoxObserver.disconnect();
      roam42.smartBlocks.textBoxObserver = {};
      roam42.smartBlocks.initialize = {};
    } catch (e) {}
    roam42.loader.addScriptToPage( "smartBlocks", roam42.host + 'ext/smartBlocks.js');
    setTimeout(()=>roam42.smartBlocks.initialize(), 2000)
  };
})();
