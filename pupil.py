import cv2
import numpy as np
from glob import glob

def resize_scaled(image, max_size=224):
    h, w = image.shape[:2]
    if h > w:
        if w % 2 != 0:
            w = w + 1
        padding =  (h - w)//2
        image = cv2.copyMakeBorder(image,0,0,padding,padding,cv2.BORDER_CONSTANT,value=(0,0,0))
        image = cv2.resize(image, (max_size, max_size))
    elif w > h:
        if h % 2 != 0:
            h = h + 1
        padding =  (w - h)//2
        image = cv2.copyMakeBorder(image,padding,padding,0,0,cv2.BORDER_CONSTANT,value=(0,0,0))
        image = cv2.resize(image, (max_size, max_size))
    elif h == w:
        image = cv2.resize(image, (max_size, max_size))

    return image


if __name__ == "__main__":
    images = glob('images/*.jpg')
    for i, im in enumerate(images):
        image = cv2.imread(im)
        image = resize_scaled(image)
        cv2.imwrite(f'out/{i}.jpg', image)