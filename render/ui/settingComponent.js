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
var React = require("react");
var ReactBootstrap = require("react-bootstrap");
var Form = ReactBootstrap.Form;
var FormGroup = ReactBootstrap.FormGroup;
var Navbar = ReactBootstrap.Navbar;
var Button = ReactBootstrap.Button;
var FormControl = ReactBootstrap.FormControl;
var electron = require("electron");
var dialog = electron.remote.dialog;
exports.settingComponent = function (rtmp) {
    return (function (_super) {
        __extends(SettingComponent, _super);
        function SettingComponent() {
            var _this = _super.call(this) || this;
            _this.state = { sending: false };
            _this._toggleSave = _this._toggleSave.bind(_this);
            _this._openSetting = _this._openSetting.bind(_this);
            return _this;
        }
        SettingComponent.prototype._toggleSave = function () {
            // 本体に通信して、動作開始をトリガーしなければならない。
            if (!this.state.sending) {
                if (!rtmp._publish()) {
                    return;
                }
            }
            else {
                rtmp._stop();
            }
            this.setState({ sending: !this.state.sending });
        };
        SettingComponent.prototype._openSetting = function () {
            rtmp._openSetting();
        };
        SettingComponent.prototype.render = function () {
            return (React.createElement("div", null,
                React.createElement(Navbar.Text, null,
                    React.createElement(Button, { onClick: this._openSetting },
                        React.createElement("span", { className: "glyphicon glyphicon-cog", "aria-hidden": "true" })),
                    React.createElement(Button, { active: this.state.sending == true, onClick: this._toggleSave },
                        React.createElement("span", { className: "glyphicon glyphicon-send", "aria-hidden": "true" }))),
                React.createElement(Navbar.Text, null, "rtmp://rtmptest.com/live test")));
        };
        return SettingComponent;
    }(React.Component));
};
