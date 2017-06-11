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
    var CodecSetting = (function (_super) {
        __extends(CodecSetting, _super);
        function CodecSetting() {
            var _this = _super.call(this) || this;
            _this.state = {
                codec: 0
            };
            _this._changeCodec = _this._changeCodec.bind(_this);
            _this.targetComponents = [];
            return _this;
        }
        CodecSetting.prototype._changeCodec = function (item) {
            this.setState({ codec: item.target.value });
        };
        CodecSetting.prototype._getData = function () {
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
            var codec = {};
            var targetCodec = this.props.targetCodecs[this.state.codec];
            Object.keys(targetCodec).forEach(function (key) {
                if (targetCodec[key]["type"] != undefined) {
                    // これが処理すべきもの
                    codec[key] = getData(targetCodec[key]["type"], _this.refs[key]);
                }
                else {
                    codec[key] = targetCodec[key];
                }
            });
            console.log(codec);
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
                    var codec = _this.props.targetCodecs[_this.state.codec];
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
                React.createElement(FormControl, { componentClass: "select", onChange: this._changeCodec }, this.props.targetCodecs.map(function (val, i) {
                    if (i == _this.state.codec) {
                        return React.createElement("option", { value: i, key: i, selected: true }, val.name);
                    }
                    else {
                        return React.createElement("option", { value: i, key: i }, val.name);
                    }
                })),
                React.createElement(Col, { smOffset: 1 }, this.targetComponents.map(function (val, i) {
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
                                React.createElement(FormControl, { type: val.value.type, defaultValue: val.value.value, placeholder: val.key, ref: val.key })));
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
            var address = ReactDOM.findDOMNode(this.refs.address).value;
            var streamName = ReactDOM.findDOMNode(this.refs.streamName).value;
            if (!address || !streamName) {
                alert("接続サーバーが不明です");
                return;
            }
            // videoCodecの内容を取得するわけだが・・・
            // callしたら必要な情報を返してくる・・・ってのでいいか・・・
            // videoCodecを取得してみる。
            rtmp._setInfo({
                address: address,
                streamName: streamName,
                audio: this.refs.audioCodec._getData(),
                video: this.refs.videoCodec._getData()
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
            return (React.createElement(Modal, { show: this.state.showDialog, onHide: this._close },
                React.createElement(Modal.Header, { closeButton: true },
                    React.createElement(Modal.Title, null, "RtmpSetting")),
                React.createElement(Modal.Body, null,
                    React.createElement(Form, null,
                        React.createElement(FormGroup, null,
                            React.createElement(FormControl, { type: "text", placeholder: "address (rtmp://someRtmpServer.com/live)", ref: "address", defaultValue: targetInfo.address }),
                            React.createElement(FormControl, { type: "text", placeholder: "stream name (stream)", ref: "streamName", defaultValue: targetInfo.streamName })),
                        React.createElement(CodecSetting, { ref: "videoCodec", title: "Video Codec", targetCodecs: codecsInfo.video }),
                        React.createElement(CodecSetting, { ref: "audioCodec", title: "Audio Codec", targetCodecs: codecsInfo.audio }))),
                React.createElement(Modal.Footer, null,
                    React.createElement(Button, { onClick: this._confirm },
                        React.createElement("span", { className: "glyphicon glyphicon-wrench", "aria-hidden": "true" })))));
        };
        return Setting;
    }(React.Component));
    ReactDOM.render(React.createElement(Setting, null), document.getElementById("dialog"));
};
