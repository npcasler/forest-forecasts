#################################################
#Steps for creating tiled change rasters from maxent output:
#Inputs: current maxent species raster, projected maxent, species raster, color ramp txt file
#Outputs: tiled kml/tms directories
#
#Scale Maxent Output Rasters- Maxent outputs data in 32bit signed floats which isn't handled by most GIS platforms
#and doesn't work with colormaps. Also, due to the nature of the maxent algorithm, the outputs are only relative to themselves
#meaning we need to put rescale their values to make the data comparable.
#
#To do this we can use gdal_translate "-scale" feature to rescale each of the layers to a range of 0-255 (same as rgb).
#This tool will also let us convert the ascii rasters to geotiff format, assign a projection, and define a null data value,
#which can be done using the following line:
#################################################

gdal_translate -scale -ot Byte -of GTiff -a_nodata 0 -a_srs EPSG:4326 input.asc ouput.tif

#################################################
#Once these rasters are finished, we can run the raster calculations in Grass bash since it allows us to define how to handle
#null values.
#
#If grass is not configured yet see the documentation at http://grass.osgeo.org/documentation/first-time-users/
#
#To import current and projected rasters we can use: 
#################################################

r.in.gdal input=/path/to/species_current.tif output=species_current

r.in.gdal input=/path/to/species_future.tif output=species_future

#################################################
#To find the difference between the future and current range distributions, we can use the r.mapcalc function
#with an expression that will return null values if the projected raster is null, return the projected raster value if the current 
#raster is null, and return the future raster - current raster if they both are not null.
#################################################

r.mapcalc "species_diff = if(isnull(species_future), null(), species_future - species_current)"

#################################################
#To output the rasters, we will can use
#################################################

r.out.gdal input=species_diff format=GTiff type=Int16 output=/path/to/change/species_difference.tif nodata=-9999

#################################################
#Since both of the rasters were given a range of 0-255 earlier, negative values will only come if the future is less suitable than 
#the current and the new min/max will be -255-255 with any onther values will be null. We can recale these vales back to 0-255(byte)
#using a similar gdal_translate line
##################################################

gdal_translate -scale -255 255 -ot Byte -of GTiff -a_nodata 0 species_difference.tif species_scaled.tif

##################################################
#The next step is to convert the rasters to a 3-band rgb rasters with a determined coloramp. This will make the rasters show with the 
#proper coloration no matter the program. The colorramp we are using had 4 columns: red, green, blue, alpha. The alpha column allows
#us to leave null values transparent.
##################################################

gdaldem color-relief species_scaled.tif /path/to/colorramp.txt species_color.tif -alpha

##################################################
#Finally we tile the results
##################################################

gdal2tiles.py -p geodetic -r bilinear --zoom=1-7 -k species_color.tif /path/to/output/folder/
