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
	ap.add_argument("-d", "--data", required = False)
	ap.add_argument("-p", "--polygon", required = False, action='store_true')
	ap.add_argument("-o", "--output", required = False, action='store_true')
	ap.add_argument("-di", "--display", required = False, action='store_false')
	ap.add_argument("-m", "--mask", required = True, action='store_true')
	args = vars(ap.parse_args())
	
	if "data" in args and args["data"] != None:
		file = open(args["data"], "r")
		data = file.read().split()
		data = list(map(int, data))
	else:
		data = [0, 0]
	print(str(args))
	if "display" in args and args["display"] != None:
		should_display = True
	else:
		should_display = False
	print(str("display" in args))

	qr_coords = (data[0], data[1])

	image = img_as_float(io.imread(args["image"]))
	#run_open_cv(image)
	if "size" in args and args["size"]:
		size = int(args["size"])
	else:
		size = 100
	if args["polygon"]:
		#Run match segments to polygon
		num_levels = data[2]
		test_set = []
		for i in range(3, num_levels+3):
			test_set.append(int(data[i]))
		to_match = []
		index = 3 + num_levels
		while index < len(data):
			to_match.append((data[index], data[index+1]))
			index += 2
		leveler = Leveler(image, qr_coords, should_display)
		leveler.find_level_and_segments(to_match, test_set)
	elif args["image2"]:

		image2 = img_as_float(io.imread(args["image2"]))
		#Run matching between image and image2

		#superpixel_level = int(len(image) / size)
		#print(superpixel_level)

		#data is qrx qry qr2x qr2y dx dy ...
		
		qr_coords_2 = (data[2], data[3])
		index = 4
		to_match = []
		while index < len(data):
			to_match.append((data[index], data[index+1]))
			index += 2

		matcher = Matcher(image, image2, qr_coords, qr_coords_2, should_display)
		matcher.run_segmentation(size)
		matcher.display_matches(to_match)

	else:
		#Just run segmentation on image
		#data is qrx qry
		segmenter = Segmenter(image)
		segmenter.run(size, qr_coords)
		index = 2
		to_match = []
		while index < len(data):
			to_match.append((data[index], data[index+1]))
			index += 2
		if args["mask"] != None:
			segmenter.generate_mask(to_match)
		else:
			segmenter.generate_superpixel_image()
		if args["output"] != None:
			plt.savefig("output.png")
		if should_display:
			plt.show()

class Segmenter: #run superpixel segmentation on an image
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

	def generate_mask(self, targets):
		image_mask = np.zeros((len(self.image), len(self.image[0]), len(self.image[0][0])))
		#print(str(targets))
		for target in targets:
			#fix this
			#print(str(self.position_map[target[1]][target[0]]))
			self.color_segment(self.segments[target[1]][target[0]], [1, 1, 1], image_mask)
		fig = plt.figure("Mask on %d segments" % (self.num_segments))
		ax = fig.add_subplot(1, 1, 1)
		ax.imshow(image_mask)
		plt.axis("off")

	def color_segment(self, qr_label, color_array, alternate_image=None):
		if alternate_image is not None:
			image = alternate_image
		else:
			image = self.image
		for i in range(0, len(image)):
			for j in range(0, len(image[0])):
				if self.segments[i][j] == qr_label:
					image[i][j] = color_array

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

class Matcher: #match segments between images

	def __init__(self, image1, image2, qr_coords, qr_coords_2, should_display):
		self.seg1 = Segmenter(image1)
		self.seg2 = Segmenter(image2)
		self.qr_coords = qr_coords
		self.qr_coords_2 = qr_coords_2
		self.should_display = should_display

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
		if self.should_display:
			plt.show()

class Leveler: #find superpixel level which matches given polygon well

	def __init__(self, image, qr_coords, should_display):
		self.image = image
		self.qr_coords = qr_coords
		self.should_display = should_display

	def find_level_and_segments(self, polygon_coords, test_set):

		seg = Segmenter(self.image)
		for num in test_set:
			seg.run(num, self.qr_coords)
			matched_segments = set()
			for pair in polygon_coords:
				matched_segments.add(seg.segments[pair[1]][pair[0]])
				#TODO: find matches in the middle of grouping

			for segment in matched_segments:
				seg.color_segment(segment, [0, 1, 0])
			seg.generate_superpixel_image()
		if self.should_display:
			plt.show()
		
if __name__ == '__main__':
	main()