#!/usr/bin/python3
from skimage.segmentation import slic
from skimage.segmentation import mark_boundaries
import skimage.segmentation
from skimage.util import img_as_float
from skimage import io
from skimage import measure
from skimage import filters
from skimage import data
import matplotlib.pyplot as plt
import argparse
from scipy import ndimage as ndi
from skimage.feature import canny
from skimage import color
import numpy as np
import sys
from pprint import pprint
import math
import os


class Segmenter: #run superpixel segmentation on an image
	max_dist = 40
	kernel_size = 11

	def __init__(self, image, max_dist=40, qr_coords=(0, 0)):
		#original image
		self.image = image
		#modified image (segments colored in, etc)
		self.display_image = image
		#index matrix
		self.segments = None
		self.position_map = None
		self.qr_seg = None
		self.qr_coords = qr_coords
		self.max_dist = Segmenter.max_dist
		self.kernel_size = Segmenter.kernel_size

		#flags for extra features
		self.encode_color = False
		self.encode_intensity = False

		#segment and save to csv
		segments = skimage.segmentation.quickshift(self.image, kernel_size=self.kernel_size, max_dist=self.max_dist, ratio=0.5)
		self.segments = segments.astype(int)
		self.process_zeros()
		np.savetxt("index_matrix.csv", self.segments, delimiter=",", fmt="%d")

		#first find qr code segment and specify
		self.qr_seg = segments[qr_coords[1]][qr_coords[0]]

		#load maps to be used for matching
		self.get_relative_position_map()
		self.get_segment_size_map()

		if self.encode_color or self.encode_intensity:
			self.get_color_maps()

	#Scikit-image is inconsistent :( so this is needed
	def process_zeros(self):
		for i in range(0, len(self.segments)):
			self.segments[i] = [item + 1 for item in self.segments[i]]

	#---IO---
	def get_match_data(self, to_match=[]):
		segs = [self.segments[val[1]][val[0]] for val in to_match]
		seg_map = {}
		for seg in segs:
			seg_map[seg] = self.size_map[seg]
		#if no input file, dump whole map
		if len(seg_map.keys()) == 0:
			seg_map = self.size_map
		
		if self.encode_color:
			data = [[i, self.position_map[i][0], self.position_map[i][1], self.size_map[i], self.color_map[i][0], self.color_map[i][1], self.color_map[i][2]] for i in seg_map]
		elif self.encode_intensity:
			data = [[i, self.position_map[i][0], self.position_map[i][1], self.size_map[i], self.intensity_map[i]] for i in seg_map]
		else:
			data = [[i, self.position_map[i][0], self.position_map[i][1], self.size_map[i]] for i in seg_map]
		# don't write colors yet to raw_data, as this is used for the end-to-end system
		raw_data = [[i, self.raw_position_map[i][0], self.raw_position_map[i][1], self.raw_size_map[i]] for i in self.raw_size_map]
		return data, raw_data

	def save_match_data(self, to_match=[]):
		data, raw_data = self.get_match_data(to_match)
		np.savetxt("matching_data.csv", data, delimiter=",")
		np.savetxt("raw_matching_data.csv", raw_data, delimiter=",", fmt="%d")
		return data, raw_data

	#---Matching Methods---
	def get_segment_size_map(self):	
		size_map = {}
		for row in self.segments:
			for value in row:
				if value in size_map:
					size_map[value] += 1
				else:
					size_map[value] = 1
		#normalize values
		self.raw_size_map = {}
		total = len(self.segments) * len(self.segments[0])
		for key in size_map:
			self.raw_size_map[key] = int(size_map[key])
			self.size_map = int(size_map[key])
		self.size_map = size_map

	def get_relative_position_map(self):
		self.position_map = {}
		self.raw_position_map = {}
		segment_features = measure.regionprops(self.segments)
		for item in segment_features:
			self.position_map[item.label] = (item.centroid[1] - self.qr_coords[0], item.centroid[0] - self.qr_coords[1])
			self.raw_position_map[item.label] = (item.centroid[1], item.centroid[0])
		return self.position_map

	def get_color_maps(self):
		self.color_map = {}
		for i in range(0, len(self.segments)):
			for j in range(0, len(self.segments[0])):
				color = self.image[i][j]
				segment = self.segments[i][j]
				if segment in self.color_map:
					current_val = self.color_map[segment]
					self.color_map[segment] = (current_val[0]+ color[0], current_val[1]+color[1], current_val[2]+color[2], current_val[3]+1)
				else:
					self.color_map[segment] = (color[0], color[1], color[2], 1)
		self.intensity_map = {}
		for seg in self.color_map:
			current_val = self.color_map[seg]
			count = current_val[3]
			true_color = (current_val[0] / count, current_val[1] / count, current_val[2] / count)
			intensity = (true_color[0] + true_color[1] + true_color[2]) / 3
			self.color_map[seg] = true_color
			self.intensity_map[seg] = intensity

	#---Display Methods---
	def color_segment(self, target_segment, color_array=[0, 1, 0], alternate_image=None, reset=False):
		if alternate_image is not None:
			image = alternate_image
		else:
			image = self.display_image
		for i in range(0, len(image)):
			for j in range(0, len(image[0])):
				if self.segments[i][j] == target_segment:
					if reset:
						image[i][j] = self.image[i][j]
						#TODO: fix bug where reset removes boundaries
					else:
						image[i][j] = color_array

	def color_point(self, point, color_array=[0, 1, 0], reset=False):
		self.color_segment(self.segments[point[1]][point[0]], color_array, reset=reset)

	def generate_mask(self, targets):
		image_mask = np.zeros((len(self.image), len(self.image[0]), len(self.image[0][0])))
		#print(str(targets))
		for target in targets:
			self.color_segment(self.segments[target[1]][target[0]], [1, 1, 1], image_mask)
		self.display_image = image_mask
		return image_mask

	#Note: ids is a list of lists, where each list of ids is a keyframe
	def generate_mask_seg_ids(self, ids, should_display=False, output_name="output"): 
		if should_display:
			image_mask = np.zeros((len(self.image), len(self.image[0]), len(self.image[0][0])))
			#print(str(targets))
			for seg_id in ids:
				self.color_segment(seg_id, [1, 1, 1], image_mask)
			self.display_image = image_mask
			return image_mask
		else:
			for i, seg_id_list in enumerate(ids):
				image_mask = np.zeros((len(self.image), len(self.image[0]), len(self.image[0][0])))
				for seg_id in seg_id_list:
					self.color_segment(seg_id, [1, 1, 1], image_mask)
				setup_image_plot(image_mask, "Mask")
				plt.savefig(output_name + "_" + str(i) + ".png")
				plt.clf()

	def draw_segments(self, targets=[]):	 
		for target in targets:
			self.color_segment(self.segments[target[1]][target[0]], [0, 1, 0])
		return_image = mark_boundaries(self.display_image, self.segments)
		self.display_image = return_image
		return return_image

class Matcher: #match segments between images

	def __init__(self, image1, image2, qr_coords, qr_coords_2, should_display):
		self.seg1 = Segmenter(image1)
		self.seg2 = Segmenter(image2)
		self.qr_coords = qr_coords
		self.qr_coords_2 = qr_coords_2
		self.should_display = should_display

	def run_segmentation(self, num_segments):
		if num_segments == None:
			num_segments = Segmenter.max_dist
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
		seg2_indeces = get_matches(self.seg2, indeces)

		for index in indeces:
			self.seg1.color_segment(index, [0, 0, 0])
		for index in seg2_indeces:
			self.seg2.color_segment(index, [0, 0, 0])

		self.seg1.draw_segments()
		self.seg2.draw_segments()
		if self.should_display:
			plt.show()

#---Util---

#Adds a new plot for a given image
#You still need to call plt.show() after setting up multiple plots
def setup_image_plot(image, plot_name, segmenter=None): 
	fig = plt.figure(plot_name)
	ax = plt.Axes(fig, [0., 0., 1., 1.])
	ax.imshow(image)
	# comment out for now since segment count is much higher and this is very slow
	if segmenter:
		for key in segmenter.position_map:
			ax.text(segmenter.position_map[key][0], segmenter.position_map[key][1], str(key), color='white')
	ax.set_axis_off()

	fig.add_axes(ax)

def get_matches(segmenter, to_match):
	size_weight = .01
	color_weight = 256
	use_intensity = segmenter.encode_intensity
	use_color = segmenter.encode_color
	print(str(to_match))
	matches = []
	for row in to_match:
		minimum = math.inf
		min_val = None
		row[2] = row[2] * size_weight
		if use_intensity:
			row[4] = row[4] * color_weight
		elif use_color:
			for i in range(3, 6):
					row[i] = row[i] * color_weight
		for key in segmenter.position_map:
			own_row = [segmenter.position_map[key][0], segmenter.position_map[key][1], segmenter.size_map[key] * size_weight]
			if use_intensity:
				own_row.append(segmenter.intensity_map[key]*color_weight)
			elif use_color:
				color = segmenter.color_map[key]
				own_row += list(color)
				for i in range(3, 6):
					own_row[i] = own_row[i] * color_weight
			
			distance = sum([(a - b) ** 2 for a, b in zip(row, own_row)])

			#Don't double match
			if distance < minimum and key not in matches:
				minimum = distance
				min_val = key
				print(str(list(zip(row, own_row))) + " " + str(distance))
		matches.append(min_val)
		print("matched " + str(row) +" ("+ str(min_val)+") to " + str(segmenter.position_map[min_val]))

	return matches

def main():
	ap = argparse.ArgumentParser()
	ap.add_argument("-i", "--image", required = True)
	ap.add_argument("-i2", "--image2", required = False)
	ap.add_argument("-s", "--size", required = False)
	ap.add_argument("-d", "--data", required = False)
	ap.add_argument("-di", "--display", required = False, action='store_true')
	ap.add_argument("-m", "--mask", required = False, action='store_true')
	ap.add_argument("-q", "--qrcoords", required = False)
	args = vars(ap.parse_args())
	
	if args["data"] != None:
		file = open(args["data"], "r")
		lines = file.read().split("\n")
		data = [list(map(float, line.split())) for line in lines]
	else:
		data = None

	if args["qrcoords"] != None:
		file = open(args["qrcoords"], "r")
		qr_coords = list(map(int, file.read().split()))
		qr_coords = (qr_coords[0], qr_coords[1])
	else:
		qr_coords = (0, 0)

	if args["display"]:
		should_display = True
	else:
		should_display = False

	image = img_as_float(io.imread(args["image"]))
	file_name = os.path.split(args["image"])[1].split(".")[0]

	if args["size"] != None:
		size = int(args["size"])
	else:
		size = None

	if args["image2"] != None:
		image2 = img_as_float(io.imread(args["image2"]))
		#Run matching between image and image2
		#data is qrx qry qr2x qr2y dx dy ...	
		qr_coords_2 = (data[2], data[3])
		iterator = iter(data[4:])
		to_match = list(zip(iterator, iterator))
		matcher = Matcher(image, image2, qr_coords, qr_coords_2, should_display)
		matcher.run_segmentation(size)
		matcher.display_matches(to_match)

	else:
		#Just run segmentation on image
		segmenter = Segmenter(image, size, qr_coords=qr_coords)
		segmenter.save_match_data()

		input_array = []

		if data: #we have data, so we are in user mode
			rois = []
			keyframes = []
			for i, full_row in enumerate(data[2:]):
				if len(full_row) > 0:
					num_segs = int(full_row[0])
					for i in range(0, num_segs):
						rois.append(full_row[i*3+1:i*3+4])
					keyframes.append(num_segs)

			matches = get_matches(segmenter, rois)		
			index = 0
			keyframe_matches = []
			for num_segs in keyframes:
				keyframe_matches.append(matches[index:index+num_segs])
				index += num_segs

			if args["mask"]:
				segmenter.generate_mask_seg_ids(keyframe_matches, should_display, file_name)
			else:
				for match in matches:
					#print("coloring: "+ str(match))
					segmenter.color_segment(match, [0, 1, 0])
				segmenter.draw_segments()

		else: #we have only the single line, so we are in author mode
			if args["mask"]:
				segmenter.generate_mask()
			else:
				segmenter.draw_segments()

		setup_image_plot(segmenter.display_image, "Segmented Image", segmenter)
		if should_display:
			plt.show()
		else:
			if not args["mask"]:
				plt.savefig("output.png")	
		
if __name__ == '__main__':
	main()