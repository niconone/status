# status

## setup

    cp config.json.sample config.json

[sign up for an apikey](http://peerjs.com/) and add it to `peerKey` in config.json

    npm install
    npm start

## testing locally

    cp -R status status2
    cd status2
    rm db/*

edit status2/config.json to have a different port from 3000, such as 4000

    npm start

now you will be able to test talking to two different servers.

## hey
![](https://dl.dropboxusercontent.com/u/37968874/gifs/cat-typing-hacking-keyboard-computer.gif)

## license

GPLv3
