# Civilization V Replay Viewer

Drag a .Civ5Replay file onto the page to load a replay.

http://alexwebb2.github.io/civ5replay/

Demo of automatic file loading from Dropbox, starting at turn 122:

http://alexwebb2.github.io/civ5replay/?file=hrbho1q4dtro8pa/Ramesses%20II_0267%20AD-1987_42%20(9).Civ5Replay&turn=177

## Keyboard shortcuts

Key            | Action
-------------- | ------------
`space`        | Play/pause
`1` - `5`      | Set speed
`←`, `→`       | Back/forward one turn
`↑`, `↓`       | Back/forward ten turns
`pgup`, `home` | Jump to first turn
`pgdn`, `end`  | Jump to last turn
`+`, `-`       | Zoom in/out


## Query parameters

#### turn

Pass a `turn` parameter to automatically start on that turn.

#### file

Pass a `file` parameter to link directly to a .Civ5Replay file hosted on Dropbox. This should be the portion of the sharing URL that is unique to the file. For example, if the sharing URL is

    https://dl.dropboxusercontent.com/1/view/hrbho1q4dtro8pa/Ramesses%20II_0267%20AD-1987_42%20(9).Civ5Replay
    
then the `file` parameter would be `hrbho1q4dtro8pa/Ramesses%20II_0267%20AD-1987_42%20(9).Civ5Replay`.
