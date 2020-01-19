import cv2
import numpy as np
from random import randint
import sys
import matplotlib.pyplot as plt
from time import time

def get_random_color():
    return (randint(0,255),randint(0,255),randint(0,255))

def area_filtered_avg(areas, no_pass=1):
    avg_area = np.mean(areas)
    for i in range(no_pass):
        _areas = [x for x in areas if x > avg_area]
        avg_area = np.mean(_areas)
        areas = _areas
    return avg_area


def resize_image(image, max_width=1600, max_height=1200):
    h, w = image.shape[:2]
    width = 1600
    height = 1200
    ratio = h / w
    if ratio > 1:
        height = max_height
        width = int(height / ratio)
    else:
        width = max_width
        height = int(ratio * width)
    image = cv2.resize(image,(width, height))
    return image

def detect_pupil(image):
    t1 = time()
    image_out = image.copy()
    image_out = cv2.copyMakeBorder(image_out,10,10,10,10,cv2.BORDER_CONSTANT,value=(0,0,0))
    # image_out = cv2.GaussianBlur(image_out,(9,9),0)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (11, 11))
    out = cv2.cvtColor(image_out,cv2.COLOR_BGR2GRAY)
    out = cv2.Canny(out, 20, 50)
    out = cv2.morphologyEx(out,cv2.MORPH_DILATE, kernel)
    out = cv2.bitwise_not(out)

    out = cv2.threshold(out, 100, 255, cv2.THRESH_BINARY)[1]
    out = cv2.bitwise_not(out)
    _contours, hierarchy = cv2.findContours(out, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = []
    contour_areas = []
    h, w = out.shape[:2]
    min_h = (h/3)
    max_h = h - min_h
    print(min_h, max_h)
    fraction_area = h * w * .3
    print('fraction area', fraction_area)
    for contour in _contours:
        area = cv2.contourArea(contour)
        if area < fraction_area:
            contour_areas.append(area)
            contours.append(contour)
    avg_area = area_filtered_avg(contour_areas,1)
    print('average area', avg_area)
    center = [-1, -1]
    min_dis = 1600.0
    x_center = int(image.shape[1] / 2)
    y_center = int(image.shape[0] / 2)
    approx_cont = None
    for contour in contours:

        area = cv2.contourArea(contour)

        # extend = area / (bounding_box[2] * bounding_box[3])

        # # reject the contours with big extend
        # if area < avg_area:
        #     continue
        bounding_box = cv2.minAreaRect(contour)
        _min, _max = min(bounding_box[1]), max(bounding_box[1])
        ratio = _min/_max
        radius = (_min + _max) / 4
        if ratio < .9 or radius < 50 or radius > 500:
            continue

        # calculate countour center and draw a dot there
        color_yellow = (0,255,255)
        color_red = (0,0,255)
        # cv2.fillPoly(image_out, pts =[contour], color=(0,255,0))
        m = cv2.moments(contour)
        if m['m00'] != 0:
            _center = (int(m['m10'] / m['m00']), int(m['m01'] / m['m00']))
            if _center[1] < min_h or _center[1] > max_h:
                continue
            dist = cv2.norm((x_center, y_center), _center)
            if dist < min_dis:
                min_dis = dist
                center = _center
                approx_cont = contour

    if approx_cont is not None:
        x,y,w,h = cv2.boundingRect(approx_cont)
        x = x + int(w/2)
        y = y + int(h/2)
        center = (x, y)
        # cv2.circle(image_out, center, 5, color_red, -1)
        # cv2.drawMarker(image_out,center,color_yellow,cv2.MARKER_CROSS,400,1)

        # fit an ellipse around the contour and draw it into the image
        try:
            ellipse = cv2.fitEllipse(approx_cont)
            # cv2.ellipse(image_out, box=ellipse, color=color_red,thickness=2)
        except:
            pass
    t2 = time()
    time_taken = round(t2-t1, 3)
    print('time taken', t2 - t1)
    cv2.imwrite('out.png',out)
    cv2.imwrite('drawing.png',image_out)
    # show_image(image_out)
    return image_out, time_taken, center, image.shape[1], image.shape[0]


def show_image(img):
    scale_percent = 75 # percent of original size
    width = int(img.shape[1] * scale_percent / 100)
    height = int(img.shape[0] * scale_percent / 100)
    dim = (width, height)
    # resize image
    resized = cv2.resize(img, dim, interpolation = cv2.INTER_AREA)
    window = cv2.namedWindow('output',cv2.WINDOW_AUTOSIZE | cv2.WINDOW_GUI_EXPANDED)
    cv2.imshow('output', resized,)
    cv2.waitKey()
    cv2.destroyAllWindows()

def show_plot(image):
    image = cv2.cvtColor(image,cv2.COLOR_BGR2RGB)
    plot = plt.imshow(image)
    plt.show()
    

def main():
    filename = sys.argv[1]
    image = cv2.imread('samples/{}.JPG'.format(filename))
    out,_= detect_pupil(image)
    show_image(out)


if __name__ == "__main__":
    main()