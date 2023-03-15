## Photo Screen Saver Chrome Extension

### About this repository

I wanted a screensaver that displayed photos from an album in Google Photos.
The original project was almost the thing that I wanted, but since it wasn't maintained anymore, I decided to revive it and develop some small features that were missing for me.

This project is only for personal use. If you want to use it, you need some coding experience, because you have to build the extension yourself.

I made changes that suit specifically my needs, if you want something different, feel free to fork the project and make those changes yourself.

#### The changes:

* Revived the app by creating and using my own OAuth Client, if you want to use it, you have to do this too, see [below](#oauth-client)
* Added some extra info on the screensaver screen, see [below](#extra-info)
* Enabled simple shortcuts, see [below](#simple-shortcuts)
* Created a Companion app to solve the two biggest problems with the extension, see [below](#companion-app)

#### OAuth Client

To acquire an OAuth Client ID:
1. Go to the [Google Cloud API Console](https://console.cloud.google.com/)
2. Create a new project
3. Go to Credentials -> Create credentials -> Select OAuth Client ID
4. Set Application type to Chrome App
5. Set Application ID to a random 32-letter string (the value doesn't matter, since we will only use the project in Testing state)
6. Go through the other steps
7. At the end, write down your generated OAuth Client ID, we will need this when [building the extension](#building-the-extension)

#### Extra info

I added some extra info to the screensaver screen.
* Current date is displayed under the clock
* Creation time: extracted from the mediaItem metaData
* Author and location
  * The extension parses the description of a photo in the following format: `author;geocodedLocation`
  * This is not mandatory, if you don't have description on your photos, the author will be the album name and the location will be marked absent
  * This is necessary, because the Google Photos API doesn't give you access to either of this information, so I created a Tampermonkey script, that I could ran on the Google Photos website and it would fill the description field with the extracted author and geocoded location info
    

#### Simple shortcuts

I enabled simple shortcuts in the extension:
* Space - play/pause slideshow
* Arrow Left/Right - jump backwards/forwards

#### [Companion app](todo)

There were two big issues with the extension that came from the sandboxed nature of the browser.
1. The extension could not read the wakelocks of the system, it could only check other tabs in the browser. This meant that the screensaver would come on even if you were watching something in an other app (eg.: Netflix, VLC, Flex).
2. The extension could create the screensaver window only at the same level as the original Chrome window. This meant that the screensaver would display in front of the browser, but if you were focused on an other app, that would still stay on top, and the photos were in the background.

So I created a Python application that solves both of these problems. You can check that out [here](todo).
This Companion app is not required at all, the screensaver works perfectly without it, just with the above limitations.

### Building the extension

To build the application:
1. Clone the repository to your machine
2. Run `npm install` (obviously you need to have npm installed for this)
3. Set your environment variables:
    * `OAUTH_CLIENT_ID`: mandatory - the client id that you acquired in the [OAuth Client](#oauth-client) section
    * `KEY_SCREENSAVER`: mandatory - since this is for personal use, you can use anything here (eg.: `test`)
    * `KEY_WEATHER`: optional - if you want to display the weather on the screensaver, get your own api key from https://openweathermap.org/api, and input it here
4. Now you can run the `gulp` command to build the extension (make sure that the environment variables are set where you are running it)
5. Open Chrome, and go to [Extensions](chrome://extensions/)
6. Select Load unpacked and load the build result
7. Done, go through the setup and enjoy your new screensaver!

## Original Content

This extension displays a screensaver composed of a slide show of photos from multiple sources. Supported photo sources include:

* Your Google Photos and Albums - Note: Shared Albums are not supported
* Some background photos used by Chromecast
* Several sources from reddit
* Interesting photos from Flickr

Note: Photos from the local file system are not supported.

Many options are available to control the appearance of the slide show, including:

* Wait time after machine becomes idle to display screensaver
* Between photo time interval
* Photo display mode - (e.g., letterbox, fill screen)
* Photo transition animations - (e.g., fade, scale up)
* A scheduler to control when the screensaver, display, and computer should remain on
* Do not display over full screen Chrome windows (e.g., YouTube, Netflix)
* Show on all displays
* Display current weather
* Display time

Works great on all platforms but may be especially useful for your Chromebook.

It is free and advertising free.

It is implemented using Vanilla JavaScript and [Polymer 3](https://polymer-library.polymer-project.org/3.0/docs/devguide/feature-overview).

<br />

[View in Chrome Web Store](https://chrome.google.com/webstore/detail/kohpcmlfdjfdggcjmjhhbcbankgmppgc)

<br />

[GitHub Pages](https://opus1269.github.io/screensaver/)

<br /><br />

