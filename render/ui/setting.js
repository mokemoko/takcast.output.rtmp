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
exports.setting = function (rtmp) {
    var codecsInfo = rtmp._refCodecsInfo();
    var Setting = (function (_super) {
        __extends(Setting, _super);
        function Setting() {
            var _this = _super.call(this) || this;
            _this.state = {
                showDialog: true,
                audioCodec: 0,
                videoCodec: 0
            };
            _this._close = _this._close.bind(_this);
            _this._confirm = _this._confirm.bind(_this);
            _this._changeAudioCodec = _this._changeAudioCodec.bind(_this);
            _this._changeVideoCodec = _this._changeVideoCodec.bind(_this);
            return _this;
        }
        Setting.prototype._close = function () {
            this.setState({ showDialog: false });
        };
        Setting.prototype._confirm = function () {
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
            // 取れてる
            if (!getData("", this.refs.address)
                || !getData("", this.refs.streamName)) {
                alert("接続サーバーが不明です");
                return;
            }
            // videoCodecを取得してみる。
            var videoCodec = {};
            var targetCodec = codecsInfo.video[this.state.videoCodec];
            Object.keys(targetCodec).forEach(function (key) {
                if (targetCodec[key]["type"] != undefined) {
                    // これが処理すべきもの
                    videoCodec[key] = getData(targetCodec[key]["type"], _this.refs["video_" + key]);
                }
                else {
                    videoCodec[key] = targetCodec[key];
                }
            });
            var audioCodec = {};
            targetCodec = codecsInfo.audio[this.state.audioCodec];
            Object.keys(targetCodec).forEach(function (key) {
                if (targetCodec[key]["type"] != undefined) {
                    audioCodec[key] = getData(targetCodec[key]["type"], _this.refs["audio_" + key]);
                }
                else {
                    audioCodec[key] = targetCodec[key];
                }
            });
            rtmp._setInfo({
                address: getData("", this.refs.address),
                streamName: getData("", this.refs.streamName),
                audio: audioCodec,
                video: videoCodec
            });
            this.setState({ showDialog: false });
        };
        Setting.prototype._changeAudioCodec = function (item) {
            // このタイミングでもaudioCodecの内容を更新しなければならないか・・・
            this.setState({ audioCodec: item.target.value });
        };
        Setting.prototype._changeVideoCodec = function (item) {
            // こっちもこのタイミングでvideoCodecの内容を更新しなければならないか・・・
            this.setState({ videoCodec: item.target.value });
        };
        Setting.prototype.render = function () {
            var _this = this;
            /*
            動作としては
            アドレス設定
            stream名設定
            h264 encoder設定
            aac encoder設定
            このあたりが必要になる。
            閉じたら動作開始みたいな感じで
                  <FormControl type="text" placeholder="rtmp server"/>
            */
            return (React.createElement(Modal, { show: this.state.showDialog, onHide: this._close },
                React.createElement(Modal.Header, { closeButton: true },
                    React.createElement(Modal.Title, null, "RtmpSetting")),
                React.createElement(Modal.Body, null,
                    React.createElement(Form, null,
                        React.createElement(FormGroup, { controlId: "formControlsSelect" },
                            React.createElement(FormControl, { type: "text", placeholder: "address (rtmp://someRtmpServer.com/live)", ref: "address" }),
                            React.createElement(FormControl, { type: "text", placeholder: "stream name (stream)", ref: "streamName" })),
                        React.createElement(FormGroup, { controlId: "formControlsSelect" },
                            React.createElement(ControlLabel, null, "Video Codec"),
                            React.createElement(FormControl, { componentClass: "select", placeholder: "select", onChange: this._changeVideoCodec }, codecsInfo.video.map(function (val, i) {
                                if (i == _this.state.videoCodec) {
                                    return React.createElement("option", { value: i, key: i, selected: true }, val.name);
                                }
                                else {
                                    return React.createElement("option", { value: i, key: i }, val.name);
                                }
                            })),
                            React.createElement(Col, { smOffset: 1 }, (function () {
                                var codec = codecsInfo.video[_this.state.videoCodec];
                                var components = [];
                                Object.keys(codec).forEach(function (key) {
                                    if (codec[key]["type"] != undefined) {
                                        components.push({ key: key, value: codec[key] });
                                    }
                                });
                                return (React.createElement("div", null, components.map(function (val, i) {
                                    switch (val.value.type) {
                                        case "checkbox":
                                            return (React.createElement(Checkbox, { defaultChecked: val.value.value, ref: "video_" + val.key }, val.key));
                                        case "select":
                                            return (React.createElement("div", null,
                                                React.createElement(ControlLabel, null, val.key),
                                                React.createElement(FormControl, { componentClass: "select", placeholder: "select", ref: "video_" + val.key }, val.value.values.map(function (item, i) {
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
                                                React.createElement(FormControl, { componentClass: "textarea", placeholder: val.key, defaultValue: val.value.value, ref: "video_" + val.key })));
                                        default:
                                            return (React.createElement("div", null,
                                                React.createElement(ControlLabel, null, val.key),
                                                React.createElement(FormControl, { type: val.value.type, defaultValue: val.value.value, placeholder: val.key, ref: "video_" + val.key })));
                                    }
                                })));
                            })())),
                        React.createElement(FormGroup, { controlId: "formControlsSelect" },
                            React.createElement(ControlLabel, null, "Audio Codec"),
                            React.createElement(FormControl, { componentClass: "select", placeholder: "select", onChange: this._changeAudioCodec }, codecsInfo.audio.map(function (val, i) {
                                if (i == _this.state.audioCodec) {
                                    return React.createElement("option", { value: i, key: i, selected: true }, val.name);
                                }
                                else {
                                    return React.createElement("option", { value: i, key: i }, val.name);
                                }
                            })),
                            React.createElement(Col, { smOffset: 1 }, (function () {
                                var codec = codecsInfo.audio[_this.state.audioCodec];
                                var components = [];
                                Object.keys(codec).forEach(function (key) {
                                    if (codec[key]["type"] != undefined) {
                                        components.push({ key: key, value: codec[key] });
                                    }
                                });
                                return (React.createElement("div", null, components.map(function (val, i) {
                                    switch (val.value.type) {
                                        case "checkbox":
                                            return (React.createElement(Checkbox, { defaultChecked: val.value.value, ref: "audio_" + val.key }, val.key));
                                        case "select":
                                            return (React.createElement("div", null,
                                                React.createElement(ControlLabel, null, val.key),
                                                React.createElement(FormControl, { componentClass: "select", placeholder: "select", ref: "audio_" + val.key }, val.value.values.map(function (item, i) {
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
                                                React.createElement(FormControl, { componentClass: "textarea", placeholder: val.key, defaultValue: val.value.value, ref: "audio_" + val.key })));
                                        default:
                                            return (React.createElement("div", null,
                                                React.createElement(ControlLabel, null, val.key),
                                                React.createElement(FormControl, { type: val.value.type, defaultValue: val.value.value, placeholder: val.key, ref: "audio_" + val.key })));
                                    }
                                })));
                            })())))),
                React.createElement(Modal.Footer, null,
                    React.createElement(Button, { onClick: this._confirm },
                        React.createElement("span", { className: "glyphicon glyphicon-wrench", "aria-hidden": "true" })))));
        };
        return Setting;
    }(React.Component));
    ReactDOM.render(React.createElement(Setting, null), document.getElementById("dialog"));
};
