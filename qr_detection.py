import zbar
import argparse
from skimage.util import img_as_ubyte
from skimage import io
import numpy as np

def main():
	ap = argparse.ArgumentParser()
	ap.add_argument("-i", "--image", required = True)
	args = vars(ap.parse_args())

	scanner = zbar.Scanner()
	image = io.imread(args["image"], flatten=True, mode='L')
	image = np.uint8(image)

	results = scanner.scan(image)
	print(str(results))
	for result in results:
		print(str(result))

if __name__ == '__main__':
	main()