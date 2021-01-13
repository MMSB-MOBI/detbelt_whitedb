# whiteDB

## Introduction

This project was developped during [Det.Belt](http://detbelt.ibcp.fr/) developpement. It's purpose was to make the data from [mpstruc](http://blanco.biomol.uci.edu/mpstruc/) available inside the Det.Belt project.

```
git clone https://github.com/MMSB-MOBI/detbelt_whitedb
cd detbelt_whitedb
npm i
```

## Construct database
````
python construction/construction.py --out-dir <db_directory>
````
It will create under <db_directory> : 
* whiteDB_\<timestamp>.xml : raw xml from whiteDB
* opmPDB_\<timestamp>.tar.gz : archive with all OPM pdbs
* whiteDB_\<timestamp>.json : json file with pdbs that are inside White and OPM
* opmPDB_<timestamp> directory : directory that contains pdb files that are inside White and OPM

Then init tingo database : 
```
node app.js -init <db_directory/whiteDB_<timestamp>.json
```

## Launch microservice
Just do
```
node app.js
```

## Configuration
change variables inside constants.js 