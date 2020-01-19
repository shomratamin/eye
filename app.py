import os
from datetime import datetime
from flask import Flask, render_template, jsonify, redirect, url_for, request
from glob import glob
import cv2
from utils import detect_pupil, resize_image

app = Flask(__name__)
app.config.from_object(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'

ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg','PNG', 'JPG', 'JPEG']


@app.route('/')
def index():
    return render_template("index.html")


def detect(image_1):
    out_image = image_1 + "_out.jpg"
    
    if image_1 is None:
        return jsonify({"success": False, "message": "Please Upload Image !!"})


    _image = cv2.imread(image_1)
    # _image = cv2.resize(_image, (1600,1200))
    _image = resize_image(_image)
    out, _time, center, width, height = detect_pupil(_image)
    cv2.imwrite(out_image,out)
    out_image = out_image.replace('\\','/')
    if out_image[0] != '/':
        out_image = '/' + out_image

    return jsonify({"success": True,"time":_time, "image": out_image, 'center':center, 'width':width, 'height':height})

@app.route('/upload', methods=['POST'])
def upload():
    if request.method == 'POST':
        _file = request.files['image']
        if _file and allowed_file(_file.filename):
            now = datetime.now()
            filename = os.path.join(app.config['UPLOAD_FOLDER'], "%s.%s" % (now.strftime("%Y-%m-%d-%H-%M-%S-%f"), _file.filename.rsplit('.', 1)[1]))
            _file.save(filename)

            return detect(filename)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

@app.after_request
def add_header(r):
    """
    Add headers to both force latest IE rendering engine or Chrome Frame,
    and also to cache the rendered page for 10 minutes.
    """
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r

if __name__ == "__main__":
    app.run(host='0.0.0.0',port=8040, debug=True)
