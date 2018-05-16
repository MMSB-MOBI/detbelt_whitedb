var Engine = require('tingodb')({});
var db = new Engine.Db('./data/db', {});
var express = require('express');
var cors = require('cors');
var server = express();
var exec = require('child_process').exec;
server.use('/', express.static(__dirname + '/'));
server.use('/static', express.static('./static'));
server.use('/pdb', express.static('./static/pdb/tmprot'));
var mongo = require('./mongo');
var tingo = require('./tingo');

let testDb = function(){
  if(process.argv[2]==="--mongo"){
    return true;
  }
  else{
    return false;
  }
}

var DbApi =  testDb() ? mongo : tingo; 

let arg = process.argv;

// use it before all route definitions
//server.use(cors({origin: 'http://localhost:3333'}));
//server.use(cors({origin: 'http://localhost:5678'}));
server.use(cors({origin: 'http://localhost:3001'})); // to allow localhost 3001 to connect to this database

process.argv.forEach(function(val,index,array){
	if(val === "--mongo"){
    	//dbState = "mongodb";
    	var child = exec('mongod', (error, stdout, stderr) => {
    	if (error) {
      		console.error(`exec error: ${error}`);
      		return;
    	}
    	console.log(`stdout: ${stdout}`);
    	console.log(`stderr: ${stderr}`);
    	});
    	console.log("using mongodb")
	}
	else if (val === "--tingo"){
    	console.log("using tingodb");
    	//dbState = "tingodb";
	}
	
	if(val === "-init"){
		//if (dbState === "mongodb"){
		DbApi.deleteDB(db).then(()=>{
			DbApi.initDB(db,__dirname+'/'+array[index+1])			
		})
	}
})


/*    MongoClient.connect('mongodb://localhost:27017/det', function(err, db) {
      if (err) {
        throw err;
      }
      let deleteRes = mongo.deleteData(db); 
      deleteRes.on('deleteOK',function(msg,result){
        mongo.insertData(db, __dirname+'/'+array[index+1]); //the emitter is used to force the execution's order
        if(b_history ===true){
        write_history("reinit",__dirname+'/'+arg[arg.indexOf("-reinit")+1])
      } 
 
      })
    })
    }
*/

server.get('/default', function(req, res) {
  res.send({'key':'toto', 'hits':[{ "_id" : 'ObjectId("5a8404e5fe864cbfc186cad6")',
									"memberProteins" : null, 
									"name" : "15-Lipoxygenase-2 (15-LOX-2) with substrate mimic",
									"type" : "protein", 
									"relatedPdbEntries" : null, 
									"group" : "MONOTOPIC MEMBRANE PROTEINS", 
									"secondaryBibliographies" : null, 
									"subgroup" : "Lipoxygenases", 
									"bibliography" : { "doi" : "10.1074/jbc.M113.543777", 
								  					"title" : "The structure of human 15-lipoxygenase-2 with a substrate mimic.", 
								  					"journal" : "J Biol Chem", 
								  					"year" : "2014", 
								  					"pubMedId" : "24497644", 
								  					"pages" : "8562-8569", 
								  					"volume" : "289", 
								  					"authors" : "Kobe MJ, Neau DB, Mitchell CE, Bartlett SG, &amp; Newcomer ME", 
								  					"issue" : null, 
								  					"notes" : null }, 
								  	"pdbCode" : "4NRE", 
								  	"taxonomicDomain" : "Eukaryota", 
								  	"resolution" : "2.63", 
								  	"species" : "Homo sapiens", 
								  	"expressedInSpecies" : "E. coli", 
								  	"description" : null, 
								  	"matchFields" : "group"},
								  { "_id" : 'ObjectId("5a8404e5fe864cbfc186cad5")', 
								  	"memberProteins" : null, 
								  	"name" : "Squalene-hopene cyclase", 
								  	"type" : "protein", 
								  	"relatedPdbEntries" : [ "3SQC" ], 
								  	"group" : "MONOTOPIC MEMBRANE PROTEINS", 
								  	"secondaryBibliographies" : null, 
								  	"subgroup" : "Squalene-Hopene Cyclases", 
								  	"bibliography" : { "doi" : null, 
								  					"title" : "The structure of the membrane protein squalene-hopene cyclase at 2.0 &Aring; resolution.", 
								  					"journal" : "J. Mol. Biol.", 
								  					"year" : "1999", 
								  					"pubMedId" : "9931258", 
								  					"pages" : "175-187", 
								  					"volume" : "286", 
								  					"authors" : "Wendt KU, Lenhart A, &amp; Schulz GE", 
								  					"issue" : null, 
								  					"notes" : null }, 
								  	"pdbCode" : "2SQC", 
								  	"taxonomicDomain" : "Bacteria", 
								  	"resolution" : "2.0", 
								  	"species" : "Alicyclobacillus acidocaldarius", 
								  	"expressedInSpecies" : null, 
								  	"description" : " 2SQC is space group P4<sub>3</sub>2<sub>1</sub>2.  3SQC, 2.8&nbsp;&Aring; is P3<sub>2</sub>21.", 
								  	"matchFields": ["group"]}]

			});

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
	//}
  	//else if(dbState === "tingodb"){
    // tingo.findAllProt(db).then((items)=>{
    //  		res.send(items);
  	//console.log("done")
})
  	//}
//})


// Function to test all of my queries

server.get('/results/:word',function(req,res){
	//if (dbState === "mongodb"){
	DbApi.searchOnDB(db,req.params.word).then(function(items) {
  		mongo.FindMatchFields(items,req.params.word)
    	res.send(items); // old: res.send({"key":req.params.word,"hits":items});
	}, function(err) {
  		console.error('The promise was rejected', err, err.stack);
	});		
	//}
	//else if (dbState === "tingodb"){
		// tingo.searchOnDB(db,req.params.word).then((items)=>{
		// 	tingo.FindMatchFields(items,req.params.word)
		// 	res.send(items);
		// }, function(err) {
  // 			console.error('The promise was rejected', err, err.stack);
		// });	
	//}
})


server.listen(1234, function () {
  console.log('mongodet server listening on port 1234!')
});