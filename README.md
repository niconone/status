# status

p2p status updates. decentralized.

## setup

Install [iojs](https://iojs.org)

Copy the default configuration and change the `password` property. The `password` is for protecting your dashboard interface from being accessible by others but allowing them to still connect for API requests from your machine.

    cp config.json.sample config.json

### access domain

If you have a server and your own domain, use that as your domain entry point to share to others. Otherwise, follow the steps below for a local server:

[download ngrok and place it somewhere that you can execute it](https://ngrok.com/download)
[sign up for an ngrok account](https://dashboard.ngrok.com/user/signup)

Set your ngrok authtoken and run the service

    ngrok authtoken <your ngrok authtoken>
    ngrok http 3000

Install the node dependencies and start the server

    npm install
    npm start

Load [http://localhost:3000](http://localhost:3000)

ngrok will give you a domain that you can use to share to your network of contacts. Enter this in the public URL field of the web interface and save your profile. If you don't set this, then others will not be able to send and receive updates to your machine.

Share your `identifier` and `public URL` to your followers for them to start initial tracking.

Note that if you restart your ngrok service, you will regenerate a new domain. If you want to use a custom domain on a standalone server or use ngrok's paid version to set a custom domain, then you can persist that domain name.

## cat
![](https://dl.dropboxusercontent.com/u/37968874/gifs/cat-typing-hacking-keyboard-computer.gif)

## tests

    cp config.json.sample test/config.json

Change the `db` value to "./test/db"

    npm test

## license

GPLv3
