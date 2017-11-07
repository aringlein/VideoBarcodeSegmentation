// import 'Assert'
// import 'Canvas'
// import 'Coordinate'

class Instructions {
  static draw(canvas, text) {
    assertParameters(arguments, Canvas, String);

    const textLines = text.split('\n');
    for (let i = 0; i < textLines.length; i ++) {
      Instructions._drawLine(canvas, textLines[i], i);
    }
  }

  static _drawLine(canvas, text, line) {
    const size = Math.min(canvas.width, canvas.height);
    const x = size * Instructions._X_PERCENT;
    const y = size * Instructions._Y_PERCENT + line * Instructions._FONT_SIZE;
    const coord = new Coordinate(x, y);

    canvas.drawText(coord, text, 'left', Instructions._FONT);
  }
};

Instructions._X_PERCENT = 0.1;
Instructions._Y_PERCENT = 0.1;
Instructions._FONT_SIZE = 16;
Instructions._FONT = Instructions._FONT_SIZE + 'px Ubuntu Mono';
