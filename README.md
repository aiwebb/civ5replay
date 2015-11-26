# Civilization V Replay Viewer

Drag a .Civ5Replay file onto the page to load a replay: http://alexwebb2.github.io/civ5replay.

You can also [direct link](http://alexwebb2.github.io/civ5replay/?file=hrbho1q4dtro8pa/Ramesses%20II_0267%20AD-1987_42%20(9).Civ5Replay&turn=177) a URL with a Dropbox file ID included to easily share replays with others.

Supports Civ5Replay files created since about mid 2013, after the release of Brave New World.

## Background

I do a fair amount of work with mapping, and I've always enjoyed diving into binary files. I was frustrated with the in-game replay viewer in Civ V - it crashes very commonly at the end of a game, it doesn't display the log messages alongside the map, the map itself leaves a bit to be desired, you can't load a replay unless all the mods it used are currently installed, and sharing replays is just impractical enough to not be done.

I wanted something *simple* that would make it easy to share replays with the community with nothing but a URL, so I set about reverse engineering the format and building an entirely client-side replay site that would stand the test of time.

## Process

I used [jDataView](https://github.com/jDataView/jDataView) to abstract the process of grabbing bits into a series of simple function calls. From there, I built a simple (mostly-)general-purpose binary file parser that accepts a configuration object describing the file structure and produces an output data object.

I used [Synalyze It](https://www.synalysis.net/) for OS X as my hex editor - it has a nice tagging scheme, a quick-view grid of human readable values for selected bytes, and good support for searching, jumping to various locations, and resizing the window to snap bytes into alignment. Not trying to shill for them, but I tried a dozen other products over the years before I found one with that combination of features, so credit where credit is due for producing a hex editor that doesn't have any major shortcomings.

The end result was the [current JS config](https://github.com/alexwebb2/civ5replay/blob/gh-pages/js/Replay.js#L12) describing the file format.

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

## TODO / contributing

- Render the last few map features (marsh, oasis, flood plains)
- Map out the rest of the natural wonders and add a new layer for them
- Use an icon for cities instead of a solid color
- Better tile artwork for nicer maps all around
- More keyboard shortcuts for toggling map layers
- Graph the available datasets\
- Loading indicator and error notice for initial parsing

Since this is entirely client side with zero dependencies to install, it's an extremely easy project to fork and play around with. Pull requests are always welcome.

## Special thanks
A huge part of reverse engineering binary files is getting the first questions answered - how are integers encoded? Strings? Arrays? Several others had done varying degrees of work on the format before me, and while the file structure has changed so much since their efforts that I wasn't able to reuse much at all, their work was very important for that initial momentum:

- Kristoffer Berdal - [flexd/replay_parser](https://github.com/flexd/replay_parser)
- Danny Fisher - [CivFanatics thread](http://forums.civfanatics.com/showthread.php?t=388160)

Additional thanks to [civilopedia.info](http://www.civilopedia.info/), which provided the design inspiration that turned this from [something bland](https://i.imgur.com/efkyaiI.png) into what you see now.

Finally, huge thanks to Firaxis for making a game [I can't stop playing](http://i.imgur.com/Xk3jrll.png).
