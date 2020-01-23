/*
Author: Shomrat Amin
Email: shomrattm@gmail.com

*/
//EyeBoard is the class for managing drawing canvas and doing all the calculations
function EyeBoard(container = 'main-canvas') {
  //define default values
  this.height = 610;
  this.width = 810;
  this.orig_height = 1220;
  this.orig_width = 1620;
  this.offset_x = 0;
  this.offset_y = 0;
  this.scale = 0.5;
  this.container = container;
  this.layers = {}
  this.white_to_white_pixels = -1;
  this.white_to_white_pixels_original = -1;
  this.white_to_white_mm = -1;
  this.can_update_poly = true;
  this.initial_white_to_white = []
  this.original_ref_center = [-1, -1]
  this.original_pupil_center_radius = -1
  this.current_ref_center = [-1, -1]
  this.current_pupil_center_radius = this.original_pupil_center_radius
  this.is_white_to_white_dragging = false
  this.white_tot_white_transform = 'undefined'
  this.circle_transform = 'undefined'
  this.tooltip_visible = true
  this.sim_k1 = 'undefined'
  this.sim_k2 = 'undefined'

  this.line_layers = {}
  this.lines = {}

  this.circle_layers = {}
  this.circles = {}
  this.circle_centers = {}

  this.polygon_layers = {}
  this.polygons = {}
  let board = this;

  //set original image width and height
  this.set_orig_width_height = function (w, h) {
    this.orig_width = w;
    this.orig_height = h;
    this.offset_x = (this.width - (this.orig_width * this.scale)) / 2
    this.offset_y = (this.height - (this.orig_height * this.scale)) / 2
  }

  this.stage = new Konva.Stage({
    container: this.container,
    width: this.width,
    height: this.height
  });

  this.layers['image_layer'] = new Konva.Layer({ clearBeforeDraw: true });
  this.layers['pupil_circle_layer'] = new Konva.Layer({ clearBeforeDraw: true });

  //clear the canvas
  this.clear_canvas = function (all = true) {
    for (let key in this.line_layers) {
      if (this.line_layers.hasOwnProperty(key)) {
        if (all === false && key.indexOf('_0') === -1) {
          this.line_layers[key].remove()
          delete this.line_layers[key]
        }
        else if (all === true) {
          this.line_layers[key].remove()
          delete this.line_layers[key]
        }
      }
    }
    for (let key in this.circle_layers) {
      if (this.circle_layers.hasOwnProperty(key)) {
        if (all === false && key.indexOf('_0') === -1) {
          this.circle_layers[key].remove()
          delete this.circle_layers[key]
        }
        else if (all === true) {
          this.circle_layers[key].remove()
          delete this.circle_layers[key]
        }
      }
    }
    for (let key in this.polygon_layers) {
      if (this.polygon_layers.hasOwnProperty(key)) {
        this.polygon_layers[key].remove()
        delete this.polygon_layers[key]
      }
    }

    if (all === true) {
      this.line_layers = {}
      this.lines = {}

      this.circle_layers = {}
      this.circles = {}
      this.circle_centers = {}
    }
    this.polygon_layers = {}
    this.polygons = {}

    // this.current_ref_center = this.original_ref_center
    // this.current_pupil_center_radius = this.original_pupil_center_radius

  }

  this.get_ref_circle_center = function (circle_index = 0) {
    let circle_key = `circle_${circle_index}`
    if (!(circle_key in this.circle_centers)) {
      return false
    }

    let cx = this.circle_centers[circle_key].getAttr('x')
    let cy = this.circle_centers[circle_key].getAttr('y')
    cx = cx - this.offset_x
    cy = cy - this.offset_y
    cx = cx / this.scale
    cy = cy / this.scale

    let new_origin = [cx, cy]

    return new_origin
  }

  this.change_lines_origin = function () {
    let circle_key = `circle_0`
    if (!(circle_key in this.circle_centers)) {
      return
    }

    let cx = this.circle_centers[circle_key].getAttr('x')
    let cy = this.circle_centers[circle_key].getAttr('y')
    let new_origin = [cx, cy]

    for (let key in this.lines) {
      if (this.lines.hasOwnProperty(key)) {
        let index = key.split('_')
        index = index[index.length - 1]
        if (index != 0) {
          this.change_line_origin(new_origin, index)
        }
      }
    }

    let new_ref = this.get_ref_circle_center()
    if (new_ref !== false) {
      this.current_ref_center = new_ref
    }
  }

  this.change_line_origin = function (new_origin, line_index) {
    let line_key = `line_${line_index}`
    let points = this.lines[line_key].getAttr('points')
    let point_location = [points[2], points[3]]

    let result = this.calculate_distance(new_origin, point_location, false, true, false, line_index)
    this.add_line_index_text(point_location, line_index, line_index)
    $(`#distance_${line_index}`).text(result.distance)
    $(`#angle_${line_index}`).text(result.angle)
    $(`#angle2_${line_index}`).text(result.angle2)
  }

  this.clear_line_layer = function (line_index) {
    let layer_key = `distance_line_layer_${line_index}`
    this.line_layers[layer_key].clear()
  }

  this.change_line_opacity = function (line_index, value) {
    let layer_key = `distance_line_layer_${line_index}`
    this.line_layers[layer_key].opacity(value)
    this.line_layers[layer_key].draw()
  }

  // this.draw_pupil_circle = function () {
  //   let circle = new Konva.Circle({
  //     x: this.stage.width() / 2,
  //     y: this.stage.height() / 2,
  //     radius: 70,
  //     fill: 'red',
  //     stroke: 'black',
  //     strokeWidth: 4
  //   });
  //   this.layers['pupil_circle_layer'] = new Konva.Layer({ clearBeforeDraw: true });
  //   this.layers['pupil_circle_layer'].add(circle)

  // }

  this.draw_image = function (image_url) {
    if (!this.layers.hasOwnProperty('image_layer')) {
      this.layers['image_layer'] = new Konva.Layer({ clearBeforeDraw: true });
    }
    else {
      this.clear_canvas()
      this.layers['image_layer'].remove()
      this.layers['image_layer'] = new Konva.Layer({ clearBeforeDraw: true });
    }
    let _image_layer = this.layers['image_layer'];
    let _stage = this.stage;
    let _scale = this.scale
    let _offset_x = this.offset_x;
    let _offset_y = this.offset_y;
    Konva.Image.fromURL(image_url, function (darthNode) {
      darthNode.setAttrs({
        x: _offset_x,
        y: _offset_y,
        scaleX: _scale,
        scaleY: _scale
      });
      _image_layer.add(darthNode);
      _image_layer.batchDraw();
    });
  }

  this.repaint = function () {
    this.stage.clear()
    this.stage.add(this.layers['image_layer'])
    // this.stage.add(this.layers['distance-line-layer'])

    // this.stage.add(this.layers['pupil_circle_layer']);

  }

  this.repaint()

  this.remove_line_layer = function (line_index) {
    let line_key = `line_${line_index}`
    let layer_key = `distance_line_layer_${line_index}`
    this.line_layers[layer_key].remove()
    delete this.line_layers[layer_key]
    delete this.lines[line_key]
  }

  this.add_line_layer = function (line_index = 1, points = [0, 0, 0, 0]) {
    let line_key = `line_${line_index}`
    let layer_key = `distance_line_layer_${line_index}`

    if (line_key in this.lines) {
      if (this.line_layers.hasOwnProperty(layer_key)) {
        return
      }
    }
    let stroke_width = 2
    if (line_index == 0) {
      stroke_width = 3
    }
    let line = new Konva.Line({
      points: points,
      stroke: 'white',
      strokeWidth: stroke_width,
      lineCap: 'round',
      lineJoin: 'round'
    });
    if (line_index == 0) {
      let tr = new Konva.Transformer({ rotateEnabled: false, enabledAnchors: ['middle-left', 'middle-right'], anchorSize: 14, borderEnabled: false, anchorFill: "rgba(255, 255, 255, 0)" })
      this.white_tot_white_transform = tr
      line.draggable(true)
      line.on('mouseover', function () {
        if (line.draggable()) {
          $('#main-canvas').removeClass();
          $('#main-canvas').addClass('move_cursor');

        }
      });
      line.on('mouseout', function () {
        if (line.draggable()) {
          $('#main-canvas').removeClass();
          $('#main-canvas').addClass('custom_cross_cursor')
        }
      });
      line.on('dragstart', function () {
        board.is_white_to_white_dragging = true
        board.tooltip_visible = false
      })
      line.on('dragend', function () {
        board.is_white_to_white_dragging = false
        let x = line.x()
        let y = line.y()
        let points = line.points()
        points = [points[0] + x, points[1] + y, points[2] + x, points[3] + y]
        line.points(points)
        line.x(0)
        line.y(0)
        board.tooltip_visible = true
      });
      line.on('dragmove', function () {
        board.is_white_to_white_dragging = true
      });

      line.on('transformstart', function () {
        board.is_white_to_white_dragging = true
        board.tooltip_visible = false
      });
      line.on('transformend', function () {
        board.white_to_white_pixels = board.white_to_white_pixels_original * board.lines["line_0"].scaleX()
        board.is_white_to_white_dragging = true
        board.tooltip_visible = true
      });
    }
    this.lines[line_key] = line
    this.line_layers[layer_key] = new Konva.Layer({ clearBeforeDraw: true });
    this.line_layers[layer_key].add(this.lines[line_key])
    if (line_index === 0) {
      this.line_layers[layer_key].add(this.white_tot_white_transform)
      this.white_tot_white_transform.attachTo(this.lines[line_key])
    }
    this.stage.add(this.line_layers[layer_key])
  }

  this.toggle_draggable = function (type = 'circle', index = 0, value = 'undefined') {
    if (type === 'circle') {
      let circle_key = `circle_${index}`
      if (!this.circles.hasOwnProperty(circle_key))
        return;
      this.circles[circle_key].draggable(!this.circles[circle_key].draggable())
      if (value !== 'undefined') {
        this.circles[circle_key].draggable(value)
      }
    }
    else if (type === 'line') {
      let line_key = `line_${index}`
      if (!this.lines.hasOwnProperty(line_key))
        return;
      this.lines[line_key].draggable(!this.lines[line_key].draggable())
      if (value !== 'undefined') {
        if (value === false && this.lines[line_key].draggable()) {
          this.lines[line_key].draggable(false)
        }
        else if (value === true && !this.lines[line_key].draggable()) {
          this.lines[line_key].draggable(true)
        }
      }
    }
  }
  this.stretch_white_to_white = function (side, x_distance) {
    let line_key = `line_0`
    let layer_key = `distance_line_layer_0`
    if (!this.lines.hasOwnProperty(line_key))
      return;
    let points = this.lines[line_key].points()
    if (side === 'left') {
      let point_x = points[0] + x_distance
      points[0] = point_x
    }
    else if (side === 'right') {
      let point_x = points[2] + x_distance
      points[2] = point_x
    }
    this.lines[line_key].points(points)
    this.line_layers[layer_key].draw()

  }
  this.get_white_to_white_control = function (mouse_xy) {
    let line_key = `line_0`
    let layer_key = `distance_line_layer_0`
    if (!this.lines.hasOwnProperty(line_key))
      return false;

    let points = this.lines[line_key].points()
    let point_y = points[3] + this.lines[line_key].y()
    let point_left_x = points[0] + this.lines[line_key].x()
    let point_right_x = points[2] + this.lines[line_key].x()
    let point_center_x = point_left_x + ((point_right_x - point_left_x) / 2)
    let mouse_x = mouse_xy[0]
    let mouse_y = mouse_xy[1]
    if (Math.abs(mouse_y - point_y) > 2)
      return false;
    if (point_left_x >= mouse_x - 1) {
      return 'left'
    }
    else if (point_right_x <= mouse_x - 1) {
      return 'right'
    }
    else {
      return 'drag'
    }
  }

  this.add_circle_layer = function (circle_index = 0, init = false) {
    let circle_key = `circle_${circle_index}`
    let circle_layer_key = `circle_layer_${circle_index}`

    if (circle_key in this.circles) {
      return
    }

    let circle = new Konva.Circle({
      radius: 1,
      stroke: 'white',
      strokeWidth: 2
    })

    let circle_layer = new Konva.Layer({ clearBeforeDraw: true });

    let tr = new Konva.Transformer({ rotateEnabled: false, centeredScaling: true, enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], borderEnabled: false })
    this.circle_transform = tr
    // add cursor styling
    circle.on('mouseover', function () {
      if (circle.draggable()) {
        $('#main-canvas').removeClass();
        $('#main-canvas').addClass('move_cursor');
      }
    });
    circle.on('mouseout', function () {
      if (circle.draggable()) {
        $('#main-canvas').removeClass();
        $('#main-canvas').addClass('custom_cross_cursor')
      }
    });

    circle.on('dragstart', function () {
      board.tooltip_visible = false
    })

    circle.on('dragmove', function () {
      board.draw_circle_center(false, circle_index)
      board.change_lines_origin()
    });
    circle.on('dragend', function () {
      board.draw_circle_center(false, circle_index)
      board.change_lines_origin()
      board.tooltip_visible = true
    });
    circle.on('transformstart', function () {
      board.tooltip_visible = false
    });
    circle.on('transformend', function () {
      board.tooltip_visible = true
    });

    this.circles[circle_key] = circle
    this.circle_layers[circle_layer_key] = circle_layer
    this.circle_layers[circle_layer_key].add(circle)
    this.circle_layers[circle_layer_key].add(tr)
    tr.attachTo(this.circles[circle_key])
    // this.circle_layers[circle_layer_key].draw()
    this.stage.add(this.circle_layers[circle_layer_key])
    this.circle_layers[circle_layer_key].zIndex(2)

    if (init !== false) {
      let center = init

      let center_x = center[0];
      let center_y = center[1];
      center_x = center[0] * this.scale;
      center_y = center[1] * this.scale;


      center_x = center_x + this.offset_x;
      center_y = center_y + this.offset_y;

      center = [center_x, center_y]
      let point = [center[0] + 40, center[1] + 40]
      this.draw_circle(center, point)
    }

  }

  this.add_line_index_text = function (point = false, text, line_index) {
    if (point === false) {
      let line_key = `line_${line_index}`
      let points = this.lines[line_key].getAttr('points')
      point = [points[2], points[3]]
    }
    var line_text = new Konva.Text({
      x: point[0] + 5,
      y: point[1],
      text: text,
      fontSize: 24,
      fontStyle: 'bold',
      fontFamily: 'Calibri',
      fill: 'white'
    });

    let layer_key = `distance_line_layer_${line_index}`
    this.line_layers[layer_key].add(line_text)
    this.line_layers[layer_key].draw()
  }

  this.add_polygon_layer = function (polygon_index = 0) {
    let polygon_key = `polygon_${polygon_index}`
    let polygon_layer_key = `polygon_layer_${polygon_index}`

    if (polygon_key in this.polygons) {
      return
    }

    let poly = new Konva.Line({
      points: [],
      fill: 'rgba(0,210,255, .28)',
      stroke: 'white',
      strokeWidth: 2,
      closed: true,
      draggable: false
    });
    // poly.on('mouseover', function () {
    //   if (poly.draggable()) {
    //     board.can_update_poly = false;
    //     $('#main-canvas').removeClass();
    //     $('#main-canvas').addClass('move_cursor');
    //   }
    // });
    // poly.on('mouseout', function () {
    //   board.can_update_poly = true;
    //   $('#main-canvas').removeClass();
    //   $('#main-canvas').addClass('custom_cross_cursor')
    // });
    this.polygons[polygon_key] = poly
    this.polygon_layers[polygon_layer_key] = new Konva.Layer({ clearBeforeDraw: true });
    this.polygon_layers[polygon_layer_key].add(this.polygons[polygon_key])
    this.stage.add(this.polygon_layers[polygon_layer_key])
    this.polygon_layers[polygon_layer_key].zIndex(1)

  }

  this.get_polygon_points_count = function (polygon_index = 0) {

    let polygon_key = `polygon_${polygon_index}`

    if (!(polygon_key in this.polygons)) {
      return false
    }

    let points = this.polygons[polygon_key].getAttr('points')

    return points.length

  }

  this.translate_coordinate = function (point) {
    let x = point[0]
    let y = point[1]
    x = x * this.scale
    y = y * this.scale
    x = x + this.offset_x
    y = y + this.offset_y

    return [x, y]
  }
  this.draw_circle = function (center, point, circle_index = 0) {
    let circle_key = `circle_${circle_index}`
    let circle_layer_key = `circle_layer_${circle_index}`

    if (center === false) {
      center = [this.circles[circle_key].getAttr('x'), this.circles[circle_key].getAttr('y')]
    }
    else {
      this.draw_circle_center(center, circle_index)
    }

    let distance = Math.sqrt(((point[0] - center[0]) * (point[0] - center[0])) + ((point[1] - center[1]) * (point[1] - center[1])))
    if (distance < 0) {
      distance = 1
    }

    this.circle_layers[circle_layer_key].clear()
    this.circles[circle_key].setAttr('x', center[0])
    this.circles[circle_key].setAttr('y', center[1])
    this.circles[circle_key].setAttr('radius', distance)
    this.circle_layers[circle_layer_key].draw()

  }


  this.draw_circle_center = function (center = false, circle_index = 0) {
    let circle_key = `circle_${circle_index}`
    let circle_layer_key = `circle_layer_${circle_index}`
    if (!(circle_key in this.circle_centers)) {
      let circle = new Konva.Circle({
        radius: 2,
        stroke: 'white',
        strokeWidth: 0,
        fill: 'white'
      })
      this.circle_centers[circle_key] = circle
      if (center === false) {
        center = [this.circles[circle_key].getAttr('x'), this.circles[circle_key].getAttr('y')]
      }
      this.circle_layers[circle_layer_key].add(this.circle_centers[circle_key])
      this.circle_centers[circle_key].setAttr('x', center[0])
      this.circle_centers[circle_key].setAttr('y', center[1])
      this.circle_layers[circle_layer_key].draw()
    }
    else {
      if (center === false) {
        center = [this.circles[circle_key].getAttr('x'), this.circles[circle_key].getAttr('y')]
      }
      this.circle_centers[circle_key].setAttr('x', center[0])
      this.circle_centers[circle_key].setAttr('y', center[1])
      this.circle_layers[circle_layer_key].draw()
    }
  }

  this.sort_coordinates = function (coords) {
    let sorted_coords = []
    let points = []
    for (let i = 0; i < coords.length - 1; i += 2) {
      let _coord = {}
      _coord.x = coords[i]
      _coord.y = coords[i + 1]
      points.push(_coord)
    }
    points.sort((a, b) => a.y - b.y)
    const cy = (points[0].y + points[points.length - 1].y) / 2
    points.sort((a, b) => b.x - a.x)
    const cx = (points[0].x + points[points.length - 1].x) / 2
    const center = { x: cx, y: cy }
    var startAng;
    points.forEach(point => {
      var ang = Math.atan2(point.y - center.y, point.x - center.x)
      if (!startAng) { startAng = ang }
      else {
        if (ang < startAng) {  // ensure that all points are clockwise of the start point
          ang += Math.PI * 2;
        }
      }
      point.angle = ang; // add the angle to the point
    });


    // Sort clockwise;
    points.sort((a, b) => a.angle - b.angle);

    for (var i = 0; i < points.length; i++) {
      let point = points[i]
      sorted_coords.push(point.x)
      sorted_coords.push(point.y)
    }

    return sorted_coords
  }

  this.area_from_coords = function (coords) {
    var _scale = 1.0
    if (this.white_to_white_mm !== -1) {
      _scale = this.white_to_white_mm / this.white_to_white_pixels
    }
    var area = 0

    if (coords.length % 2) return -1


    for (let i = 0; i < coords.length - 3; i += 2) {
      let x = coords[i]
      let y = coords[i + 1]
      let x1 = coords[i + 2]
      let y1 = coords[i + 3]
      let a = (x * y1 - y * x1) * _scale * _scale
      area = area + a
    }
    return Math.abs(area / 2)
  }

  this.calculate_triangle_area = function (a, b, c) {
    let ab = Math.sqrt(((a[0] - b[0]) * (a[0] - b[0])) + ((a[1] - b[1]) * (a[1] - b[1])))
    let bc = Math.sqrt(((b[0] - c[0]) * (b[0] - c[0])) + ((b[1] - c[1]) * (b[1] - c[1])))
    let ca = Math.sqrt(((c[0] - a[0]) * (c[0] - a[0])) + ((c[1] - a[1]) * (c[1] - a[1])))

    if (this.white_to_white_mm !== -1) {
      ab = ab * (this.white_to_white_mm / this.white_to_white_pixels)
      bc = bc * (this.white_to_white_mm / this.white_to_white_pixels)
      ca = ca * (this.white_to_white_mm / this.white_to_white_pixels)
    }

    let p = (ab + bc + ca) / 2

    let area = Math.sqrt(p * (p - ab) * (p - bc) * (p - ca))

    return area
  }

  this.calculate_area = function (point, insert_point = false, is_init = false, polygon_index = 0) {
    let polygon_key = `polygon_${polygon_index}`
    let polygon_layer_key = `polygon_layer_${polygon_index}`

    this.polygon_layers[polygon_layer_key].clear()
    let points = this.polygons[polygon_key].getAttr('points')

    if (is_init === true) {
      points = []
    }
    points.push(point[0])
    points.push(point[1])
    points = this.sort_coordinates(points)
    let _points = points
    _points.push(points[0])
    _points.push(points[1])
    let area = this.area_from_coords(_points)
    // let points_count = points.length
    // if (points_count >= 6) {
    //   for (let i = 0; i < points_count - 5; i += 2) {
    //     let a = [points[i], points[i+1]]
    //     let b = [points[i+2], points[i+3]]
    //     let c = [points[i+4], points[i+5]]
    //     let _area = this.calculate_triangle_area(a, b, c)
    //     area += _area
    //   }
    // }

    this.polygons[polygon_key].setAttr('points', points)
    this.polygon_layers[polygon_layer_key].draw()

    return area.toFixed(4)

  }

  this.calculate_distance = function (center, point, scaled = true, mm = true, correct_offset = true, line_index = 1) {

    let line_key = `line_${line_index}`
    let layer_key = `distance_line_layer_${line_index}`

    let center_x = center[0];
    let center_y = center[1];
    if (scaled === true) {
      center_x = center[0] * this.scale;
      center_y = center[1] * this.scale;
    }
    if (correct_offset === true) {
      center_x = center_x + this.offset_x;
      center_y = center_y + this.offset_y;
    }
    let distance = Math.sqrt(((point[0] - center_x) * (point[0] - center_x)) + ((point[1] - center_y) * (point[1] - center_y)))

    if (mm === true && this.white_to_white_mm !== -1) {
      distance = distance * (this.white_to_white_mm / this.white_to_white_pixels)
    }

    // angle in radians
    var angleRadians = Math.atan2(point[1] - center_y, point[0] - center_x);

    // angle in degrees
    var angleDeg = angleRadians * 180 / Math.PI;
    angleDeg = -1 * angleDeg;
    if (angleDeg < 0) {
      angleDeg = 360 + angleDeg;
    }
    if (line_index !== 0) {
      this.line_layers[layer_key].clear()
      this.lines[line_key].points([center_x, center_y, point[0], point[1]])
      this.lines[line_key].draw()
    }



    return { 'distance': distance.toFixed(3), 'angle': angleDeg.toFixed(3), 'angle2': (360 - angleDeg).toFixed(3) }
  }

  this.calculate_distance_with_curvature = function (euclidean_distance) {
    let sim_k = 'undefined'
    if (this.sim_k1 === 'undefined' && this.sim_k2 === 'undefined') {
      sim_k = 'undefined'
    }
    else if (this.sim_k1 !== 'undefined' && this.sim_k2 !== 'undefined') {
      sim_k = (this.sim_k1 + this.sim_k2) / 2
    }
    else if (this.sim_k1 !== 'undefined' && this.sim_k2 === 'undefined') {
      sim_k = this.sim_k1
    }
    else if (this.sim_k1 === 'undefined' && this.sim_k2 !== 'undefined') {
      sim_k = this.sim_k2
    }

    if (sim_k !== 'undefined') {
      let _val = (euclidean_distance * euclidean_distance) / (2 * sim_k * sim_k)
      _val = 1 - _val
      let angle = Math.acos(_val)
      let _distance = angle * sim_k
      return _distance.toFixed(3)
    }
    else {
      return euclidean_distance
    }
  }

};
