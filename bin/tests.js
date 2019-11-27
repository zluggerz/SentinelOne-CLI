#!/usr/bin/env node
require('dotenv').config({ path: '../.env' });
const request = require('request');
const yargs = require('yargs');
const table = require('cli-table');

// Set Defaults for HTTP Requests 
const baseRequest = request.defaults({
    baseUrl: process.env.s1Url,
    headers: {
        'Authorization': process.env.apiKey
    }
});

//  Function that returns all sites qand prints vital info to the terminal
function GetAllSites(target) {
    if (target  === undefined){ target = "sites" }
    baseRequest.get(target, function(err, res, body) {
        if (err) {
            console.log(err);
        } else if (!err && res.statusCode == 200) {
            let sites = [];
            let info = JSON.parse(body);
            places = info.data.sites;
            places.forEach(p => {
                sites.push(p);
            })
            if (info.pagination.nextCursor !== null) {
                GetAllSites("sites?cursor=" + info.pagination.nextCursor);
            }
            sites.forEach(s => {
                if (s.state !== 'deleted') {
                    let disp = new table();
                    disp.push(
                        { 'Name': s.name },
                        { 'ID': s.id },
                        { 'Token': s.registrationToken }
                    );
                    console.log(disp.toString());
                }
            });
        } else {
            console.log("HTTP Status Code: " + res.statusCode);
            console.log(body);
        }
    })
}

//  Function to Get a Site by Token
function GetSite(token) {
    baseRequest.get("sites?registrationToken=" + token, function(err, res, body) {
        if (err) {
            console.log(err);
        } else if (!err && res.statusCode == 200) {
            let info = JSON.parse(body);
            let siteID = info.data.sites[0].id;
            console.log(siteID);
        } else {
            console.log("HTTP Status Code: " + res.statusCode);
            console.log(body);
        }
    })
}

// Function that deletes a site by ID
function DeleteSite(id) {
    baseRequest.delete("sites/" + id, function(err, res, body) {
        if (err) {
            console.log(err);
        } else if (!err && res.statusCode == 200) {
            out = JSON.parse(body);
            console.log(out);
        } else {
            console.log("HTTP Status Code: " + res.statusCode);
            console.log(body);
        }
    })
}

// Function that creates a new site
function CreateSite(Name) {
    let payload = {
            "data": {
                "siteType": "Paid",
                "name": Name,
                "totalLicenses": 200,
                "sku": "Core",
                "inherits": true,
                "suite": "Core",
                "accountId": "706656516881151446"
                }
        }
    baseRequest.post({
        uri: 'sites',
        body: payload,
        json: true
    }, function(err, res, body) {
        if (!err && res.statusCode == 200) {
            console.log(body.data.registrationToken);
        } else if (err) {
            console.log(err);
        } else {
            console.log("HTTP Status Code: " + res.statusCode);
            console.log(body);
        }
    });
}


var argv = yargs
    .usage('Usage: $0 <command> [args]')
    .command('create', 'create a new site', function (yargs) {
        argv = yargs.option('n', {
            alias: 'name',
            describe: 'name of the site to be created.',
            type: 'string',
            demandOption: true
        })
    }, function (argv) {
        CreateSite(argv.name);
    })
    .command('list', 'list all sites', function (yargs) {
        GetAllSites();
    })
    .command('get', 'get site ID', function (yargs) {
        argv = yargs.option('t', {
            alias: 'token',
            describe: 'site token',
            type: 'string',
            demandOption: true
        })
    }, function (argv) {
        GetSite(argv.token);
    })
    .command('delete', 'Delete a site by ID', function (yargs) {
        argv = yargs.option('i', {
            alias: 'id',
            describe: 'id number for the site to be deleted',
            type: 'string',
            demandOption: true
        })
    }, function (argv) {
        DeleteSite(argv.id);
    })
    .help('help')
    .argv