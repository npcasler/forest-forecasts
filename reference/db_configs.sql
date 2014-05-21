/* THIS FILE DOCUMENTS THE COMMANDS ESSENTIAL IN CREATING/UPDATING THE FFDM database

This will contain sql commands allong with command line arguments which were
used to configure the database

*/
--Raster import from a directry this will import all of the rasters within a given folder
raster2pgsql -s 4326 -I -C -M /home/npcasler/maxent_nofilters_scaled/rcp85/2011/*.tif  -F public.rasters_2011 | psql -U npcasler -d ffdm
*/

--The above command will create a separate row for each of of each raster, but can be grouped by the filename column
--Create a raster table that can hold all years and rcps
CREATE TABLE public.rasters (gid serial PRIMARY KEY, 
                        species varchar(255), 
                        year integer, 
                        rcp varchar(5), 
                        rast raster);

--To load the data from the year tables (need to run this for each year
INSERT INTO rasters (species, year, rcp, rast) SELECT r.filename, '2011', 'rcp45', r.rast FROM rasters_2011 AS r;

--Remove file extension from the species column
UPDATE rasters SET species = trim(trailing '.tif' from species);
--To create a table of centroids:
SELECT rcp, year, species, ST_Centroid(ST_MinConvexHull(rast)) INTO centroids FROM rasters GROUP BY rcp, year, ST_Centroid(ST_MinConvexHull(rast)) ORDER BY year, species;

--to get the area in sq.km of the total range per year
SELECT year, sum(c_count) 
  FROM stats.area
  WHERE rcp='rcp45'
  GROUP BY year
  ORDER BY year;

-- To create a line feature class of centroid movement
SELECT c.species, ST_MAKELINE(the_geom) AS lines INTO vectors 
  FROM (SELECT species, year, geom as the_geom 
    FROM centroids 
    WHERE rcp= 'rcp85' 
    ORDER BY year, species) c 
  GROUP BY species;


-- To create lines for the beginnins and ending predictions for an rcp
SELECT c.species, ST_MAKELINE(the_geom) AS lines INTO sum_vectors 
  FROM (SELECT species, year, geom AS the_geom 
    FROM centroids 
    WHERE rcp = 'rcp85' AND (year='2011' OR year='2081') 
    ORDER BY year, species) c 
  GROUP BY species;

--to get the displacement of each species centroid
SELECT species, sum(ST_Length_Spheroid(lines, 'SPHEROID["WGS_84",6378137,298.257223563]'))/1000 AS km_displacement
  FROM sum_vectors
  GROUP BY species
  ORDER BY km_displacement;

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

