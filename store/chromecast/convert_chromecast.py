# Copyright Michael Updike 2019

# Convert network requests from
# https://chromecastbg.alexmeub.com/
# to our format

# To generate input file:
#
# Open Chrome Devtools on:  https://chromecastbg.alexmeub.com/
# Reload page
# Scroll down through new photos
# In the network tab, right click select "Copy -> Copy all as fetch"
# overwrite "new_chromecast_photos_as_fetch.txt"

import os
import re

os.chdir(r"C:\Users\mike\Documents\GitHub\screensaver\store\chromecast")

inputFilename = "new_chromecast_photos_as_fetch.txt"
inputFile = open(inputFilename, "r")
inputContents = inputFile.read()
inputFile.close()

print("loaded input")

urls = re.findall(re.compile('(fetch\\()"(.*?)"'), inputContents)

print("processed input")

outputFilename = "urls.txt"
outputFile = open(outputFilename, "w")

i = 0
for url in urls:
    outputFile.write("  {\n")
    val = urls[i][1].replace("s240-w240-h135", "s1920-w1920-h1080")
    outputFile.write("    \"url\": \"" + val + "\",\n")
    outputFile.write("  },\n")
    i += 1

outputFile.close()

print("done")
