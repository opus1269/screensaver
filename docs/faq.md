# Frequently Asked Questions

#### [General questions](#general)

#### [Google Photos questions](#google-photos)

#### [Chromebook questions](#chromebook)

#### [Keep Awake questions](#keep-awake)

#### [Features questions](#features)

  ***

### General

* **How do I uninstall this?**

  Right click on the icon in the browser toolbar and select
  **Remove From Chrome...**

  ***

* **How do I turn off the Windows screensaver?**

  1. Right-click the empty space on your desktop and select **Personalize**.
  2. It now opens up the Personalization settings. Click on **Lock screen** in the left pane, then click the **Screen saver settings** link in the right pane. If you’re running Windows 7, simply click on the Screen Saver link at the bottom of the window.
  3. In the Screen Saver Settings dialog, select **(none)** for the screensaver and Uncheck the box to **On resume, display logon screen**.

  ***

* **How do I keep my screen from going black?**

  1. Click on the extension icon to bring up the **Settings**.
  2. Click on the **DISPLAY CONTROLS** tab.
  3. Select the **Keep Awake** option.

   You can also select a start and stop for the **Keep Awake** to control
   when it is active. See the [Keep Awake](#keep-awake) section for more details.

  ***

* **Why do my photos look "squished" or "stretched"?**

  The display mode **Full** will change the aspect ratio of the photo
  to match the screen.  All other modes maintain the photo's aspect
  ratio.

  ***

* **What do the labels on the icon mean?**

  - No label: The screensaver is enabled and will be displayed when the computer is idle.
  - **OFF**: The screensaver is disabled. It will not be displayed.
  - **SLP**: The time is in the inactive range of the scheduler. The screensaver will not be displayed.
  - **PWR**: The scheduler will process the Keep Awake settings, but the screensaver will not be displayed.

  ***

* **I set the option to run Chrome in the background, but it is not working. Why is that?**

  Chrome has a setting that can disable this. Go to Chrome Settings,
  click on advanced and scroll to the system area. Make sure
  **Continue running background apps when Chrome is closed** is selected.

  ***

* **I clicked on one of the email links in Help & Feedback, but nothing happened. Why is that?**

  You need to have an app defined that handles email links on your computer.
  This could either be an application you use that is separate from Chrome (e.g. Outlook)
  or a web based email app. To define your web based app (e.g. Google Mail)
  go to its web page. On the right side of the URL bar, next to the star
  there should be another icon. Click on it and allow it to be your email
  handler.

  ***

* **What happened to the short-cut key for launching the screensaver?**

    Chrome only allows 4 pre-defined short-cut keys per extension.
    I needed to remove this one to add the "Interactive mode" feature.
    You can define the key command manually. Go to **More tools** -> **Extensions**,
    scroll to the bottom and click on **Keyboard shortcuts**.
    Find the Photo Screen Saver extension and enter the key combination
    you want to use for **Display now**. Actually press the combination
    you want to use, don't try to spell it out.

    Notice that you can override any of the short-cuts and make them work
    globally on non Chrome OS devices.

### Google Photos

* **Why does the dialog asking for Picasa permissions say it can change my data?**

    The extension will never change any of your data.
    The API that Google provides for interacting with your Google Photos
    does not have a read only scope. The extension only reads data.

  ***

* **Why are some of my photos upside down or on their side?**

    If this is the case, you need to turn off the
    **Use full resolution for photos you own** option in **Settings**.
    This option uses the original photo that you uploaded. If you want
    to use them, you will need to orient them properly before uploading,
    or edit the original photo in Google Photos and rotate it.

  ***

* **Why aren't all my Google Photos albums showing?**

    The API that Google provides to interface with Google Photos does
    not fully support the new shared albums.  To convert an existing
    shared album to a format the screen saver supports,
    select the album, click on **Sharing Options** and unset the **Share**
    option.

    Also, the extension can only retrieve a maximum of 1000 albums.

  ***

* **Why aren't all my photos showing?**

    The extension can only retrieve a maximum of 1000 photos per album.
  
  ***

* **I am signed in to Google Photos, but am getting an error when trying to load my Google Photos albums. Why is that??**

    You need to sign into the Chrome Browser as the user whose Google 
    Photos you want to use.
    
    You can do this from the Browser's Settings menu.
  
  ***

* **I received a Status: 500 error trying to load my Google Photos albums. What does that mean?**

  This is an error on the Server that provides the photos.
  This is a temporary issue - please try again later.

### Chromebook

* **Why is the time label incorrect on my Chromebook?**

  If you have this problem, go to the Browsers **Settings**,
  select **Show Advanced Settings** and in the **Date and time** section
  uncheck the **Set time zone automatically using your location**.
  You will need to re-start for the change to take effect.

### Keep Awake

* **I have the Keep Awake off, but my display is not sleeping. Why is that?**

  Other applications may be preventing the display or computer from sleeping.

  On many Chrome OS devices the display will not sleep if the screensaver is running.
  You can use the Screensaver/Keep Awake scheduling feature to control when the screensaver is displayed.

  ***

* **I have the Keep Awake on, but my system is shutting down. Why is that?**

  The Keep Awake features are requests to the computer and do not have to be honored.
  The display request is almost always honored, but the system request isn't. In
  particular, many PC's will put the computer to sleep if you have them set to do this.

### Features

* **Can you add support for using files from my local computer?**

  It can be done, but I have not gotten around to it yet.
  
  ***

* **Can you hide the cursor when the screensaver is displayed?**

    **Update:** As of Chrome version 60 this has been fixed. It may
    still be broken on Mac though.

    There is bug in Chrome that prevents this. It was working on MS Windows
    computers until Chrome Version 58 broke it. It has been broken on Chrome OS
    for a long time. If you would like to see this fixed, star
    [issue 714378](https://bugs.chromium.org/p/chromium/issues/detail?id=714378)
    on the Chromium bug tracker. You will need to sign in with your Google account
    to do this. Thanks.


  <br />
