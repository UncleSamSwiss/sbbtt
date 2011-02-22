const sbbtt_cookieHost = ".fahrplan.sbb.ch";
const sbbtt_cookiePath = "/";
const sbbtt_cookieName = "sbbMYHAFASpersonalStops";
const sbbtt_minSearchWidth = 150;

const sbbtt_chevron_ltr = "chrome://global/skin/toolbar/chevron.gif";
const sbbtt_chevron_rtl = "chrome://global/skin/toolbar/chevron-rtl.gif";

var sbbtt_debugEnabled = false;

function sbbtt_init()
{
    //sbbtt_debug("SBB init");
    try
    {
        var stops = sbbtt_getStops();

        var fromPopup = document.getElementById("sbbtt-from-popup");
        var toPopup = document.getElementById("sbbtt-to-popup");
        var viaPopup = document.getElementById("sbbtt-via-popup");

        sbbtt_loadPopup(fromPopup, stops);
        sbbtt_loadPopup(toPopup, stops);
        sbbtt_loadPopup(viaPopup, stops);
        
        sbbtt_updateEmptyFields();

        sbbtt_updateAutoAdd();
    }
    catch (ex)
    {
        alert("Exception:\n" + ex);
    }
}
function sbbtt_pageLoading()
{
    try
    {
        if (sbbtt_getBoolPref("autoadd", false))
        {
            var url = window._content.document.location.href.toLowerCase();

            if (url.indexOf("http://fahrplan.sbb.ch/bin/query.exe/") == 0)
            {
                sbbtt_checkResultPage();
            }
            else if (sbbtt_debugEnabled && url.indexOf("file://") == 0 && url.indexOf("/sbb/result/dn.htm") > 0)
            {
                sbbtt_checkResultPage();
            }
        }
    }
    catch (ex)
    {
        //alert("Exception:\n" + ex);
    }
}

function sbbtt_checkResultPage()
{
    var mySBBdiv = window._content.document.getElementById("demo");
    if (mySBBdiv)
    {
        try
        {
            mySBBdiv.style.display = "none";

            for (var i = mySBBdiv.childNodes.length - 1; i >= 0; i--)
            {
                var tag = mySBBdiv.childNodes[i];
                var pos;
                if (tag.tagName == "A" && tag.href && (pos = tag.href.indexOf("addStop=")) > 0)
                {
                    var cookie = sbbtt_getCookie(sbbtt_cookieHost, sbbtt_cookieName);
                    var cookieValue = cookie ? cookie.value : "";
                    var cookieDecoded = unescape(unescape(unescape(cookieValue)));

                    sbbtt_resultPageDebug(cookieValue);
                    sbbtt_resultPageDebug(unescape(cookieValue));
                    sbbtt_resultPageDebug(unescape(unescape(cookieValue)));
                    sbbtt_resultPageDebug(unescape(unescape(unescape(cookieValue))));

                    var addStop = tag.href.substring(pos + 8, tag.href.indexOf("'", pos));
                    //sbbtt_debug(tag.href + "\n" + pos + "\n" + tag.href.indexOf("'", pos) + "\n" + addStop);
                    pos = addStop.indexOf("&");
                    if (pos > 0)
                    {
                        addStop = addStop.substring(0, pos);
                    }
                    var addStopDecoded = unescape(addStop);
                    
                    sbbtt_resultPageDebug(addStop);
                    sbbtt_resultPageDebug(unescape(addStop));

                    var addStopParts = addStopDecoded.split("@");
                    if (addStopParts.length > 2 && cookieDecoded.indexOf("@" + addStopParts[1] + "@") < 0)
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
                        
                        sbbtt_resultPageDebug("added: " + newCookie);
                        
                        var cookieManager = sbbtt_getCookieManager();
                        var expiry = new Date();
                        expiry.setFullYear(expiry.getFullYear() + 10);

                        // void add ( AUTF8String domain , AUTF8String path , ACString name , ACString value , PRBool secure , PRBool isSession , PRInt64 expiry )
                        cookieManager.add(sbbtt_cookieHost, sbbtt_cookiePath, sbbtt_cookieName, newCookie, false, false, expiry.getTime() / 1000);
                    }
                    else
                    {
                        sbbtt_resultPageDebug("not added");
                    }
                }
            }
        }
        catch (ex)
        {
            alert("Exception:\n" + ex);
        }
    }
}

function sbbtt_resultPageDebug(msg)
{
    if (sbbtt_debugEnabled)
    {
        var mySBBdiv = window._content.document.getElementById("demo");
        mySBBdiv.parentNode.appendChild(window._content.document.createElement("hr"));
        mySBBdiv.parentNode.appendChild(window._content.document.createTextNode(msg));
    }
}

function sbbtt_loadPopup(popup, stops)
{
    try
    {
        if (!stops)
        {
            stops = sbbtt_getStops();
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
}

function sbbtt_doChevron()
{
    try
    {
        var toolbar = document.getElementById("sbbtt-toolbar");
        var advToolbar = document.getElementById("sbbtt-adv-toolbar");
        var searchButton = document.getElementById("sbbtt-search-button");
        var chevron = document.getElementById("sbbtt-adv-chevron");

        if (chevron.image == sbbtt_chevron_ltr)
        {
            chevron.image = sbbtt_chevron_rtl;

            searchButton.setAttribute("hidden", "true");

            // check if there is enough place for all items on one toolbar
            var toolbarItems = sbbtt_getCurrentSet(toolbar).split(',');
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
                var advancedItems = sbbtt_getCurrentSet(advToolbar).split(',');
                for (var i = 0; i < advancedItems.length; i++)
                {
                    var item = document.getElementById(advancedItems[i]);
                    if (item && item.parentNode == advToolbar)
                    {
                        sbbtt_moveNode(item, advToolbar, toolbar);
                    }
                }
            }
            else
            {
                advToolbar.removeAttribute("hidden");
                advToolbar.collapsed = false; // ensure visibility
            }
            
            sbbtt_updateEmptyFields();
        }
        else
        {
            // hide advanced items

            chevron.image = sbbtt_chevron_ltr;

            searchButton.removeAttribute("hidden");

            if (advToolbar.getAttribute("hidden"))
            {
                // the advanced items are shown on the normal toolbar
                var toolbarItems = sbbtt_getCurrentSet(advToolbar).split(',');
                for (var i = 0; i < toolbarItems.length; i++)
                {
                    var item = document.getElementById(toolbarItems[i]);
                    sbbtt_moveNode(item, toolbar, advToolbar);
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
}

function sbbtt_getCurrentSet(toolbar)
{
    var set = toolbar.getAttribute("currentset");
    if (!set)
    {
        set = toolbar.getAttribute("defaultset");
    }
    return set;
}

function sbbtt_moveNode(node, from, to)
{
    if (node)
    {
        from.removeChild(node);
        to.appendChild(node);
    }
}

/*function sbbtt_findChildNode(element, tagName, recursive)
{
    var node = element.firstChild;
    while (node)
    {
        if (node.tagName == tagName)
        {
            return node;
        }
        else if (recursive)
        {
            var found = sbbtt_findChildNode(node, tagName, true);
            if (found)
            {
                return found;
            }
        }
        node = node.nextSibling;
    }
    return null;
}*/

function sbbtt_doToggle()
{
    var toolbar = document.getElementById("sbbtt-toolbar");
    var advToolbar = document.getElementById("sbbtt-adv-toolbar");

    advToolbar.collapsed = !toolbar.collapsed;
    toolbar.collapsed    = !toolbar.collapsed;
}

function sbbtt_searchKeyPress(event)
{
    if (event.type == "click" && event.target.nodeName == "menuitem")
    {
        return;
    }
    else if (event.type == "keypress" && event.keyCode != 13)
    {
        return;
    }
    sbbtt_doSearch();
}

function sbbtt_doSearch()
{
    try
    {
        var url = sbbtt_getCharPref("search.url", sbbtt_getProperty("timetableURL"));
        var postData = getPostDataStream(sbbtt_getPostData(), null, null, "application/x-www-form-urlencoded");

        sbbtt_loadURI(url, null, postData, false);
    }
    catch (ex)
    {
        alert("Exception:\n" + ex);
    }
}

function sbbtt_goHomepage(event)
{
    try
    {
        sbbtt_loadURI(event.target.getAttribute("tooltiptext"));
    }
    catch (ex)
    {
        alert("Exception:\n" + ex);
    }
}

function sbbtt_loadURI(url, referrer, postData, aAllowThirdPartyFixup)
{
    if (window._content && window._content.location && (window._content.location.href == "about:blank" || window._content.location.href == ""))
    {
        loadURI(url, referrer, postData, aAllowThirdPartyFixup);
    }
    else
    {
        getBrowser().loadOneTab(url, referrer, null, postData, false, aAllowThirdPartyFixup);
    }
}

function sbbtt_setAutoAdd(autoAdd)
{
    sbbtt_setBoolPref("autoadd", autoAdd);
}

function sbbtt_updateAutoAdd()
{
    var menuItem = document.getElementById("sbbtt-options-autoadd");
    var autoAdd = sbbtt_getBoolPref("autoadd", false);
    if (autoAdd)
    {
        menuItem.setAttribute("checked", "true");
    }
    else
    {
        menuItem.removeAttribute("checked");
    }
}

function sbbtt_getPostData()
{
    var now = new Date();
    var date = sbbtt_elementVisible("sbbtt-date-textbox") ? sbbtt_getField("sbbtt-date-textbox") : sbbtt_toDateString(now);
    var time = sbbtt_elementVisible("sbbtt-time-textbox") ? sbbtt_getField("sbbtt-time-textbox") : sbbtt_toTimeString(now);
    var via  = sbbtt_elementVisible("sbbtt-via-menulist") ? sbbtt_getField("sbbtt-via-menulist") : "";
    var forward = sbbtt_elementVisible("sbbtt-arrival") && document.getElementById("sbbtt-arrival").selected ? "0" : "1";

    var post = "";
    post += "queryPageDisplayed=yes&";
    post += "REQ0JourneyStopsS0ID=&";
    post += "REQ0JourneyStopsZ0ID=&";
    post += "REQ0JourneyStops1.0A=1&";
    post += "REQ0HafasSkipLongChanges=0&";
    post += "REQ0HafasMaxChangeTime=120&";
    post += "S=&";
    post += "Z=&";
    post += "REQ0JourneyStopsS0G=" + sbbtt_getField("sbbtt-from-menulist") + "&";
    post += "REQ0JourneyStopsS0A=7&"; // todo: could be changed if known (i.e. chosen value)
    post += "REQ0JourneyStopsZ0G=" + sbbtt_getField("sbbtt-to-menulist") + "&";
    post += "REQ0JourneyStopsZ0A=7&"; // todo: could be changed if known (i.e. chosen value)
    post += "REQ0JourneyStops1.0G=" + via + "&";
    post += "REQ0JourneyDate=" + date + "&";
    post += "wDayExt0=Mo|Di|Mi|Do|Fr|Sa|So&";
    post += "REQ0JourneyTime=" + time + "&";
    post += "REQ0HafasSearchForw=" + forward + "&";
    post += "start=Verbindung suchen";

    return post;
}

function sbbtt_updateEmptyFields()
{
    var now = new Date();
    sbbtt_updateEmptyField("sbbtt-date-textbox", sbbtt_toDateString(now));
    sbbtt_updateEmptyField("sbbtt-time-textbox", sbbtt_toTimeString(now));
    document.getElementById("sbbtt-via-menulist").value = "";
}

function sbbtt_updateEmptyField(id, value)
{
    var field = document.getElementById(id);
    if (!field.value && sbbtt_elementVisible(id))
    {
        field.value = value;
    }
}

function sbbtt_toDateString(date)
{
    return sbbtt_fixedDigitString(date.getDate(), 2) + "." + 
           sbbtt_fixedDigitString(date.getMonth() + 1, 2) + "." + 
           sbbtt_fixedDigitString(date.getYear() % 100, 2);
}

function sbbtt_toTimeString(date)
{
    return sbbtt_fixedDigitString(date.getHours(), 2) + ":" + 
           sbbtt_fixedDigitString(date.getMinutes(), 2);
}

function sbbtt_fixedDigitString(val, numDigits)
{
    var str = String(val);
    while (str.length < numDigits)
    {
        str = "0" + str;
    }
    return str;
}

function sbbtt_elementVisible(id)
{
    for (var elem = document.getElementById(id); elem; elem = elem.parentNode)
    {
        if (elem.hidden || elem.colapsed)
        {
            return false;
        }
    }
    return true;
}

function sbbtt_getField(fieldName)
{
    var field = document.getElementById(fieldName);
    return escape(field.value);
}

function sbbtt_getStops()
{
    var stops = new Array();
    var cookie = sbbtt_getCookie(sbbtt_cookieHost, sbbtt_cookieName);
    if (cookie && cookie.value.length > 0)
    {
        var fieldValues = sbbtt_splitQuery(unescape(cookie.value), "&", "=");
        for (var fieldValue in fieldValues)
        {
            var field = fieldValues[fieldValue][0];
            var value = fieldValues[fieldValue][1];
            if (field == "personalStops")
            {
                var stopValues = sbbtt_splitQuery(unescape(value), "&", "=");
                for (var stopValue in stopValues)
                {
                    var stopId   = stopValues[stopValue][0];
                    var stopData = stopValues[stopValue][1];

                    if (stopData)
                    {
                        //alert("Stop\n" + stopId + "\n" + stopData + "\n" + unescape(stopData));
                        var stopFields = sbbtt_splitQuery(unescape(stopData), "@", "=");
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
                                stops.push(type + sbbtt_convertCookieText(stopFields[stopField][1]));
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
}

function sbbtt_splitQuery(query, partDelim, partSplit)
{
    var queryParts = new Array();
    var parts = query.split(partDelim);
    for (var part in parts)
    {
        queryParts.push(parts[part].split(partSplit));
    }
    return queryParts;
}

function sbbtt_getCookieManager()
{
    return Components.classes["@mozilla.org/cookiemanager;1"].getService(Components.interfaces.nsICookieManager2);
}

function sbbtt_getCookie(host, name)
{
    var iter = sbbtt_getCookieManager().enumerator;
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
}

function sbbtt_convertCookieText(input)
{
    return sbbtt_decodeUTF8(input).replace(/\+/g, " ");
}

function sbbtt_decodeUTF8(utftext)
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
}

function sbbtt_getProperty(prop)
{
    return document.getElementById("sbbtt-strings").getString(prop);
}

function sbbtt_getBoolPref(prefName, defaultValue)
{
    try
    {
        return sbbtt_getPreferences().getBoolPref("sbbtt." + prefName);
    }
    catch (ex)
    {
        return defaultValue;
    }
}

function sbbtt_setBoolPref(prefName, value)
{
    sbbtt_getPreferences().setBoolPref("sbbtt." + prefName, value ? true : false);
}

function sbbtt_getCharPref(prefName, defaultValue)
{
    try
    {
        return sbbtt_getPreferences().getCharPref("sbbtt." + prefName);
    }
    catch (ex)
    {
        return defaultValue;
    }
}

function sbbtt_setCharPref(prefName, value)
{
    sbbtt_getPreferences().setCharPref("sbbtt." + prefName, value);
}

function sbbtt_getPreferences()
{
    return Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
}

function sbbtt_debug(msg)
{
    if (sbbtt_debugEnabled)
    {
        alert(msg);
    }
}

function sbbtt_debugObject(obj)
{
    if (sbbtt_debugEnabled)
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
}

sbbtt_debugEnabled = sbbtt_getBoolPref("debug", false);

window.addEventListener("load", sbbtt_init, false);

window.addEventListener("load", sbbtt_pageLoading, true);
