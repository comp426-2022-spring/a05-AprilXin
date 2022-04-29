// Place your server entry point code here

const express = require('express');
const morgan = require('morgan');
const fs = require('fs');

const logdb = require('./src/services/database.js');
const app = express();

// Serve static HTML files
app.use(express.static('./public'));

// Make Express use its own built-in body parser to handle JSON
app.use(express.json());

const args = require("minimist")(process.argv.slice(2));
// args["port"];
// console.log(args);
const port = args.port || process.env.PORT || 5555;

const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)

if (args.help || args.h) {
  console.log(help)
  process.exit(0)
}

const server = app.listen(port, () => {
    console.log(`App is running on ${port}`);
});

app.get('/app', (req, res) => {
    res.status(200).end('200 OK');
    res.type("text/plain");
});

function coinFlip() {
    let random = Math.random();
    if (random > 0.5) {
      return "heads";
    } else {
      return "tails";
    }
    process.exit(1);
};

function coinFlips(flips) {
    const coins = [];
    for (let i = flips; i > 0; i--) {
      coins[flips-i] = coinFlip();
    }
    return coins;
    process.exit(1);
};

function countFlips(array) {
    let heads = 0;
    let tails = 0;
    for (let i = array.length; i > 0; i--) {
      if (array[array.length-i] == "heads") {
        heads += 1;
      } else {
        tails += 1;
      }
    }
    if (heads == 0) {
      return {tails: tails};
    } else if (tails == 0) {
      return {heads: heads};
    } else {
      return {heads: heads, tails: tails};
    }
    process.exit(1);
};

function flipACoin(call) {
    let flip = coinFlip();
    let result;
    if (call == flip) {
      result = "win";
    } else {
      result = "lose";
    }
    return {call: call, flip: flip, result: result};
    process.exit(1);
};

app.use ((req, res, next) => {
  let logdata = {
    remoteaddr: req.ip,
    remoteuser: req.user,
    time: Date.now(),
    method: req.method,
    url: req.url,
    protocol: req.protocol,
    httpversion: req.httpVersion,
    status: res.statusCode,
    referer: req.headers['referer'],
    useragent: req.headers['user-agent']
  }
  const stmt = logdb.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent);
  // res.status(200).json(info);
  next();
});

if (args.debug) {

  app.get("/app/log/access", (req, res) => {
    try {
      const stmt = logdb.prepare('SELECT * FROM accesslog').all();
      res.status(200).json(stmt);
    } catch (e) {
      console.error(e);
    }
  });

  app.get("/app/error", (req, res) => {
    throw new Error("Error test successful.")
  })

};

if (args.log) {
  const WRITESTREAM = fs.createWriteStream('FILE', { flags: 'a' });
  app.use(morgan('FORMAT', { stream: WRITESTREAM }));
}

// app.post("app/new/user", (req, res, next) => {
//   let data = {
//     user: req.body.username,
//     pass: req.body.password
//   }
//   const stmt = db.prepare('INSERT INTO userinfo (username, password) VLUES (?, ?)');
//   const info = stmt.run(data.user, data.pass);
//   res.status(200).json(info);
// });

app.get('/app/flip', (req, res) => {
    res.status(200).json({ 'flip': coinFlip() });
    res.type("text/plain");
});

app.get('/app/flips/:number', (req, res) => {
    const flips = coinFlips(req.params.number);
    res.status(200).json({ 'raw': flips, 'summary': countFlips(flips) })
});

app.get('/app/flip/call/heads', (req, res) => {
    res.status(200).json( flipACoin("heads") );
    res.type("text/plain");
});

app.get('/app/flip/call/tails', (req, res) => {
    res.status(200).json( flipACoin("tails") );
    res.type("text/plain");
});

// app.patch("app/update/user/:id", (req, res) => {
//   let data = {
//     user: req.body.username,
//     pass: req.body.password
//   }
//   const stmt = db.prepare('UPDATE userinfo SET username = COALESCE(?, username), password = COALESCE(?, password) WHERE id = ?')
//   const info = stmt.run(data.user, data.pass, req.params.id);
// });

// app.delete("app/delete/user/:id", (req, res) => {
//   const stmt = db.prepare('DELETE FROM userinfo WHERE id = ?');
//   const info = stmt.run(req.params.id);
//   res.status(200).json(info);
// })

app.use(function(req, res) {
    res.status(404).send('404 NOT FOUND');
});

// app.use(function(req, res) {
//     res.status(404).send("Endpoint does not exist");
//     res.type("text/plain");
// });
