#!/usr/bin/python3
from tkinter import *
from tkinter.filedialog import askopenfilename
from PIL import Image, ImageTk
import tkinter.simpledialog
from superpixels import Segmenter
from superpixels import get_matches
from skimage.util import img_as_float
import numpy as np

class MainWindow():

	def __init__(self, root):
		self.second_image_loaded = False
		self.display_segments = False
		self.root = root
		#Open File
		self.file = askopenfilename(parent=root, initialdir="../TestImages",title='Select an Author Image')
		original = Image.open(self.file)
		width, height = original.size
		self.height = height

		self.img = ImageTk.PhotoImage(original)
		self.floatimage = img_as_float(original)
		self.seg_img = None
		self.qrx = None
		self.qry = None
		self.colored_segments = {}

		self.canvas = Canvas(root, width=width, height=height)
		self.canvas.grid(row=0, column=0, rowspan=3)
		self.canvas_image = self.canvas.create_image(0, 0, image=self.img, anchor="nw")

		tkinter.messagebox.showinfo("Instructions", "Select a pixel in the upper left marker of the QR Code")
		self.canvas.bind("<Button 1>", self.getqrpixel)

		# Close the program
		b = Button(root, text="Exit", command=root.destroy)
		b.grid(row=0, column=1)	

		u = Button(root, text="Match", command=self.match_segments)
		u.grid(row=1, column=1)

	def getqrpixel(self, eventorigin):

		self.qrx = eventorigin.x
		self.qry = eventorigin.y
		print(self.qrx, self.qry)
		self.canvas.bind("<Button 1>",self.getclickedpixel)

		self.segmenter = Segmenter(self.floatimage, qr_coords=(self.qrx, self.qry))
		self.display_segments = True
		self.segmenter.draw_segments()
		self.update_canvas()

		t = Button(self.root, text="Toggle Segmentation", command=self.toggle_segmentation)
		t.grid(row=2, column=1)

	def getqrpixelmatch(self, eventorigin):
		
		self.qrx2 = eventorigin.x
		self.qry2 = eventorigin.y
		self.segmenter2 = Segmenter(self.floatimage_match, qr_coords=(self.qrx2, self.qry2))
		self.segmenter2.draw_segments()
		to_match, raw_to_match = self.segmenter.get_match_data(list(self.colored_segments.values()))

		#get rid of index
		to_match = [match[1:] for match in to_match] 
		matches = get_matches(self.segmenter2, to_match)
		for seg in matches:
			self.segmenter2.color_segment(seg)

		self.second_image_loaded = True
		self.update_canvas()


	def getclickedpixel(self, eventorigin):
	    x = eventorigin.x
	    y = eventorigin.y
	    segment = self.segmenter.segments[y][x]

	    if segment in self.colored_segments:
	    	self.colored_segments.pop(segment, None)
	    	self.segmenter.color_point((x, y), reset=True)
	    else:
	    	self.colored_segments[segment] = (x, y)
	    	self.segmenter.color_point((x, y), reset=False)

	    print(x, y)
	    self.update_canvas()

	def update_canvas(self):
		if not self.display_segments:
			self.canvas.itemconfig(self.canvas_image, image=self.img)
			if self.second_image_loaded:
				self.canvas_match.itemconfig(self.canvas_image_match, image=self.img_match)
		else:
			segmented_image = self.segmenter.display_image
			self.seg_img = ImageTk.PhotoImage(Image.fromarray(np.uint8(segmented_image*255)))

			self.canvas.itemconfig(self.canvas_image, image=self.seg_img)

			if self.second_image_loaded:
				segmented_image_match = self.segmenter2.display_image
				self.seg_img_match = ImageTk.PhotoImage(Image.fromarray(np.uint8(segmented_image_match*255)))

				self.canvas_match.itemconfig(self.canvas_image_match, image=self.seg_img_match)

	def match_segments(self):
		self.matchfile = askopenfilename(parent=self.root, initialdir="../TestImages",title='Select a User Image')
		original = Image.open(self.matchfile)
		width, height = original.size

		self.img_match = ImageTk.PhotoImage(original)
		self.floatimage_match = img_as_float(original)
		self.seg_img_match = None

		self.canvas_match = Canvas(self.root, width=width, height=height)
		self.canvas_match.grid(row=3, column=0, rowspan=3)
		self.canvas_image_match = self.canvas_match.create_image(0, 0, image=self.img_match, anchor="nw")

		tkinter.messagebox.showinfo("Instructions", "Select a pixel in the upper left marker of the QR Code")
		self.canvas_match.bind("<Button 1>", self.getqrpixelmatch)


	def toggle_segmentation(self):
		self.display_segments = not self.display_segments
		self.update_canvas()


def main():
	root = Tk()
	MainWindow(root)
	root.mainloop()

if __name__ == '__main__':
	main()