const SBBTT_COOKIE_HOST = ".fahrplan.sbb.ch";
const SBBTT_COOKIE_PATH = "/";
const SBBTT_COOKIE_NAME_STOPS = "sbbMYHAFASpersonalStops";
const SBBTT_COOKIE_NAME_RELATIONS = "sbbMYHAFASpersonalRelations";
const SBBTT_MIN_SEARCH_WIDTH = 150;

const SBBTT_CHEVRON_LTR = "chrome://sbbtt/skin/chevron.gif";
const SBBTT_CHEVRON_RTL = "chrome://sbbtt/skin/chevron-rtl.gif";

var sbbtt = {
    init : function()
    {
        this.debugEnabled = this.getBoolPref("debug", false);
        this.debug("SBB init");
        try
        {
            var stops = this.getStops();

            var fromPopup = document.getElementById("sbbtt-from-popup");
            var toPopup = document.getElementById("sbbtt-to-popup");
            var viaPopup = document.getElementById("sbbtt-via-popup");

            this.loadPopup(fromPopup, stops);
            this.loadPopup(toPopup, stops);
            this.loadPopup(viaPopup, stops);
            
            this.updateEmptyFields();

            this.loadMainMenu();

            var appcontent = document.getElementById("appcontent");   // browser
            if(appcontent)
                appcontent.addEventListener("DOMContentLoaded", function(event) { sbbtt.onPageLoad(event); }, true);
        }
        catch (ex)
        {
            alert("Exception:\n" + ex);
        }
    },

    onPageLoad : function(event)
    {
        try
        {
            if (this.getBoolPref("autoadd", false))
            {
                var url = window._content.document.location.href.toLowerCase();

                if (url.indexOf("http://fahrplan.sbb.ch/bin/query.exe/") == 0)
                {
                    this.checkResultPage();
                }
                else if (this.debugEnabled && url.indexOf("file://") == 0 && url.indexOf("/sbb/result/dn.htm") > 0)
                {
                    this.checkResultPage();
                }
            }
        }
        catch (ex)
        {
            //alert("Exception:\n" + ex);
        }
    },

    checkResultPage : function()
    {
        //this.debug("checkResultPage()");
        var mySBBdiv = window._content.document.getElementById("demo");
        if (mySBBdiv)
        {
            try
            {
                mySBBdiv.style.display = "none";

                if (mySBBdiv._sbbtt_handled)
                {
                    return;
                }
                mySBBdiv._sbbtt_handled = true;

                for (var i = mySBBdiv.childNodes.length - 1; i >= 0; i--)
                {
                    var tag = mySBBdiv.childNodes[i];
                    if (tag.tagName == "A" && tag.href)
                    {
                        if (tag.href.indexOf("addStop=") > 0)
                        {
                            this.checkAddStopToCookie(tag.href);
                        }
                        else if (tag.href.indexOf("addRelation=") > 0)
                        {
                            this.checkAddRelationToCookie(tag.href);
                        }
                    }
                }
            }
            catch (ex)
            {
                alert("Exception:\n" + ex);
            }
        }
    },

    checkAddStopToCookie : function(href)
    {
        var cookie = this.getCookie(SBBTT_COOKIE_HOST, SBBTT_COOKIE_NAME_STOPS);
        var cookieValue = cookie ? cookie.value : "";
        var cookieDecoded = unescape(unescape(unescape(cookieValue)));

        this.resultPageDebug("cookieValue", cookieValue);
        this.resultPageDebug("unescaped1", unescape(cookieValue));
        this.resultPageDebug("unescaped2", unescape(unescape(cookieValue)));
        this.resultPageDebug("unescaped3", unescape(unescape(unescape(cookieValue))));

        var pos = href.indexOf("addStop=");
        var addStop = href.substring(pos + 8, href.indexOf("'", pos));

        pos = addStop.indexOf("&");
        if (pos > 0)
        {
            addStop = addStop.substring(0, pos);
        }
        var addStopDecoded = unescape(addStop);
        
        this.resultPageDebug("addStop", addStop);
        this.resultPageDebug("decoded", addStopDecoded);

        var addStopParts = addStopDecoded.split("@");
        if (addStopParts.length > 2 && cookieDecoded.replace(/ /g, "+").indexOf("@" + addStopParts[1].replace(/ /g, "+") + "@") < 0)
        {
            var insertAt = cookieValue.lastIndexOf("%252540%2525A7"); // %252540%2525A7 is a mega-encoded "@§"
            var newCookie = "";

            if (insertAt > 0)
            {
                // cookie exists
                var pParamAt = cookieValue.lastIndexOf("%25253D", insertAt) + 7; // %25253D is a mega-encoded "="
                addStop = addStop.substring(0, addStop.lastIndexOf("%3D") + 3) + cookieValue.substring(pParamAt, insertAt);

                var matches = cookieDecoded.match(/[&=]Stop\d+\=/gi);
                var nextId = Number(matches[matches.length - 1].match(/\d+/)[0]) + 1;

                newCookie = cookieValue.substring(0, insertAt);
                newCookie += "%2526Stop" + nextId + "%253DI%25253Dstop" + nextId + "%2525A7L%25253D";
                newCookie += escape(escape(addStop));
                newCookie += cookieValue.substring(insertAt);
            }
            else
            {
                // create new cookie
                newCookie = "personalStops%3DStop1%253DI%25253Dstop1%2525A7L%25253D";
                newCookie += escape(escape(addStop));
                newCookie += "%252540%2525A7%2526%26";
            }
            
            this.resultPageDebug("added", newCookie);
            
            var cookieManager = this.getCookieManager();
            var expiry = new Date();
            expiry.setFullYear(expiry.getFullYear() + 10);

            // void add(in AUTF8String aHost, in AUTF8String aPath, in ACString aName, in ACString aValue, in boolean aIsSecure, in boolean aIsHttpOnly, in boolean aIsSession, in PRInt64 aExpiry);
            cookieManager.add(SBBTT_COOKIE_HOST, SBBTT_COOKIE_PATH, SBBTT_COOKIE_NAME_STOPS, newCookie, false, false, false, expiry.getTime() / 1000);
        }
        else
        {
            this.resultPageDebug("not added", addStopParts[1]);
        }
    },

    checkAddRelationToCookie : function(href)
    {
        var cookie = this.getCookie(SBBTT_COOKIE_HOST, SBBTT_COOKIE_NAME_RELATIONS);
        var cookieValue = cookie ? cookie.value : "";
        var cookieDecoded = unescape(unescape(unescape(cookieValue)));

        this.resultPageDebug("cookieValue", cookieValue);
        this.resultPageDebug("unescaped1", unescape(cookieValue));
        this.resultPageDebug("unescaped2", unescape(unescape(cookieValue)));
        this.resultPageDebug("unescaped3", unescape(unescape(unescape(cookieValue))));

        var pos = href.indexOf("addRelation=");
        var addRel = href.substring(pos + 12, href.indexOf("'", pos));

        pos = addRel.indexOf("&");
        if (pos > 0)
        {
            addRel = addRel.substring(0, pos);
        }
        var addRelDecoded = unescape(addRel);
        
        this.resultPageDebug("addRel", addRel);
        this.resultPageDebug("decoded", addRelDecoded);

        var addRelParts = addRelDecoded.split("@");
        if (!this.checkExistingCookie(cookieDecoded, addRelParts))
        {
            addRel = addRel.replace("\\u00A7A", "%A7A%3DA");
            var insertAt = cookieValue.lastIndexOf("|%2525A7%2526"); // |%2525A7%2526 is a mega-encoded "|§&"
            var newCookie = "";

            if (insertAt > 0)
            {
                // cookie exists
                var pParamAt = cookieValue.lastIndexOf("%25253D", insertAt) + 7; // %25253D is a mega-encoded "="
                addRel = addRel.substring(0, addRel.lastIndexOf("%3D") + 3) + cookieValue.substring(pParamAt, insertAt);

                var matches = cookieDecoded.match(/[&=]Relation\d+\=/gi);
                var nextId = Number(matches[matches.length - 1].match(/\d+/)[0]) + 1;

                newCookie = cookieValue.substring(0, insertAt);
                newCookie += "%2526Relation" + nextId + "%253DI%25253Drel" + nextId + "%2525A7D%25253D";
                newCookie += escape(escape(addRel)).replace(/%252540/g, '|');
                newCookie += cookieValue.substring(insertAt);
            }
            else
            {
                // create new cookie
                newCookie = "personalRelations%3DRelation1%253DI%25253Drel1%2525A7D%25253D";
                newCookie += escape(escape(addRel)).replace(/%252540/g, '|');
                newCookie += "%2525A7%2526%26";
            }
            
            this.resultPageDebug("added", newCookie);
            
            var cookieManager = this.getCookieManager();
            var expiry = new Date();
            expiry.setFullYear(expiry.getFullYear() + 10);

            // void add(in AUTF8String aHost, in AUTF8String aPath, in ACString aName, in ACString aValue, in boolean aIsSecure, in boolean aIsHttpOnly, in boolean aIsSession, in PRInt64 aExpiry);
            cookieManager.add(SBBTT_COOKIE_HOST, SBBTT_COOKIE_PATH, SBBTT_COOKIE_NAME_RELATIONS, newCookie, false, false, false, expiry.getTime() / 1000);
        }
        else
        {
            this.resultPageDebug("not added", addRelParts[1] + " -> " + addRelParts[9]);
        }
    },

    checkExistingCookie : function(cookieDecoded, addParts)
    {
        var cookieDecoded = cookieDecoded.replace(/ /g, "+");

        if (addParts.length < 10)
        {
            return true;
        }
        var firstPart = "|" + addParts[1].replace(/ /g, "+") + "|";
        var secondPart = "|" + addParts[9].replace(/ /g, "+") + "|";

        var cookieParts = cookieDecoded.split("&");
        for (var i = 0; i < cookieParts.length; i++)
        {
            var cookiePart = cookieParts[i];
            var firstIndex = cookiePart.indexOf(firstPart);
            var secondIndex = cookiePart.indexOf(secondPart);

            if (firstIndex > 0 && firstIndex < secondIndex)
            {
                return true;
            }
        }

        return false;
    },

    resultPageDebug : function(title, msg)
    {
        if (this.debugEnabled)
        {
            var mySBBdiv = window._content.document.getElementById("demo");
            mySBBdiv.parentNode.appendChild(window._content.document.createElement("hr"));
            var b = window._content.document.createElement("b");
            mySBBdiv.parentNode.appendChild(b);
            b.appendChild(window._content.document.createTextNode(title + ": "));
            mySBBdiv.parentNode.appendChild(window._content.document.createTextNode(msg));
        }
    },

    loadPopup : function(popup, stops)
    {
        try
        {
            if (!stops)
            {
                stops = this.getStops();
            }
            if (stops.length == 0)
            {
                stops.push("");
            }

            while (popup.lastChild)
            {
                popup.removeChild(popup.lastChild);
            }
            var lastLabel = null;
            for (var stop in stops)
            {
                if (lastLabel && lastLabel[0] != stops[stop][0])
                {
                    popup.appendChild(document.createElement("menuseparator"));
                }
                var item = document.createElement("menuitem");
                item.setAttribute("label", stops[stop].substring(1));
                popup.appendChild(item);
                lastLabel = stops[stop];
            }
        }
        catch (ex)
        {
            alert("Exception:\n" + ex);
        }
    },

    doChevron : function()
    {
        try
        {
            var toolbar = document.getElementById("sbbtt-toolbar");
            var advToolbar = document.getElementById("sbbtt-adv-toolbar");
            var searchButton = document.getElementById("sbbtt-search-button");
            var chevron = document.getElementById("sbbtt-adv-chevron");

            if (chevron.image == SBBTT_CHEVRON_LTR)
            {
                chevron.image = SBBTT_CHEVRON_RTL;

                searchButton.setAttribute("hidden", "true");

                // check if there is enough place for all items on one toolbar
                var toolbarItems = this.getCurrentSet(toolbar).split(',');
                var totalWidth = 0;
                for (var i = 0; i < toolbarItems.length; i++)
                {
                    var item = document.getElementById(toolbarItems[i]);
                    if (item && item.boxObject)
                    {
                        totalWidth += item.boxObject.width;
                    }
                }

                if (totalWidth * 2 < toolbar.boxObject.width) // adv. toolbar is approx. twice the width of the normal
                {
                    // show the advanced items on the normal toolbar
                    var advancedItems = this.getCurrentSet(advToolbar).split(',');
                    for (var i = 0; i < advancedItems.length; i++)
                    {
                        var item = document.getElementById(advancedItems[i]);
                        if (item && item.parentNode == advToolbar)
                        {
                            this.moveNode(item, advToolbar, toolbar);
                        }
                    }
                }
                else
                {
                    advToolbar.removeAttribute("hidden");
                    advToolbar.collapsed = false; // ensure visibility
                }
                
                this.updateEmptyFields();
            }
            else
            {
                // hide advanced items

                chevron.image = SBBTT_CHEVRON_LTR;

                searchButton.removeAttribute("hidden");

                if (advToolbar.getAttribute("hidden"))
                {
                    // the advanced items are shown on the normal toolbar
                    var toolbarItems = this.getCurrentSet(advToolbar).split(',');
                    for (var i = 0; i < toolbarItems.length; i++)
                    {
                        var item = document.getElementById(toolbarItems[i]);
                        this.moveNode(item, toolbar, advToolbar);
                    }
                }
                else
                {
                    advToolbar.setAttribute("hidden", "true");
                }
            }
        }
        catch (ex)
        {
            alert("Exception:\n" + ex);
        }
    },

    getCurrentSet : function(toolbar)
    {
        var set = toolbar.getAttribute("currentset");
        if (!set)
        {
            set = toolbar.getAttribute("defaultset");
        }
        return set;
    },

    moveNode : function(node, from, to)
    {
        if (node)
        {
            from.removeChild(node);
            to.appendChild(node);
        }
    },

    doToggle : function()
    {
        var toolbar = document.getElementById("sbbtt-toolbar");
        var advToolbar = document.getElementById("sbbtt-adv-toolbar");

        advToolbar.collapsed = !toolbar.collapsed;
        toolbar.collapsed    = !toolbar.collapsed;
    },

    searchKeyPress : function(event)
    {
        if (event.type == "click" && event.target.nodeName == "menuitem")
        {
            return;
        }
        else if (event.type == "keypress" && event.keyCode != 13)
        {
            return;
        }
        this.doSearch();
    },

    doSearch : function()
    {
        try
        {
            var url = this.getCharPref("search.url", this.getProperty("timetableURL"));
            var postData = getPostDataStream(this.createSearchPostData(), null, null, "application/x-www-form-urlencoded");

            this.loadURI(url, null, postData, false);
        }
        catch (ex)
        {
            alert("Exception:\n" + ex);
        }
    },

    goHomepage : function(event)
    {
        try
        {
            this.loadURI(event.target.getAttribute("tooltiptext"));
        }
        catch (ex)
        {
            alert("Exception:\n" + ex);
        }
    },

    loadURI : function(url, referrer, postData, aAllowThirdPartyFixup)
    {
        if (window._content && window._content.location && (window._content.location.href == "about:blank" || window._content.location.href == ""))
        {
            loadURI(url, referrer, postData, aAllowThirdPartyFixup);
        }
        else
        {
            getBrowser().loadOneTab(url, referrer, null, postData, false, aAllowThirdPartyFixup);
        }
    },

    goRelation : function(relation)
    {
        try
        {
            var url = this.getCharPref("search.url", this.getProperty("timetableURL"));
            var postData = getPostDataStream(this.createRelationPostData(relation), null, null, "application/x-www-form-urlencoded");

            this.loadURI(url, null, postData, false);
        }
        catch (ex)
        {
            alert("Exception:\n" + ex);
        }
    },

    setAutoAdd : function(autoAdd)
    {
        this.setBoolPref("autoadd", autoAdd);
    },

    loadMainMenu : function()
    {
        // set autoAdd correctly
        var menuItem = document.getElementById("sbbtt-options-autoadd");
        var autoAdd = this.getBoolPref("autoadd", false);
        if (autoAdd)
        {
            menuItem.setAttribute("checked", "true");
        }
        else
        {
            menuItem.removeAttribute("checked");
        }

        // load relations
        try
        {
            var popup = document.getElementById("sbbtt-options-popup");
            for (var i = popup.children.length - 1; i >= 0; i--)
            {
                if (popup.children[i]._sbbtt_relation)
                {
                    popup.removeChild(popup.children[i]);
                }
            }
            var sep = document.getElementById("sbbtt-options-mysbb-separator");
            var rels = this.getRelations();
            
            for (var rel in rels)
            {
                var item = document.createElement("menuitem");
                item.setAttribute("label", rels[rel].replace("|", " -> "));
                item.setAttribute("oncommand", "sbbtt.goRelation('"+rels[rel]+"');");
                item._sbbtt_relation = true;
                popup.insertBefore(item, sep);
            }
        }
        catch (ex)
        {
            alert("Exception:\n" + ex);
        }
    },

    createSearchPostData : function()
    {
        var now = new Date();
        var from = this.getFieldEscaped("sbbtt-from-menulist");
        var to   = this.getFieldEscaped("sbbtt-to-menulist");
        var date = this.elementVisible("sbbtt-date-textbox") ? this.getFieldEscaped("sbbtt-date-textbox") : this.toDateString(now);
        var time = this.elementVisible("sbbtt-time-textbox") ? this.getFieldEscaped("sbbtt-time-textbox") : this.toTimeString(now);
        var via  = this.elementVisible("sbbtt-via-menulist") ? this.getFieldEscaped("sbbtt-via-menulist") : "";
        var forward = this.elementVisible("sbbtt-arrival") && document.getElementById("sbbtt-arrival").selected ? "0" : "1";

        return this.createPostData(from, to, date, time, via, forward);
    },

    createRelationPostData : function(relation)
    {
        var parts = relation.split("|");
        var now = new Date();
        var from = escape(parts[0]);
        var to   = escape(parts[1]);
        var date = this.toDateString(now);
        var time = this.toTimeString(now);

        return this.createPostData(from, to, date, time, "", "");
    },

    createPostData : function(from, to, date, time, via, forward)
    {
        var post = "";
        post += "queryPageDisplayed=yes&";
        post += "REQ0JourneyStopsS0ID=&";
        post += "REQ0JourneyStopsZ0ID=&";
        post += "REQ0JourneyStops1.0A=1&";
        post += "REQ0HafasSkipLongChanges=0&";
        post += "REQ0HafasMaxChangeTime=120&";
        post += "S=&";
        post += "Z=&";
        post += "REQ0JourneyStopsS0G=" + from + "&";
        post += "REQ0JourneyStopsS0A=7&"; // todo: could be changed if known (i.e. chosen value)
        post += "REQ0JourneyStopsZ0G=" + to + "&";
        post += "REQ0JourneyStopsZ0A=7&"; // todo: could be changed if known (i.e. chosen value)
        post += "REQ0JourneyStops1.0G=" + via + "&";
        post += "REQ0JourneyDate=" + date + "&";
        post += "wDayExt0=Mo|Di|Mi|Do|Fr|Sa|So&";
        post += "REQ0JourneyTime=" + time + "&";
        post += "REQ0HafasSearchForw=" + forward + "&";
        post += "start=Verbindung suchen";

        return post;
    },

    getStops : function()
    {
        var stops = new Array();
        var cookie = this.getCookie(SBBTT_COOKIE_HOST, SBBTT_COOKIE_NAME_STOPS);
        if (cookie && cookie.value.length > 0)
        {
            var fieldValues = this.splitQuery(unescape(cookie.value), "&", "=");
            for (var fieldValue in fieldValues)
            {
                var field = fieldValues[fieldValue][0];
                var value = fieldValues[fieldValue][1];
                if (field == "personalStops")
                {
                    var stopValues = this.splitQuery(unescape(value), "&", "=");
                    for (var stopValue in stopValues)
                    {
                        var stopId   = stopValues[stopValue][0];
                        var stopData = stopValues[stopValue][1];

                        if (stopData)
                        {
                            //alert("Stop\n" + stopId + "\n" + stopData + "\n" + unescape(stopData));
                            var stopFields = this.splitQuery(unescape(stopData), "@", "=");
                            var type = "1";
                            for (var stopField in stopFields)
                            {
                                //alert(stopFields[stopField]);
                                if (stopFields[stopField][0] == "I")
                                {
                                    type = stopFields[stopField][stopFields[stopField].length - 1];
                                }
                                else if (stopFields[stopField][0] == "O")
                                {
                                    stops.push(type + this.convertCookieText(stopFields[stopField][1]));
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
        stops.sort();
        return stops;
    },

    getRelations : function()
    {
        var rels = new Array();
        var cookie = this.getCookie(SBBTT_COOKIE_HOST, SBBTT_COOKIE_NAME_RELATIONS);
        if (cookie && cookie.value.length > 0)
        {
            var fieldValues = this.splitQuery(unescape(cookie.value), "&", "=");
            for (var fieldValue in fieldValues)
            {
                var field = fieldValues[fieldValue][0];
                var value = fieldValues[fieldValue][1];
                if (field == "personalRelations")
                {
                    var relValues = this.splitQuery(unescape(value), "&", "=");
                    for (var relValue in relValues)
                    {
                        var relId   = relValues[relValue][0];
                        var relData = relValues[relValue][1];

                        if (relData)
                        {
                            //alert("rel\n" + relId + "\n" + relData + "\n" + unescape(relData));
                            var relFields = this.splitQuery(unescape(relData), "|", "=");
                            var departure = null;
                            for (var relField in relFields)
                            {
                                //alert(relFields[relField]);
                                if (relFields[relField][0] == "O")
                                {
                                    var value = this.convertCookieText(relFields[relField][1]);
                                    if (!departure)
                                    {
                                        departure = value;
                                    }
                                    else
                                    {
                                        rels.push(departure + "|" + value);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        rels.sort();
        return rels;
    },

    updateEmptyFields : function()
    {
        var now = new Date();
        this.updateEmptyField("sbbtt-date-textbox", this.toDateString(now));
        this.updateEmptyField("sbbtt-time-textbox", this.toTimeString(now));
        document.getElementById("sbbtt-via-menulist").value = "";
    },

    updateEmptyField : function(id, value)
    {
        var field = document.getElementById(id);
        if (!field.value && this.elementVisible(id))
        {
            field.value = value;
        }
    },

    toDateString : function(date)
    {
        return this.fixedDigitString(date.getDate(), 2) + "." + 
               this.fixedDigitString(date.getMonth() + 1, 2) + "." + 
               this.fixedDigitString(date.getYear() % 100, 2);
    },

    toTimeString : function(date)
    {
        return this.fixedDigitString(date.getHours(), 2) + ":" + 
               this.fixedDigitString(date.getMinutes(), 2);
    },

    fixedDigitString : function(val, numDigits)
    {
        var str = String(val);
        while (str.length < numDigits)
        {
            str = "0" + str;
        }
        return str;
    },

    elementVisible : function(id)
    {
        for (var elem = document.getElementById(id); elem; elem = elem.parentNode)
        {
            if (elem.hidden || elem.colapsed)
            {
                return false;
            }
        }
        return true;
    },

    getFieldEscaped : function(fieldName)
    {
        var field = document.getElementById(fieldName);
        return escape(field.value);
    },

    splitQuery : function(query, partDelim, partSplit)
    {
        var queryParts = new Array();
        var parts = query.split(partDelim);
        for (var part in parts)
        {
            queryParts.push(parts[part].split(partSplit));
        }
        return queryParts;
    },

    getCookieManager : function()
    {
        return Components.classes["@mozilla.org/cookiemanager;1"].getService(Components.interfaces.nsICookieManager2);
    },

    getCookie : function(host, name)
    {
        var iter = this.getCookieManager().enumerator;
        while (iter.hasMoreElements())
        {
            var cookie = iter.getNext();
            if (cookie instanceof Components.interfaces.nsICookie)
            {
                if (cookie.host.indexOf(host) >= 0 && cookie.name == name)
                {
                    return cookie;
                }
            }
        }
        return null;
    },

    convertCookieText : function(input)
    {
        return this.decodeUTF8(input).replace(/\+/g, " ");
    },

    decodeUTF8 : function(utftext)
    {
        // based on http://aktuell.de.selfhtml.org/artikel/javascript/utf8b64/utf8.htm
        // extended to check if it is really a UTF-8 string. If not, the original string is returned.
        /*
        UTF-8 standard:
        Character range             Binary
        Unicode range 0-127         0xxx.xxxx
        Unicode range 128-2047      110x.xxxx  10xx.xxxx
        Unicode range 2048-65535    1110.xxxx  10xx.xxxx  10xx.xxxx
        */
        var plaintext = "";
        var i = 0;
        var c = c1 = c2 = 0;
        while(i < utftext.length)
        {
            c = utftext.charCodeAt(i);
            if (c < 0x80)
            {
                plaintext += String.fromCharCode(c);
                i++;
            }
            else if ((c & 0xE0) == 0xC0 && utftext.length > i + 1)
            {
                c2 = utftext.charCodeAt(i + 1);
                if ((c2 & 0xC0) == 0x80)
                {
                    plaintext += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                }
                else // this is not UTF-8
                {
                    return utftext;
                }
            }
            else if ((c & 0xF0) == 0xE0 && utftext.length > i + 2)
            {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                if ((c2 & 0xC0) == 0x80 && (c3 & 0xC0) == 0x80)
                {
                    plaintext += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }
                else // this is not UTF-8
                {
                    return utftext;
                }
            }
            else // this is not UTF-8
            {
                return utftext;
            }
        }
        return plaintext;
    },

    getProperty : function(prop)
    {
        return document.getElementById("sbbtt-strings").getString(prop);
    },

    getBoolPref : function(prefName, defaultValue)
    {
        try
        {
            return this.getPreferences().getBoolPref("sbbtt." + prefName);
        }
        catch (ex)
        {
            return defaultValue;
        }
    },

    setBoolPref : function(prefName, value)
    {
        this.getPreferences().setBoolPref("sbbtt." + prefName, value ? true : false);
    },

    getCharPref : function(prefName, defaultValue)
    {
        try
        {
            return this.getPreferences().getCharPref("sbbtt." + prefName);
        }
        catch (ex)
        {
            return defaultValue;
        }
    },

    setCharPref : function(prefName, value)
    {
        this.getPreferences().setCharPref("sbbtt." + prefName, value);
    },

    getPreferences : function()
    {
        return Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
    },

    debug : function(msg)
    {
        if (this.debugEnabled)
        {
            alert(msg);
        }
    },

    debugObject : function(obj)
    {
        if (this.debugEnabled)
        {
            var msg = "";
            for (var f in obj)
            {
                try
                {
                    msg += f + ": " + obj[f] + "\n";
                }
                catch (ex)
                {
                     msg += f + ": " + ex + "\n";
                }
            }
            alert(msg);
        }
    },
}

window.addEventListener("load", function() { sbbtt.init(); }, false);
