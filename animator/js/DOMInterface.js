// import 'Assert'
// import 'DOMInterfaceTable'
// import 'DOMInterfaceTableKeyframeRow'
// import 'DOMInterfaceTablePolygonRow'
// import 'Events'
// import 'Previewer'
// import 'jquery'

/**
 * Sets up and controls the DOM user interface.
 */
class DOMInterface {
  constructor(frameModel) {
    assertParameters(arguments, FrameModel);

    this._frameModel = frameModel;

    this._table = new DOMInterfaceTable(frameModel);

    // Stores the current preview controller.
    this._previewer = null;

    $(() => {
      this._activateButtons();

      this._table.activate();

      Events.dispatch(DOMInterface.EVENT_TYPES.READY);
    });

    Events.on(DOMInterfaceTablePolygonRow.EVENT_TYPES.ACTIVATE,
        this._polygonSelected, this);
    Events.on(DOMInterfaceTableKeyframeRow.EVENT_TYPES.DEACTIVATE_ALL,
        this._polygonDeselected, this);

    Events.on(Previewer.EVENT_TYPES.STOP, this._previewStopped, this);
  }

  static get BUTTON_ADD_POLYGON() {
    return $('#but-add-polygon');
  }

  static get BUTTON_REMOVE_POLYGON() {
    return $('#but-remove-polygon');
  }

  static get BUTTON_PREVIEW() {
    return $('#but-preview');
  }

  static get BUTTON_GENERATE_QRCODE() {
    return $('#but-generate-qrcode');
  }

  static get QRCODE() {
    return $('#qrcode');
  }

  static get BACKGROUND_IMAGE_CHOOSER() {
    return $('#backimage');
  }

  static get BACKGROUND_IMAGE_CHOOSER_LABEL() {
    return $('#choosebackimglabel');
  }

  static get BACKGROUND_IMAGE_CHOOSER_BUTTON() {
    return $('#choosebackimg');
  }

  _activateButtons() {
    assertParameters(arguments);

    DOMInterface.BUTTON_ADD_POLYGON.click(() => {
      this._frameModel.addPolygon();
    });

    DOMInterface.BUTTON_REMOVE_POLYGON.click(() => {
      this._frameModel.removePolygon(this._table.currentPolygon);

      DOMInterface.BUTTON_REMOVE_POLYGON.addClass('')
    });

    DOMInterface.BUTTON_PREVIEW.click(() => {
      const isStop = DOMInterface.BUTTON_PREVIEW.hasClass('stop');

      if (this._previewer !== null) this._previewer.stop();

      if (isStop) {
        this._previewStopped();
      } else {
        this._previewer = (new Previewer(this._frameModel)).start();

        DOMInterface.BUTTON_PREVIEW.html('Stop').addClass('stop');
      }
    });

    DOMInterface.BUTTON_GENERATE_QRCODE.click(() => {
      const bits = (new AnimationEncoder(this._frameModel)).encode();
      const encoded = AnimationEncoder.bitsToString(bits);
      console.log(encoded.length);
      console.log(btoa(encoded));
      console.log(bits.bits.join(''));

      DOMInterface.QRCODE.html('').qrcode({
        width: 128,
        height: 128,
        text: btoa(encoded)
      });

      // var qrcode = new QRCode(DOMInterface.QRCODE[0], {
      //   text: encoded,
      //   width: 128,
      //   height: 128,
      //   colorDark : '#000000',
      //   colorLight : '#ffffff',
      //   correctLevel : QRCode.CorrectLevel.L
      // });
    });

    DOMInterface.BACKGROUND_IMAGE_CHOOSER.change(function() {
      const choosebackimglabelHTML =
          DOMInterface.BACKGROUND_IMAGE_CHOOSER_LABEL.html();
      DOMInterface.BACKGROUND_IMAGE_CHOOSER_LABEL.html(
          DOMInterface.BACKGROUND_IMAGE_CHOOSER_LABEL_LOADING);
      DOMInterface.BACKGROUND_IMAGE_CHOOSER_BUTTON.addClass('disabled');
      DOMInterface.BACKGROUND_IMAGE_CHOOSER.attr('disabled', 'disabled');

      var img = new Image();
      img.onload = function() {
        Events.dispatch(DOMInterface.EVENT_TYPES.SELECT_IMAGE, img);

        setTimeout(function() {
          DOMInterface.BACKGROUND_IMAGE_CHOOSER_LABEL.html(
            choosebackimglabelHTML);
          DOMInterface.BACKGROUND_IMAGE_CHOOSER_BUTTON.removeClass('disabled');
          DOMInterface.BACKGROUND_IMAGE_CHOOSER.removeAttr('disabled');
        }, 500);
      }
      img.src = URL.createObjectURL(this.files[0]);
    });
  }

  _previewStopped() {
    DOMInterface.BUTTON_PREVIEW.html('Preview').removeClass('stop');
  }

  _polygonSelected(polygonId) {
    assertParameters(arguments, Number);

    DOMInterface.BUTTON_REMOVE_POLYGON.removeAttr('disabled');
  }

  _polygonDeselected() {
    assertParameters(arguments);

    DOMInterface.BUTTON_REMOVE_POLYGON.attr('disabled', 'disabled');
  }
};

DOMInterface.BACKGROUND_IMAGE_CHOOSER_LABEL_LOADING = `Loading...`;

DOMInterface.EVENT_TYPES = {
  ADD_POLYGON: 'dominterface-add-polygon',
  READY: 'dominterface-ready',
  SELECT_IMAGE: 'dominterface-select-image'
};
