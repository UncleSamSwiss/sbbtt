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
        prev.setAttribute("_dc_date", sbbtt_toDateString(prevDate));
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
        next.setAttribute("_dc_date", sbbtt_toDateString(nextDate));
        next.setAttribute("tooltiptext", datechooser_getMonthName(nextDate));
        next.addEventListener("command", datechooser_monthButtonClicked, true);
        header.appendChild(next);
        
        rows.appendChild(header);
        
        // =================
        // <row>s with dates
        // =================
        var todayStr = sbbtt_toDateString(new Date());
        var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        var numBlanks = (firstDay.getDay() + 6) % 7;

        var row = document.createElement("row");
        rows.appendChild(row);
        
        var cell;
        for (cell = 0; cell < numBlanks; cell++)
        {
            var blank = document.createElement("label");
            row.appendChild(blank);
        }

        for (var day = 1; day <= lastDay.getDate(); day++)
        {
            if (cell == 0 && row == null)
            {
                row = document.createElement("row");
                rows.appendChild(row);
            }
            var dateTT = sbbtt_toDateString(new Date(date.getFullYear(), date.getMonth(), day));
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
    var monthsTexts = sbbtt_getProperty("monthNames");
    var months = monthsTexts.split(",");

    var month = date.getMonth();
    var year = date.getFullYear();

    return months[month] + " " + year;
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
