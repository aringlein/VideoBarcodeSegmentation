# VideoBarcodeSegmentation

## Setup

I've built scikit-image 0.14 from source: `https://github.com/scikit-image/scikit-image/blob/master/README.md` to test some of the new features, but I think 0.13 (the stable release) should also still work for now.

## Usage

### Author Side

Typical usage: `python3 superpixels.py -i path/to/image`
The program will automaticall dump the index matrix to `index_matrix.csv` and the relevant matching data (index, x, y, center) to `matching_data.csv`

### User Side

Typical usage: `python3 superpixels.py -i path/to/image -d datafile.txt -m` (This generates a mask for each keyframe specified in datafile.txt)

### Flags

* `-d datafile.txt` allows the specification of target segments for matching, using Zach's format (TODO: Add here).

* If the `-m` flag is given, these will be used to generate a mask for each keyframe of the image.

* The `-di` flag may be used to display the image(s) using matplotlib; by default each will be output to a file output_x.txt instead

* The `-s size` flag may be used to manually specify the maximum distance between pixels in a segment (larger values will lead to generally larger superpixels).

* The `-q qr_file.txt` flag be may be used to specify a file containing two integer coordinates of a pixel in the position marker of a QR code, so that position can be matched relative to the QR code.

### GUI

Run the matching gui with `python3 gui.py`

### Multiple Image Mode

This feature can be used for development to compare the segmentations of similar images, though using the gui is probably easier.

To match segments between two images:
`python3 superpixels.py -i path/to/image -i2 /path/to/other/image -d datafile.txt`

where datafile.txt contains the pixels of the qr codes in each image, along with pixels in image 1 whose corresponding segments should be matched with segments in image2:
`qrxpixel1 qrypixel1 qexpixel2 qrypixel2 point1x point1y point2x point2y ... `

## Configuration on macOS

`virtualenv VirtualEnv`

`source VirtualEnv/bin/activate`

`pip3 install -U scikit-image`

`cd segmentation`

Segmentation with csv as output:

`python3 superpixels.py -i img_author.png`

Matching with masks as output:

`python3 superpixels.py -i img_user.png -d qr_author.txt -m`

