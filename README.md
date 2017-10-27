# VideoBarcodeSegmentation

## Usage

To run segmentation on a single image:
`python3 superpixels.py -i path/to/image -s optional_num_super_pixels -d datafile.txt`

where datafile.txt contains two space separated integers giving a pixel within the qr code in the image:
`qrxpixel qrypixel `

To match segments between two images:
`python3 superpixels.py -i path/to/image i2 /path/to/other/iamge -s optional_num_super_pixels -d datafile.txt`

where datafile.txt contains the pixels of the qr codes in each image, along with pixels in image 1 whose corresponding segments should be matched with segments in image2:
`qrxpixel1 qrypixel1 qexpixel2 qrypixel2 point1x point1y point2x point2y ... `
