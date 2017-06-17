"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// 設定ダイアログ
var React = require("react");
var ReactDOM = require("react-dom");
var ReactBootstrap = require("react-bootstrap");
var Modal = ReactBootstrap.Modal;
var Button = ReactBootstrap.Button;
var Form = ReactBootstrap.Form;
var FormGroup = ReactBootstrap.FormGroup;
var FormControl = ReactBootstrap.FormControl;
var ControlLabel = ReactBootstrap.ControlLabel;
var Panel = ReactBootstrap.Panel;
var Col = ReactBootstrap.Col;
var Checkbox = ReactBootstrap.Checkbox;
// これちょっと調整しないとね・・・ややこしい感じになってる。
exports.setting = function (rtmp) {
    var codecsInfo = rtmp._refCodecsInfo();
    var targetInfo = rtmp._refTargetInfo();
    /*
    codecsInfo.audio.forEach((codec) => {
      var audio = targetInfo.audio;
      if(audio == null) {
        return;
      }
      if(codec.name == audio.name
      && codec.codec == audio.codec) {
        // これが見つけるべきやつ。
        Object.keys(codec).forEach((key) => {
          if(codec[key]["type"] != undefined) {
            codec[key]["value"] = audio[key];
          }
        });
      }
    });
    */
    // ここでやればいいか・・・
    var CodecSetting = (function (_super) {
        __extends(CodecSetting, _super);
        function CodecSetting() {
            var _this = _super.call(this) || this;
            _this.state = { codec: 0 };
            _this._changeCodec = _this._changeCodec.bind(_this);
            _this.targetComponents = [];
            return _this;
        }
        CodecSetting.prototype._changeCodec = function (item) {
            this.setState({ codec: item.target.value });
        };
        CodecSetting.prototype.componentDidMount = function () {
            var _this = this;
            var i = 0;
            this.props.codecList.forEach(function (codec) {
                if (_this.props.codec != null
                    && codec.name == _this.props.codec.name
                    && codec.codec == _this.props.codec.codec) {
                    _this._updateData(codec, _this.props.codec);
                    _this.setState({ codec: i });
                }
                ++i;
            });
        };
        CodecSetting.prototype._updateData = function (codec, target) {
            var _this = this;
            var setData = function (target, ref, value) {
                switch (target) {
                    case "checkbox":
                        return ReactDOM.findDOMNode(ref).getElementsByTagName("input")[0].checked = value;
                    case "select":
                        var r = ReactDOM.findDOMNode(ref);
                        return r.children[r.value].innerText = value;
                    default:
                        return ReactDOM.findDOMNode(ref).value = value;
                }
            };
            Object.keys(codec).forEach(function (key) {
                if (codec[key]["type"] != undefined) {
                    setData(codec[key]["type"], _this.refs[key], target[key]);
                }
            });
        };
        CodecSetting.prototype.getData = function () {
            var _this = this;
            var getData = function (target, ref) {
                switch (target) {
                    case "checkbox":
                        return ReactDOM.findDOMNode(ref).getElementsByTagName("input")[0].checked;
                    case "select":
                        var r = ReactDOM.findDOMNode(ref);
                        return r.children[r.value].innerText;
                    default:
                        return ReactDOM.findDOMNode(ref).value;
                }
            };
            if (this.props.codecList.length == 0) {
                return null;
            }
            var codec = {};
            var targetCodec = this.props.codecList[this.state.codec];
            Object.keys(targetCodec).forEach(function (key) {
                if (targetCodec[key]["type"] != undefined) {
                    // これが処理すべきもの
                    codec[key] = getData(targetCodec[key]["type"], _this.refs[key]);
                }
                else {
                    codec[key] = targetCodec[key];
                }
            });
            return codec;
        };
        CodecSetting.prototype.render = function () {
            var _this = this;
            return (React.createElement(FormGroup, null,
                (function () {
                    // 適当な場所であらかじめ表示に利用するデータの抽出を実施しておく。
                    // 本当はカッコ悪いから、関数で実行したいけど
                    // 初期化時のイベントの走らせ方がよくわからないので、とりあえず
                    // タイトルのところに乗せておく
                    var codec = _this.props.codecList[_this.state.codec];
                    if (codec) {
                        _this.targetComponents = [];
                        Object.keys(codec).forEach(function (key) {
                            if (codec[key]["type"] != undefined) {
                                _this.targetComponents.push({ key: key, value: codec[key] });
                            }
                        });
                    }
                    return React.createElement(ControlLabel, null, _this.props.title);
                })(),
                React.createElement(FormControl, { componentClass: "select", onChange: this._changeCodec }, this.props.codecList.map(function (val, i) {
                    if (i == _this.state.codec) {
                        return React.createElement("option", { value: i, key: i, selected: true }, val.name);
                    }
                    else {
                        return React.createElement("option", { value: i, key: i }, val.name);
                    }
                })),
                React.createElement(Col, { smOffset: 1 }, /* あとは要素に従って表示していけばOKだが・・・ */ this.targetComponents.map(function (val, i) {
                    console.log(val);
                    switch (val.value.type) {
                        case "checkbox":
                            return (React.createElement(Checkbox, { defaultChecked: val.value.value, ref: val.key }, val.key));
                        case "select":
                            return (React.createElement("div", null,
                                React.createElement(ControlLabel, null, val.key),
                                React.createElement(FormControl, { componentClass: "select", placeholder: "select", ref: val.key }, val.value.values.map(function (item, i) {
                                    if (item == val.value.value) {
                                        return React.createElement("option", { value: i, key: i, selected: true }, item);
                                    }
                                    else {
                                        return React.createElement("option", { value: i, key: i }, item);
                                    }
                                }))));
                        case "textarea":
                            return (React.createElement("div", null,
                                React.createElement(ControlLabel, null, val.key),
                                React.createElement(FormControl, { componentClass: "textarea", placeholder: val.key, defaultValue: val.value.value, ref: val.key })));
                        default:
                            return (React.createElement("div", null,
                                React.createElement(ControlLabel, null, val.key),
                                React.createElement(FormControl, { type: val.value.type, placeholder: val.codec + val.key, defaultValue: val.value.value, ref: val.key })));
                    }
                }))));
        };
        return CodecSetting;
    }(React.Component));
    // あとはこのtargetInfoからaudioCodecとvideoCodecの情報も復元可能にすれば、OK
    var Setting = (function (_super) {
        __extends(Setting, _super);
        function Setting() {
            var _this = _super.call(this) || this;
            _this.state = { showDialog: true };
            _this._close = _this._close.bind(_this);
            _this._confirm = _this._confirm.bind(_this);
            return _this;
        }
        Setting.prototype._close = function () {
            this.setState({ showDialog: false });
        };
        Setting.prototype._confirm = function () {
            var address = ReactDOM.findDOMNode(this.refs.address).value;
            var streamName = ReactDOM.findDOMNode(this.refs.streamName).value;
            if (!address || !streamName) {
                alert("接続サーバーが不明です");
                return;
            }
            rtmp._setInfo({
                address: address,
                streamName: streamName,
                audio: this.refs.audioCodec.getData(),
                video: this.refs.videoCodec.getData()
            });
            this.setState({ showDialog: false });
        };
        Setting.prototype.render = function () {
            return (React.createElement(Modal, { show: this.state.showDialog, onHide: this._close },
                React.createElement(Modal.Header, { closeButton: true },
                    React.createElement(Modal.Title, null, "RtmpSetting")),
                React.createElement(Modal.Body, null,
                    React.createElement(Form, null,
                        React.createElement(FormGroup, null,
                            React.createElement(FormControl, { type: "text", placeholder: "address (rtmp://someRtmpServer.com/live)", ref: "address", defaultValue: targetInfo.address }),
                            React.createElement(FormControl, { type: "text", placeholder: "stream name (stream)", ref: "streamName", defaultValue: targetInfo.streamName })),
                        React.createElement(CodecSetting, { ref: "videoCodec", title: "Video Codec", codecList: codecsInfo.video, codec: targetInfo.video }),
                        React.createElement(CodecSetting, { ref: "audioCodec", title: "Audio Codec", codecList: codecsInfo.audio, codec: targetInfo.audio }))),
                React.createElement(Modal.Footer, null,
                    React.createElement(Button, { onClick: this._confirm },
                        React.createElement("span", { className: "glyphicon glyphicon-wrench", "aria-hidden": "true" })))));
        };
        return Setting;
    }(React.Component));
    ReactDOM.render(React.createElement(Setting, null), document.getElementById("dialog"));
};
