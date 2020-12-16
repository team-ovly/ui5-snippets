
Original source:
[Snippets in Visual Studio Code](https://code.visualstudio.com/docs/editor/userdefinedsnippets)

## Sample Snippet
```json 
{
    "snippet-name": {
        "prefix": "!5-prefix",
        "body": [
            
        ],
        "description": ""
    }
}
```

## Snippets Syntax

What you want | How you do it
------------ | -------------
Tabstops | `$0   $1   $2`
Placeholders | `${1:foo}`
Choice | `${1|one,two,three|}`
Variables I | `$name`
Variables II |`${name:default}`


## Varibles

Name | Meaning
------------ | -------------
TM_SELECTED_TEXT | The currently selected text or the empty string
TM_CURRENT_LINE | The contents of the current line
TM_CURRENT_WORD | The contents of the word under cursor or the empty string
TM_LINE_INDEX | The zero-index based line number
TM_LINE_NUMBER | The one-index based line number
TM_FILENAME | The filename of the current document
TM_FILENAME_BASE | The filename of the current document without its extensions
TM_DIRECTORY | The directory of the current document
TM_FILEPATH | The full file path of the current document
CLIPBOARD | The contents of your clipboard
WORKSPACE_NAME | The name of the opened workspace or folder


## Varibles for date and time

Name | Meaning
------------ | -------------
CURRENT_YEAR | The current year
CURRENT_YEAR_SHORT | The current year's last two digits
CURRENT_MONTH | The month as two digits (example '02')
CURRENT_MONTH_NAME | The full name of the month (example 'July')
CURRENT_MONTH_NAME_SHORT | The short name of the month (example 'Jul')
CURRENT_DATE | The day of the month
CURRENT_DAY_NAME | The name of day (example 'Monday')
CURRENT_DAY_NAME_SHORT | The short name of the day (example 'Mon')
CURRENT_HOUR | The current hour in 24-hour clock format
CURRENT_MINUTE | The current minute
CURRENT_SECOND | The current second
CURRENT_SECONDS_UNIX | The number of seconds since the Unix epoch

## Variables for blocks

Name | Meaning
------------ | -------------
BLOCK_COMMENT_START | Example output: in PHP /* or in HTML <!--
BLOCK_COMMENT_END | Example output: in PHP */ or in HTML -->
LINE_COMMENT | Example output: in PHP //