var Engine = require('tingodb')({});
var express = require('express');
var cors = require('cors');
var server = express();
var exec = require('child_process').exec;
server.use('/', express.static(__dirname + '/'));
server.use('/static', express.static('./static'));
server.use('/pdb', express.static('./static/pdb/tmprot'));
var mongo = require('./mongo');
var tingo = require('./tingo');
const cst = require('./constants')
const fs = require('fs'); 
const { url } = require('inspector');
const { exit } = require('process');

const db = new Engine.Db(cst.DB_DIR, {});
const DbApi =  tingo; 

// use it before all route definitions
//server.use(cors({origin: 'http://localhost:3333'}));
//server.use(cors({origin: 'http://localhost:5678'}));
server.use(cors({origin: 'http://localhost:3001'})); // to allow localhost 3001 to connect to this database

process.argv.forEach(function(val,index,array){
	if(val === "-init"){
		//if (dbState === "mongodb"){
		console.log("Init database...")
		DbApi.deleteDB(db).then(()=>{
			DbApi.initDB(db, array[index+1])
				.then(data => console.log(data))
				.catch(err => console.error("error during initialization", err))
		})
		.catch(err => console.log("error during deletion", err))
	}
})

server.get('/results',function (req,res){
	//if (dbState==="mongodb"){
	//console.log(req)
	DbApi.findAllProt(db).then(function(items) {
  			//let test = items;
   		res.send(items);
    		//next();
	}, function(err) {
  		console.error('The promise was rejected', err, err.stack);
	});	
})


// Function to test all of my queries

server.get('/results/:word',function(req,res){
	DbApi.searchOnDB(db,req.params.word).then(function(items) {
  		DbApi.FindMatchFields(items,req.params.word)
    	res.send(items); // old: res.send({"key":req.params.word,"hits":items});
	}, function(err) {
  		console.error('The promise was rejected', err, err.stack);
	});		
})

server.get('/pdb/:id', function(req, res){
	console.log("Get pdb with whiteDB api")
	const pdb_file = `${req.params.id.toLowerCase()}.pdb`
	const path = cst.PDB_DIR + "/" + pdb_file
	console.log(`pdb path : ${path}`)
	res.setHeader('content-type', 'application/json')
	fs.readFile(path, (err, data) => {
		if (err) res.send({"error": err}); 
		else res.send({"url":path, "fileContent": data.toString()}); 
	})
})


server.listen(1134, function () {
  console.log('Server listening on port 1134!')
});
