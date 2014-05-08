/* THIS FILE DOCUMENTS THE COMMANDS ESSENTIAL IN CREATING/UPDATING THE FFDM database

This will contain sql commands allong with command line arguments which were
used to configure the database

*/
--Raster import from a directry this will import all of the rasters within a given folder
raster2pgsql -s 4326 -I -C *.tif -F -t 100x100 public.current | psql -U npcasler -d ffdm 
--The above command will create a separate row for each of of each raster, but can be grouped by the filename column

--To download the presence data
curl -L -O https://www.dropbox.com/s/ij72kktcpwnpjyc/BIENALL.zip

unzip BIENALL.zip

--Create a table for the presence data
CREATE TABLE presence(gid serial, 
		species varchar(255), 
		x double precision, 
		y double precision);

--To load the data from the folders (there are 4 folders with separate sample sizes
--cd into the folder holding the species.csv files and call this command

grep -v -h "Species" *.csv | psql -U npcasler -d ffdm -c 'COPY presence(species, x, y) FROM stdin WITH CSV'

--The presence table now has the lat/long of each of the presence points in LAEA
--We have to convert this data into geomtry data for it to be of any use
ALTER TABLE presence ADD COLUMN geom geometry(POINT, 9999);

UPDATE presence SET geom = ST_SetSRID(ST_MakePoint(x, y), 9999);

CREATE INDEX idx_presence_geom ON presence USING GIST(geom);

