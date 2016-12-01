# storj-node-heroku-example

A Node.js app using [Express 4](http://expressjs.com/), with jQuery on the client. This application starts with a built out front end and a barebones backend. This is meant to be a tutorial application, with the `master` branch being the starting point. A `solution` branch is provided with the completed code (but you will still need to add a [`.env` file](#Setup) and have your own [Storj](https://storj.io) account).

## Video Tutorials

Build out the application along with the [video tutorials](https://www.youtube.com/playlist?list=PLEr5Xx0gHvFG55T-_kLKlWosSBw32vP9N)

## Running Locally

Make sure you have [Node.js](http://nodejs.org/) and the [Heroku Toolbelt](https://toolbelt.heroku.com/) installed.

```sh
$ git clone git@github.com:Storj/storj-node-heroku-example.git # or clone your own fork
$ cd storj-node-heroku-example
$ npm install
$ npm start
```

Your app should now be running on [localhost:5000](http://localhost:5000/).

## Deploying to Heroku

```sh
$ heroku create storj-example
$ heroku addons:create storj --app storj-example
$ git push heroku master
$ heroku open
```
or

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Setup

After deploying or running locally, make sure to create a `.env` file and add your `STORJ_EMAIL` and `STORJ_PASSWORD` credentials to it, in `KEY=VALUE` format:

```
STORJ_EMAIL=email@email.com
STORJ_PASSWORD=password
```

If you don't have a Storj account, sign up for one [here](https://storj.io).

## `heroku local web` vs `npm start`

Running `heroku local web` instead of `npm start` will pull environment variables from a local `.env` file. If you use `npm start`, then you need to pass in any environment variables at that time:

```sh
$ npm start STORJ_EMAIL=email@email.com STORJ_PASSWORD=password OTHER_ENVS=whatever
```

## Documentation

For more information about using Storj on Heroku, check out this [article](https://devcenter.heroku.com/articles/storj).

For more information about using Node.js on Heroku, see these Dev Center articles:

- [Getting Started with Node.js on Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
- [Heroku Node.js Support](https://devcenter.heroku.com/articles/nodejs-support)
- [Node.js on Heroku](https://devcenter.heroku.com/categories/nodejs)
- [Best Practices for Node.js Development](https://devcenter.heroku.com/articles/node-best-practices)
- [Using WebSockets on Heroku with Node.js](https://devcenter.heroku.com/articles/node-websockets)
