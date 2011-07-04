function datechooser_loadDatePopup(popup, date)
{
    //alert("datechooser_loadDatePopup");
    try
    {
        var textFieldId = popup.getAttribute("control");
        var textField = document.getElementById(textFieldId);

        if (!date)
        {
            if (textField)
            {
                date = datechooser_parseDate(textField.value);
            }
            else
            {
                date = new Date();
            }
        }

        while (popup.lastChild)
        {
            popup.removeChild(popup.lastChild);
        }
        var grid = document.createElement("grid");

        // =========
        // <columns>
        // =========
        var columns = document.createElement("columns");
        for (var i = 0; i < 7; i++)
        {
            var column = document.createElement("column");
            column.setAttribute("flex", "1");
            columns.appendChild(column);
        }
        grid.appendChild(columns);

        var rows = document.createElement("rows");

        // ==================
        // <hbox> with header
        // ==================
        var header = document.createElement("hbox");
        header.setAttribute("align", "center");

        var prevDate = new Date(date.getFullYear(), date.getMonth() - 1, date.getDate());
        var prev = document.createElement("toolbarbutton");
        prev.setAttribute("label", "\u00AB");
        prev.setAttribute("_dc_date", sbbtt.toDateString(prevDate));
        prev.setAttribute("tooltiptext", datechooser_getMonthName(prevDate));
        prev.addEventListener("command", datechooser_monthButtonClicked, true);
        header.appendChild(prev);

        var title = document.createElement("label");
        title.style.textAlign = "center";
        title.style.fontWeight = "bold";
        title.setAttribute("flex", "1");
        title.setAttribute("value", datechooser_getMonthName(date));
        title.setAttribute("tooltiptext", datechooser_getMonthName(date));
        header.appendChild(title);

        var nextDate = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate());
        var next = document.createElement("toolbarbutton");
        next.setAttribute("label", "\u00BB");
        next.setAttribute("_dc_date", sbbtt.toDateString(nextDate));
        next.setAttribute("tooltiptext", datechooser_getMonthName(nextDate));
        next.addEventListener("command", datechooser_monthButtonClicked, true);
        header.appendChild(next);
        
        rows.appendChild(header);
        
        // =================
        // <row>s with dates
        // =================
        var todayStr = sbbtt.toDateString(new Date());
        var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        var numBlanks = (firstDay.getDay() + 6) % 7;

        var row;
		
        /*var weekNum = document.createElement("label");
		weekNum.setAttribute("value", 42);
		weekNum.setAttribute("disabled", true);
        weekNum.style.fontStyle = "italic";
        weekNum.style.valign = "bottom";
        row.appendChild(weekNum);*/
        
        var cell = 0;

        for (var day = 1; day <= lastDay.getDate(); day++)
        {
            var cellDate = new Date(date.getFullYear(), date.getMonth(), day);
            if (cell == 0)
            {
                row = document.createElement("row");
                rows.appendChild(row);
				
				var weekNum = document.createElement("label");
				weekNum.setAttribute("value", datechooser_getWeekNumber(cellDate));
				weekNum.setAttribute("disabled", true);
				weekNum.style.fontStyle = "italic";
				weekNum.style.valign = "bottom";
				row.appendChild(weekNum);
            }
            
            // fill empty days before first day
            if (day == 1)
            {
                for (; cell < numBlanks; cell++)
                {
                    var blank = document.createElement("label");
                    row.appendChild(blank);
                }
            }
            
            var dateTT = sbbtt.toDateString(cellDate);
            var button = document.createElement("toolbarbutton");
            button.setAttribute("label", day);
            button.setAttribute("tooltiptext", dateTT);
            button.setAttribute("control", textFieldId);
            if (cell == 6) // sunday
            {
                button.style.color = "red";
            }
            if (textField && textField.value == dateTT) // current text
            {
                button.style.fontWeight = "bold";
            }
            if (todayStr == dateTT) // today
            {
                button.style.textDecoration = "underline";
            }
            button.addEventListener("command", datechooser_dayButtonClicked, true);
            row.appendChild(button);

            if (++cell == 7)
            {
                cell = 0;
                row = null;
            }
        }
        
        grid.appendChild(rows);

        popup.appendChild(grid);
    }
    catch (ex)
    {
        alert("Exception:\n" + ex);
    }
}

function datechooser_parseDate(value)
{
    var date = new Date();
    var dateParts = value.split(".");
    if (dateParts.length == 3)
    {
        date.setDate(datechooser_parseInt(dateParts[0]));
        date.setMonth(datechooser_parseInt(dateParts[1]) - 1);
        date.setFullYear(datechooser_parseInt(dateParts[2]) + 2000);
    }
    return date;
}

function datechooser_parseInt(value)
{
    return parseInt(value.replace(/^0+/, ""));
}

function datechooser_getMonthName(date)
{
    var monthsTexts = sbbtt.getProperty("monthNames");
    var months = monthsTexts.split(",");

    var month = date.getMonth();
    var year = date.getFullYear();

    return months[month] + " " + year;
}

function datechooser_getWeekNumber(date)
{
    // gemäss http://dotnet-snippets.de/dns/kalenderwoche-berechnen-SID260.aspx
    // Die Berechnung erfolgt nach dem 
    // C++-Algorithmus von Ekkehard Hess aus einem Beitrag vom
    // 29.7.1999 in der Newsgroup 
    // borland.public.cppbuilder.language
    // (freigegeben zur allgemeinen Verwendung)
    // in JavaScript umgeschrieben von Samuel Weibel
    var a = Math.floor((13 - (date.getMonth())) / 12.0);
    var y = date.getFullYear() + 4800 - a;
    var m = (date.getMonth()) + (12 * a) - 2;

    var jd = date.getDate() + Math.floor(((153 * m) + 2) / 5) +
        (365 * y) + Math.floor(y / 4) - Math.floor(y / 100) +
        Math.floor(y / 400) - 32045;

    var d4 = (jd + 31741 - (jd % 7)) % 146097 % 36524 % 1461;
    var L = Math.floor(d4 / 1460);
    var d1 = ((d4 - L) % 365) + L;

    // Kalenderwoche ermitteln
    return Math.floor(d1 / 7) + 1;
}

function datechooser_dayButtonClicked(event)
{
    try
    {
        var menupopup = datechooser_findParent(event.target, "menupopup");
        var tooltip = event.target.getAttribute("tooltiptext");
        var textFieldId = event.target.getAttribute("control");
        var textField = document.getElementById(textFieldId);

        textField.value = tooltip;
        menupopup.hidePopup();
    }
    catch (ex)
    {
        alert("Exception:\n" + ex);
    }
}

function datechooser_monthButtonClicked(event)
{
    try
    {
        var menupopup = datechooser_findParent(event.target, "menupopup");
        var dateStr = event.target.getAttribute("_dc_date");

        datechooser_loadDatePopup(menupopup, datechooser_parseDate(dateStr));
    }
    catch (ex)
    {
        alert("Exception:\n" + ex);
    }
}

function datechooser_findParent(element, tagName)
{
    for (;element && element.tagName != tagName; element = element.parentNode);
    return element;
}
