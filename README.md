# status

## setup

Install [iojs](https://iojs.org) or [babel](https://babeljs.io)

    cp config.json.sample config.json

[download ngrok to the root of this repo](https://ngrok.com/download)
[sign up for an ngrok account](https://dashboard.ngrok.com/user/signup)

    ./ngrok authtoken <your ngrok authtoken>
    npm install
    npm start
    ./ngrok http 3000

load [http://localhost:3000](http://localhost:3000)

## testing locally

    cp -R status status2
    cd status2
    rm db/*

edit status2/config.json to have a different port from 3000, such as 4000

    npm start

load [http://localhost:4000](http://localhost:4000)

now you will be able to test talking to two different servers.

## cat
![](https://dl.dropboxusercontent.com/u/37968874/gifs/cat-typing-hacking-keyboard-computer.gif)

## license

GPLv3
