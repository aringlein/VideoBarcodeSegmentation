#!/usr/bin/python3
from skimage.segmentation import slic
from skimage.segmentation import mark_boundaries
from skimage.util import img_as_float
from skimage import io
from skimage import measure
from skimage import filters
from skimage import data
import matplotlib.pyplot as plt
import argparse
from scipy import ndimage as ndi
from skimage.feature import canny
#from skimage.viewer import ImageViewer
#rom skimage.color import rgb2gray
#from skimage.morphology import watershed
import numpy as np
#from skimage.color.adapt_rgb import adapt_rgb, each_channel, hsv_value
import sys
#import pyzbar as zbar
#from PIL import Image 
#import zbar
#import cv2
#import numpy as np
#np.set_printoptions(linewidth=120)
from pprint import pprint
import math

def main():
 
	ap = argparse.ArgumentParser()
	ap.add_argument("-i", "--image", required = True)
	ap.add_argument("-i2", "--image2", required = False)
	ap.add_argument("-s", "--size", required = False)
	ap.add_argument("-d", "--data", required = True)
	args = vars(ap.parse_args())
	image = img_as_float(io.imread(args["image"]))
	file = open(args["data"], "r")
	data = file.read().split()
	#run_open_cv(image)
	if "size" in args and args["size"]:
		size = int(args["size"])
	else:
		size = 100
	if "image2" in args and args["image2"]:
		image2 = img_as_float(io.imread(args["image2"]))
		#Run matching between image and image2

		#superpixel_level = int(len(image) / size)
		#print(superpixel_level)

		#data is qrx qry qr2x qr2y dx dy ...
		qr_coords = (int(data[0]), int(data[1]))
		qr_coords_2 = (int(data[2]), int(data[3]))
		index = 4
		to_match = []
		while index < len(data):
			to_match.append((int(data[index]), int(data[index+1])))
			index += 2

		matcher = Matcher(image, image2, qr_coords, qr_coords_2)
		matcher.run_segmentation(size)
		matcher.display_matches(to_match)

	else:
		#Just run segmentation on image
		#data is qrx qry
		qr_coords = (int(data[0]), int(data[1]))
		segmenter = Segmenter(image)
		segmenter.run(size, qr_coords)
		segmenter.generate_superpixel_image()
		plt.show()

class Segmenter:
	def __init__(self, image):
		self.image = image
		self.segments = None
		self.position_map = None
		self.qr_seg = None
		self.num_segments = None

	def run(self, num_segments, qr_coords):
		self.num_segments = num_segments
		segments = slic(self.image, n_segments = num_segments, sigma = 5)
		self.segments = segments
		#pprint(segments)
		#print(str(image))

		#first find qr code segment and specify
		self.qr_seg = segments[qr_coords[1]][qr_coords[0]]
		self.color_segment(self.qr_seg, [1, 0, 0])
		#self.clear_qr_segment(self.qr_seg)
		self.get_relative_position_map()
		#print(self.segments[622][340])

	def generate_superpixel_image(self):	 
		fig = plt.figure("Superpixels on %d segments" % (self.num_segments))
		ax = fig.add_subplot(1, 1, 1)
		ax.imshow(mark_boundaries(self.image, self.segments))
		for key in self.position_map:
			ax.text(self.position_map[key][1] + self.qr_seg_y, self.position_map[key][0] + self.qr_seg_x, str(key), color='white')
		plt.axis("off")
		#plt.show()

	def color_segment(self, qr_label, color_array):
		for i in range(0, len(self.image)):
			for j in range(0, len(self.image[0])):
				if self.segments[i][j] == qr_label:
					self.image[i][j] = color_array

	def get_relative_position_map(self):
		position_map = {}
		#sum pixel positions
		for i in range(0, len(self.segments)):
			for j in range(0, len(self.segments[0])):
				val = self.segments[i][j]
				if val in position_map:
					position_map[val] = tuple(map(sum, zip(position_map[val], (i, j, 1))))
				else:
					position_map[val] = (i, j, 1)
		#average pixel positions relative to qr_seg
		self.qr_seg_x = position_map[self.qr_seg][0] / position_map[self.qr_seg][2]
		self.qr_seg_y = position_map[self.qr_seg][1] / position_map[self.qr_seg][2]
		for key in position_map:
			position_map[key] = (position_map[key][0] / position_map[key][2] - self.qr_seg_x, position_map[key][1] / position_map[key][2] - self.qr_seg_y)
		self.position_map = position_map
		pprint(position_map)
		return position_map

class Matcher:

	def __init__(self, image1, image2, qr_coords, qr_coords_2):
		self.seg1 = Segmenter(image1)
		self.seg2 = Segmenter(image2)
		self.qr_coords = qr_coords
		self.qr_coords_2 = qr_coords_2

	def run_segmentation(self, num_segments):
		self.seg1.run(num_segments, self.qr_coords)
		self.seg2.run(num_segments+1, self.qr_coords_2) #hack for now

	def find_match(self, seg1_index):
		position1 = self.seg1.position_map[seg1_index]
		minimum = math.inf
		min_val = None
		for key in self.seg2.position_map:
			distance = math.sqrt(sum([(a - b) ** 2 for a, b in zip(position1, self.seg2.position_map[key])]))
			if distance < minimum:
				minimum = distance
				min_val = key
		return min_val

	def display_matches(self, coords):
		indeces = []
		for coord in coords:
			indeces.append(self.seg1.segments[coord[1]][coord[0]])
		seg2_indeces = []
		for index in indeces:
			seg2_indeces.append(self.find_match(index))
			self.seg1.color_segment(index, [0, 0, 0])
		for index in seg2_indeces:
			self.seg2.color_segment(index, [0, 0, 0])
		self.seg1.generate_superpixel_image()
		self.seg2.generate_superpixel_image()
		plt.show()


if __name__ == '__main__':
	main()