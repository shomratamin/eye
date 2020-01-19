function on_tool_box_button_click() {
  $('.tool-box .button-active').removeClass('btn-selected')
  $(this).addClass('btn-selected')
  let _button_action = $(this).attr('action')
  if (_button_action === 'open-image') {
    $('#image_file_selector').click()
  }

  if(_button_action == 'pointer')
  {
    $('#main-canvas').removeClass();
    $('#main-canvas').addClass('arrow_cursor')
  }
  else
  {
    $('#main-canvas').removeClass();
    $('#main-canvas').addClass('custom_cross_cursor')
  }

  if (_button_action == 'distance_calculation') {
    if (current_line_index == -1) {
      current_line_index = 1
    }
    else {
      current_line_index++
    }

    eye_board.add_line_layer(current_line_index)
    add_line_stat_row(current_line_index)

  }

  if (_button_action == 'white-to-white-marker') {
    let center = eye_board.original_ref_center
    center = eye_board.translate_coordinate(center)
    let x = center[0]
    let y = center[1]
    let line_length = 200
    let points = [x - line_length, y, x + line_length, y]
    first_white_marker = [x - line_length, y]
    second_white_marker = [x + line_length, y]
    eye_board.add_line_layer(0, points)
    eye_board.toggle_dragabble('line', 0, true)
    eye_board.white_tot_white_transform.resizeEnabled(true)
    eye_board.line_layers["distance_line_layer_0"].batchDraw()
  }
  else {
    eye_board.toggle_dragabble('line', 0, false)
    if (eye_board.white_tot_white_transform !== 'undefined') {
      eye_board.white_tot_white_transform.resizeEnabled(false)
      eye_board.line_layers["distance_line_layer_0"].batchDraw()
    }
  }

  if (_button_action == 'draw_circle') {
    eye_board.add_circle_layer()
    eye_board.toggle_dragabble(type = 'circle', index = 0, value = true)
    is_circle_dragging = true
    eye_board.circle_transform.resizeEnabled(true)
    eye_board.circle_layers["circle_layer_0"].batchDraw()
  }
  else {
    if (eye_board.circle_transform !== 'undefined' && eye_board.circle_layers.hasOwnProperty('circle_layer_0')) {
      eye_board.toggle_dragabble(type = 'circle', index = 0, value = false)
      is_circle_dragging = false
      eye_board.circle_transform.resizeEnabled(false)
      eye_board.circle_layers["circle_layer_0"].batchDraw()
    }
  }

  if (_button_action == 'draw_polygon') {
    eye_board.add_polygon_layer()
  }

  if (_button_action == 'clear_canvas') {
    $('#clear_canvas_confirmation_modal').modal()
  }

  states['current_action'] = _button_action;
}

function add_line_stat_row(line_index) {
  let class_index = line_index
  if (class_index > 0) {
    class_index--
  }
  let table_class = table_classes[class_index % table_classes.length]
  let html = `<tr class="${table_class}">
  <th scope="row">Point ${line_index}</th>
  <td> 
      <!-- <i class="fa fa-arrows-h"></i> -->
      <div id="distance_${line_index}">0</div>
  </td>
  <td>
      <div id="angle_${line_index}">0</div>
  </td>
  <td>
      <div id="angle2_${line_index}">0</div>
  </td>
</tr>`

  $('#line_stats tbody').append(html)
}

function clear_results_table() {
  $('#line_stats tbody').html('')
}

function calculate_relative_position(element, mouse_x, mouse_y) {
  let offset = element.offset();
  let x = mouse_x - offset.left;
  let y = mouse_y - offset.top;
  return [x, y];
}

var eye_board = null;
var states = {};
states['current_action'] = 'pointer';


var first_white_marker = [-1, -1];
var second_white_marker = [-1, -1];
var main_canvas = null;
var canvas_tooltip = null;
var current_line_index = -1
var is_circle_dragging = false;
var polygon_area = 0.0
var mouse_start_pos = [-1, -1]


// var table_classes = ['table-primary', 'table-success', 'table-danger', 'table-warning', 'table-info']
var table_classes = ['table_row_odd', 'table_row_even']


$(document).ready(() => {


  eye_board = new EyeBoard();

  $('.tool-box .button-active').bind('click', on_tool_box_button_click)
  $('.tool-box .btn').tooltip({ trigger: 'hover' })

  $body = $("body");

  $(document).on({
    ajaxStart: function () { $body.addClass("loading"); },
    ajaxStop: function () { $body.removeClass("loading"); }
  });


  $('#image_file_selector').change(() => {
    let files = $('#image_file_selector')[0].files
    if (files.length > 0) {
      let form_data = new FormData()
      form_data.append('image', files[0])
      $('#tool-box-controls, #button_white_to_white, #button_draw_circle').css('visibility', 'hidden')
      clear_results_table()
      current_line_index = -1
      $.ajax({
        url: 'upload',
        type: 'post',
        data: form_data,
        contentType: false,
        processData: false,
        success: function (response) {
          if (response != 0) {
            console.log(response)
            if (response.success === true) {
              eye_board.set_orig_width_height(response.width, response.height);
              eye_board.draw_image(response.image);
              eye_board.original_ref_center = response.center;
              eye_board.current_ref_center = response.center;
              // eye_board.draw_pupil_circle()
              eye_board.repaint()
              $('#button_white_to_white').css('visibility', 'visible')
              $('#button_white_to_white').click()
            }
          } else {
            alert('file not uploaded');
          }
        },
      });
    }
  })

  $('#button_modal_done').bind('click', () => {
    let w_w = $('#white_to_white_input').val()
    if (w_w.length > 0) {
      w_w = parseFloat(w_w);
      eye_board.white_to_white_mm = w_w;
      eye_board.toggle_dragabble('line', 0, false)
      eye_board.white_tot_white_transform.resizeEnabled(false)
      eye_board.line_layers["distance_line_layer_0"].batchDraw()
    }
    eye_board.add_circle_layer(0, eye_board.original_ref_center)
    eye_board.toggle_dragabble(type = 'circle', index = 0, value = true)
    is_circle_dragging = true
    states['current_action'] = 'initial_reference_circle'
    $('#button_draw_circle').css('visibility', 'visible')
    $('.tool-box .button-active').removeClass('btn-selected')
    $('#button_draw_circle').addClass('btn-selected')
  })

  $('#button_modal_clear_yes').bind('click', () => {
    eye_board.clear_canvas(false)
    clear_results_table()
    current_line_index = -1
    $('#button_pointer').click()
  })

  main_canvas = $('#main-canvas')
  canvas_tooltip = $("#canvas-tooltip")

  main_canvas.bind('mousemove', (event) => {
    let point_location = calculate_relative_position(main_canvas, event.pageX, event.pageY)
    if (eye_board.current_ref_center[0] !== -1 && eye_board.current_ref_center[1] !== -1 && states['current_action'] === 'distance_calculation') {
      let result = eye_board.calculate_distance(eye_board.current_ref_center, point_location, true, true, true, current_line_index)
      $(`#distance_${current_line_index}`).text(result.distance)
      $(`#angle_${current_line_index}`).text(result.angle)
      $(`#angle2_${current_line_index}`).text(result.angle2)
    }
    else if (states['current_action'] === 'white-to-white-marker') {
      if(eye_board.tooltip_visible === true){
      canvas_tooltip.css({ top: event.pageY - 20, left: event.pageX + 20 });
      canvas_tooltip.attr('data-original-title', 'Move and Resize the line then Press Enter').tooltip('show');
      }
      else
      {
        canvas_tooltip.tooltip('hide')
      }
      // let control = eye_board.get_white_to_white_control(point_location)
      // console.log(control)
      // if(control === false && eye_board.is_white_to_white_dragging === false)
      // {
      //   $('#main-canvas').removeClass('move_cursor resize_cursor');
      //   $('#main-canvas').addClass('custom_cross_cursor')
      // canvas_tooltip.attr('data-original-title', 'Move and Resize the line then Press Enter').tooltip('show');
      // }
      // else if(control === 'left')
      // {
      //   $('#main-canvas').removeClass('custom_cross_cursor move_cursor');
      //   $('#main-canvas').addClass('resize_cursor')
      //   canvas_tooltip.attr('data-original-title', 'Stretch line towards left').tooltip('show');
      //   // eye_board.toggle_dragabble('line', 0, false)
      //   if(mouse_start_pos[0] !== -1 && mouse_start_pos[1] !== -1)
      //   {
      //     let x_distance =  point_location[0] - mouse_start_pos[0]
      //     eye_board.stretch_white_to_white('left', x_distance)
      //     mouse_start_pos = point_location
      //   }
      // }
      // else if(control === 'right')
      // {
      //   $('#main-canvas').removeClass('custom_cross_cursor move_cursor');
      //   $('#main-canvas').addClass('resize_cursor')
      //   canvas_tooltip.attr('data-original-title', 'Stretch line towards right').tooltip('show');
      //   if(mouse_start_pos[0] !== -1 && mouse_start_pos[1] !== -1)
      //   {
      //     let x_distance = point_location[0] - mouse_start_pos[0]
      //     eye_board.stretch_white_to_white('right', x_distance)
      //     mouse_start_pos = point_location
      //   }
      //   // eye_board.toggle_dragabble('line', 0, false)
      // }
      // else if(control === 'drag' || eye_board.is_white_to_white_dragging === true)
      // {
      //   $('#main-canvas').removeClass('custom_cross_cursor resize_cursor');
      //   $('#main-canvas').addClass('move_cursor');
      //   canvas_tooltip.attr('data-original-title', 'Drag the line').tooltip('show');
      //   // eye_board.toggle_dragabble('line', 0, true)
      // }
      // if (first_white_marker[0] === -1) {
      //   canvas_tooltip.attr('data-original-title', 'Place first white point').tooltip('show');
      // }
      // else if (second_white_marker[0] === -1) {
      //   canvas_tooltip.attr('data-original-title', 'Place second white point').tooltip('show')
      //   let forced_point_location = [point_location[0], first_white_marker[1]]
      //   let result = eye_board.calculate_distance(first_white_marker, forced_point_location, false, false, false, 0)
      // }
    }
    else if (states['current_action'] === 'draw_circle') {
      if (eye_board.tooltip_visible === true) {
        canvas_tooltip.css({ top: event.pageY - 20, left: event.pageX + 20 });
        canvas_tooltip.attr('data-original-title', 'Click to draw center of circle').tooltip('show')
      }
      else {
        canvas_tooltip.tooltip('hide')
      }
    }
    else if (states['current_action'] === 'drawing_circle') {
      if (!is_circle_dragging) {
        eye_board.draw_circle(false, point_location)
        // eye_board.change_lines_origin()
        canvas_tooltip.css({ top: event.pageY - 20, left: event.pageX + 20 });
        canvas_tooltip.attr('data-original-title', 'Move pointer to enlarge circle').tooltip('show')
      }
      else {
        canvas_tooltip.css({ top: event.pageY - 20, left: event.pageX + 20 });
        canvas_tooltip.attr('data-original-title', 'Click and hold to move circle').tooltip('show')

      }
    }
    else if (states['current_action'] === 'draw_polygon') {
      canvas_tooltip.css({ top: event.pageY - 20, left: event.pageX + 20 });
      canvas_tooltip.attr('data-original-title', 'Click to place first point').tooltip('show')
    }
    else if (states['current_action'] === 'drawing_polygon') {
      let points_count = eye_board.get_polygon_points_count()
      console.log(points_count)
      if (points_count !== false) {
        if (points_count == 2) {
          canvas_tooltip.css({ top: event.pageY - 20, left: event.pageX + 20 });
          canvas_tooltip.attr('data-original-title', 'Click to place second point').tooltip('show')
        }
        else if (points_count == 4) {
          canvas_tooltip.css({ top: event.pageY - 20, left: event.pageX + 20 });
          canvas_tooltip.attr('data-original-title', 'Click to place third point').tooltip('show')
        }
        else if (points_count > 4) {
          canvas_tooltip.css({ top: event.pageY - 20, left: event.pageX + 20 });
          canvas_tooltip.attr('data-original-title', `Area: ${polygon_area} mm2`).tooltip('show')
        }
      }
    }
    else if (states['current_action'] === 'initial_reference_circle') {
      if(eye_board.tooltip_visible === true){
      canvas_tooltip.css({ top: event.pageY - 20, left: event.pageX + 20 });
      canvas_tooltip.attr('data-original-title', 'Move and Resize the reference circle then Press Enter').tooltip('show');
      }
      else
      {
        canvas_tooltip.tooltip('hide');
      }
    }
  })

  main_canvas.bind('click', (event) => {
    let point_location = calculate_relative_position(main_canvas, event.pageX, event.pageY)
    if (states['current_action'] === 'distance_calculation') {
      eye_board.change_line_opacity(current_line_index, 0.5)
      eye_board.add_line_index_text(point_location, current_line_index, current_line_index)
      // states['current_action'] = 'pointer'
      // $('#button_pointer').click()
      $('#button_distance').click()
    }
    else if (states['current_action'] === 'white-to-white-marker') {
      // if (first_white_marker[0] === -1) {
      //   first_white_marker = point_location
      // }
      // else if (second_white_marker[0] === -1) {
      //   let forced_point_location = [point_location[0], first_white_marker[1]]
      //   second_white_marker = forced_point_location;
      //   let result = eye_board.calculate_distance(first_white_marker, second_white_marker, false, false, false, 0)
      //   eye_board.white_to_white_pixels = result.distance;
      //   first_white_marker = [-1, -1];
      //   second_white_marker = [-1, -1];
      //   $('#information_modal').modal()
      //   eye_board.clear_line_layer(0)
      // }

    }
    else if (states['current_action'] === 'draw_circle') {
      if (!is_circle_dragging) {
        eye_board.draw_circle(point_location, point_location)
        states['current_action'] = 'drawing_circle'
        canvas_tooltip.css({ top: event.pageY - 20, left: event.pageX + 20 });
        canvas_tooltip.attr('data-original-title', 'Move pointer to draw circle').tooltip('show')
      }
    }
    else if (states['current_action'] === 'drawing_circle') {
      if (!is_circle_dragging) {
        eye_board.draw_circle(false, point_location)
        states['current_action'] = 'draw_circle'
      }
    }
    else if (states['current_action'] === 'draw_polygon') {
      polygon_area = eye_board.calculate_area(point_location, true, true)
      states['current_action'] = 'drawing_polygon'
      canvas_tooltip.css({ top: event.pageY - 20, left: event.pageX + 20 });
      canvas_tooltip.attr('data-original-title', 'Move pointer to next location').tooltip('show')
    }
    else if (states['current_action'] === 'drawing_polygon') {
      if (eye_board.can_update_poly === true) {
        polygon_area = eye_board.calculate_area(point_location, true)
        let points_count = eye_board.get_polygon_points_count()
        if (points_count !== false) {
          if (points_count > 2) {
            canvas_tooltip.css({ top: event.pageY - 20, left: event.pageX + 20 });
            canvas_tooltip.attr('data-original-title', 'Move pointer to next location').tooltip('show')
          }
        }
      }
    }

  })

  // main_canvas.bind('mousedown', (event) => {
  //   if (states['current_action'] === 'white-to-white-marker')
  //   {
  //     let point_location = calculate_relative_position(main_canvas, event.pageX, event.pageY)
  //     mouse_start_pos = point_location
  //   }
  // })

  // main_canvas.bind('mouseup', (event) => {
  // if (states['current_action'] === 'white-to-white-marker')
  // {
  //   mouse_start_pos = [-1, -1]
  // }
  // })


  main_canvas.bind('mouseleave', (event) => {
    canvas_tooltip.tooltip('hide')
  })

  $(document).keypress(function (event) {
    let key = (event.keyCode ? event.keyCode : event.which);
    if (key == 13) {
      if (states['current_action'] === 'distance_calculation') {
        eye_board.change_line_opacity(current_line_index, 0.5)
        eye_board.add_line_index_text(false, current_line_index, current_line_index)
        states['current_action'] = 'pointer'
        $('#button_pointer').click()
      }
      else if (states['current_action'] === 'white-to-white-marker') {
        let result = eye_board.calculate_distance(first_white_marker, second_white_marker, false, false, false, 0)
        eye_board.white_to_white_pixels = result.distance;
        $('#information_modal').modal()
        // eye_board.clear_line_layer(0)
      }
      else if (states['current_action'] === 'initial_reference_circle') {
        $('#tool-box-controls, #button_white_to_white, #button_draw_circle').css('visibility', 'visible')
        eye_board.circle_transform.resizeEnabled(false)
        eye_board.circle_layers["circle_layer_0"].batchDraw()
        $('#button_distance').click()
      }
      return false;
    }
  });

  // $.contextMenu({
  //   selector: '#main-canvas',
  //   items: {
  //     change_ref_point: {
  //       name: "Change Point Reference",
  //       visible: function (key, opt) {
  //         if (states['current_action'] === 'draw_circle') {
  //           return true;
  //         }
  //         else {
  //           return true;
  //         }
  //       },
  //       callback: function (key, opt) {
  //         eye_board.change_lines_origin()
  //       }
  //     },
  //     drag_n_drop: {
  //       name: "Add/Remove Circle Draggability",
  //       visible: function (key, opt) {
  //         if (states['current_action'] === 'draw_circle') {
  //           return true;
  //         }
  //         else {
  //           return true;
  //         }
  //       },
  //       callback: function (key, opt) {
  //         eye_board.toggle_dragabble(type='circle', index=0)
  //         is_circle_dragging = !is_circle_dragging
  //       }
  //     }
  //   }
  // });

})