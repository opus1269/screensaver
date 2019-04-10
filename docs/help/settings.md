# Settings Page

<a name="ss_controls"></a>
## Slide Show Controls Tab

This interface allows you to configure the appearance and behavior of the screensaver.

> ![alt text](./assets/settings_ss_controls.png)

Toolbar Icons:

> ![alt text](./assets/baseline_settings_backup_restore_black_18dp.png)
Reset the options to their default values. This will not effect your
Google Photos selections.

> ![alt text](./assets/baseline_help_black_18dp.png)
Display this page.

> ![alt text](./assets/icons8-toggle-on-filled-50.png)
If the toggle is off, the screensaver will not be displayed. Any keep awake
settings you have defined, will remain in effect.

Settings:

<a name="wait_time"></a>
> ![alt text](./assets/settings_ss_controls_wait_time.png)

The amount of time the computer must be idle before the screensaver
will be displayed.

> ![alt text](./assets/settings_ss_controls_trans_time.png)

The amount of time before the next photo will be displayed.

> ![alt text](./assets/settings_ss_controls_display_mode.png)

The appearance of the photo.

* Letterbox - Maintain aspect ratio
* Zoom - Fill screen, crop photo if necessary
* Frame - Maintain aspect ratio, display photo in a frame
* Full - Fill screen, modify aspect ratio if necessary
* Random - Select one of the above options each time the screensaver starts

> ![alt text](./assets/settings_ss_controls_trans_mode.png)

The animation to be used between photos

> ![alt text](./assets/settings_ss_controls_pan_and_scan.png)

This will give a "live" feel to the current photo by zooming and
translating while it is being displayed.

> ![alt text](./assets/settings_ss_controls_background.png)

Allows Chrome to startup when you log into your computer and continue to run (invisibly),
even if you close all its windows.
This will allow the extension to display the screensaver when necessary.
If you use the "Exit" command from the main Chrome menu, Chrome will
not run in the background until the next time you start it or log in to the computer.

This has no effect on Chrome OS, because Chrome always runs in the background.

There is also a global setting in Chrome that needs to be enabled for this to work.
Open the Chrome settings [chrome://settings], click on "Advanced", scroll to "System"
and make sure the setting is enabled:

> ![alt text](./assets/settings_ss_controls_chrome_bg_setting.png)

> ![alt text](./assets/settings_ss_controls_interactive.png)

Allows you to pause and scroll through the screensaver manually. The following 
keyboard combinations are available:

* Alt++Shift+Space Bar - Toggle the slide show between paused and running.
* Alt+Shift+Right Arrow - Move forward one slide.
* Alt+Shift+Left Arrow - Move backward one slide.

You can change the key mappings that are used for this in Chrome. Open the extension
shortcuts page [chrome://extensions/shortcuts] scroll to "Photo Screen Saver"
and change the individual commands.  Don't actually type in the text for a command,
just place the cursor in the command you want to change and press the key combination
you want to use.

> ![alt text](./assets/settings_ss_controls_shortcuts.png)


> ![alt text](./assets/settings_ss_controls_randomize.png)

Display the photos in a random order.

> ![alt text](./assets/settings_ss_controls_skip.png)

Don't show photos that are very narrow or vary wide when in Full or Zoom mode.
These photos would be highly distorted in Full mode or zoomed in on a small
portion of the photo in Zoom mode.

> ![alt text](./assets/settings_ss_controls_full_res.png)

Display the highest resolution available for your Google Photos. These files
can be extremely large. Also, they have not been auto rotated in Google Photos.
If you have photos that are not oriented properly, you will need to fix that
in [Google Photos](https://support.google.com/photos/answer/6128850?co=GENIE.Platform%3DDesktop).

> ![alt text](./assets/settings_ss_controls_album_name.png)

Display the album name your Google Photos are in, if you have used
[Album Mode](./google_photos.html#albums)
to select them.

> ![alt text](./assets/settings_ss_controls_location.png)

Display the geo location of a photo if it is available. Note: This feature
is not currently available.

> ![alt text](./assets/settings_ss_controls_show_weather.png)

Display the current weather at your location. This will display two
dialogs, one to allow location sharing and one to authorize access to
the weather API. You must accept both of these.

<a name="location_bug"></a>
There is a bug in Chrome that prevents re-displaying the dialog that
prompts you to allow location sharing if you closed it by clicking on the "X".
The only way to fix it, is to clear the cache in Chrome:

Open the Chrome settings, click on "Advanced" then "Clear Browsing data".
Make sure that "Cookies and other site data" is selected, then click
on the "Clear data" button.

> ![alt text](./assets/settings_ss_controls_temp_unit.png)

Select the format for the temperature displayed in the screensaver. The following
options are available:

* &deg;C - Celsius
* &deg;F - Fahrenheit


> ![alt text](./assets/settings_ss_controls_time.png)

Select the format for the time displayed in the screensaver. The following
options are available:

* No - do not display the time
* 12 hour - e.g. 8:33
* 24 hour - e.g. 20:33
 
> ![alt text](./assets/settings_ss_controls_large_time.png)

Use a larger font for the time display on the screensaver

> ![alt text](./assets/settings_ss_controls_show_source.png)

Display the original source of the currently displayed photo in the screensaver
when you click the left mouse button. You may want to turn this off if you normally
use a left mouse click to wakeup your screen.

> ![alt text](./assets/settings_ss_controls_background_image.png)

Select the background style for the screensaver. This will display a
dialog with the available styles.


<a name="display_controls"></a>
## Display Controls Tab

This interface allows you to control when and where the screensaver is
displayed.

> ![alt text](./assets/settings_display_controls.png)

Toolbar Icons:

> ![alt text](./assets/baseline_settings_backup_restore_black_18dp.png)
Reset the options to their default values. This will not effect your
Google Photos selections.

> ![alt text](./assets/baseline_help_black_18dp.png)
Display this page.

> ![alt text](./assets/icons8-toggle-on-filled-50.png)
If the toggle is off, the screensaver will not be displayed. Any keep awake
settings you have defined, will remain in effect.

Settings:

> ![alt text](./assets/settings_display_controls_all_displays.png)

Display a screensaver on all the displays connected to this computer. This
is harder than it sounds. If it is not working as you think it should,
please [let me know](mailto:photoscreensaver%40gmail.com).

> ![alt text](./assets/settings_display_controls_fullscreen.png)

Do not display the screensaver if you have a Chrome window open that is
in full screen mode.  This is most useful if you are watching a video through
a Chrome app or web page. Unfortunately, the extension cannot detect non Chrome
full screen windows.

> ![alt text](./assets/settings_display_controls_keep_awake.png)

Manage when to display the screensaver and the behavior of the computer's
power settings.

If the "Keep Awake" is off, the screensaver will be displayed whenever the
computer is idle for a [certain period of time](#wait_time).

If the "Keep Awake" is on, the screensaver will only be displayed if the
current time is between the "Time to start" and "Time to stop". If the "Time to start"
and "Time to stop" are the same, the screensaver will always display. The screen
will not go to sleep during this time. If the "Allow system suspend" is on,
the computer may go to sleep.

Note: The requests to keep the screen and computer awake are only suggestions
to the operating system, and may not be honored.


<a name="photo_sources"></a>
## Photo Sources Tab

This interface allows you to select one or more publicly available sources
of photos for use in the screensaver.

> ![alt text](./assets/settings_photo_sources.png)

Toolbar Icons:

> ![alt text](./assets/baseline_check_box_black_18dp.png)
Select all the photo sources.

> ![alt text](./assets/baseline_check_box_outline_blank_black_18dp.png)
Deselect all the photo sources.

> ![alt text](./assets/baseline_settings_backup_restore_black_18dp.png)
Reset the options to their default values. This will not effect your
Google Photos selections.

> ![alt text](./assets/baseline_help_black_18dp.png)
Display this page.

> ![alt text](./assets/icons8-toggle-on-filled-50.png)
If the toggle is off, the screensaver will not be displayed. Any keep awake
settings you have defined, will remain in effect.

Photo Sources:

> ![alt text](./assets/settings_photo_sources_chromecast.png)

A subset of photos used by the Chromecast screensaver

> ![alt text](./assets/settings_photo_sources_flickr_interesting.png)

[Interesting photos from Flickr](https://www.flickr.com/explore/interesting/7days/)

> ![alt text](./assets/settings_photo_sources_reddit_space.png)

[Space photos from reddit](https://www.reddit.com/r/spaceporn/)

> ![alt text](./assets/settings_photo_sources_reddit_earth.png)

[Earth photos from reddit](https://www.reddit.com/r/earthporn/)

> ![alt text](./assets/settings_photo_sources_reddit_animal.png)

[Animal photos from reddit](https://www.reddit.com/r/animalporn/)

> ![alt text](./assets/settings_photo_sources_me.png)

[Some of my photos (including my cats!)](https://www.flickr.com/photos/86149994@N06/)






