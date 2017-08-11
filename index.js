'use strict'
const through2 = require('through2');

module.exports = () => {
  return through2.obj((file, enc, cb) => {
    if (file.isNull()) return cb(null, file);
    if (file.isStream()) return cb(new PluginError('[docx-html-converter]: ', 'Stream is not supported'));
      
      var jsonData = file.contents;
      var parsedJsonData = parseData(jsonData);
      var jsonBufferOutput = new Buffer(parsedJsonData);
      file.contents = jsonBufferOutput;
      cb(null, file);
  });
};


function parseData(data){
    var newContext = {
        header : [],
        content : [],
        footer : []
    };
    parseContext(newContext, data, true);  
    return newContext;
}

function parseContext(parent, data, isHeader){
    var children = [];
    //if children are left
    if (data.content.length != 0){
        //get child
        var child = data.content[0];
        
        //consume the child - remove child from parent's content array
        data.content.splice(0, 1);        
        
        //if it is a table
        if (child.openingTag == 'table'){
            isHeader = false;
            parseTable(parent, child);
        } else {
            
            var childContent = getChildContent(child);
            
            if (isHeader){
                parent.header.push(childContent);
            } else {
                parent.footer.push(childContent);
            }
        }
        
        parseContext(parent, data, isHeader);
        
    }
    
    return children;
    
    
}

function parseTable(parent, table){
    
    //if there is a row left
    if (table.content.length > 0){
        var firstRow = table.content[0];
        console.log("found a row");
        //if there is one cell in that row
        if (firstRow.content.length == 1) {
            var cellInFirstRow = firstRow.content[0];
            var cellContent = getAllContent(cellInFirstRow.content);
            parent.header.push(cellContent);
        } else {
            
            
            
            var headerCell = firstRow.content[0];
            var bodyCell = firstRow.content[1];
            var headerContent = getAllContent(headerCell.content);
            var bodyContent = getAllContent(bodyCell.content);
            var newSection = {
                header : headerContent,
                content : bodyContent
            };
            parent.content.push(newSection);
        }
        table.content.splice(0,1);
        parseTable(parent, table);
    }
    
    
}




function getChildContent(parent){
    var childContent = getAllContent(parent.content);
    var parentContent = "<" + parent.openingTag + ">" + childContent + "</" + parent.closingTag + ">";
    return parentContent;
}

function getAllContent(content){
    
    var parentContent = "";
    
    //if any children are left
    if (content.length != 0){
        
        //get the child
        var child = content[0];
        
        //consume the child
        content.splice(0, 1);
        //if child is a string
        if (typeof child === 'string'){
            //return the child plus all of the following children
            parentContent = child;// + getAllContent(content, index + 1);
        }
        
        //if child is an object, return child content plus child tags
        else {
            parentContent += getChildContent(child);
        }
        parentContent += getAllContent(content);
    }
    
    //if there are no children left
    return parentContent;
}

