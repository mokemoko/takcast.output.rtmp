/// <reference types="react" />
import * as React from "react";
import { IPlugin } from "takcast.interface";
import { IOutputPlugin } from "takcast.interface";
import { IMediaPlugin } from "takcast.interface";
export interface RtmpEventListener {
    onUpdate(info: {
        address: string;
        streamName: string;
        audio: any;
        video: any;
    }): any;
    onStop(): any;
}
export declare class Rtmp implements IOutputPlugin {
    name: string;
    type: string;
    private activeMedia;
    private targetMedia;
    private basePlugin;
    private codecsInfo;
    private targetInfo;
    private pts;
    private timerId;
    private scriptNode;
    private eventTarget;
    /**
     * コンストラクタ
     */
    constructor();
    _setEventTarget(eventTarget: RtmpEventListener): void;
    /**
     * プラグイン初期化
     */
    setPlugins(plugins: {
        [key: string]: Array<IPlugin>;
    }): void;
    /**
     * 下部の設定コンポーネントを参照
     */
    refSettingComponent(): React.ComponentClass<{}>;
    /**
     * node側からもらった利用可能なコーデック情報を参照する
     */
    _refCodecsInfo(): {
        audio: any[];
        video: any[];
    };
    _refTargetInfo(): {
        address: string;
        streamName: string;
        audio: any;
        video: any;
    };
    /**
     * 設定ダイアログを開く
     * rtmpアドレスやコーデック設定等が実施できる
     */
    _openSetting(): void;
    /**
     * 配信設定をセットする
     * 設定ダイアログの結果を保存する
     * @param info
     */
    _setInfo(info: {
        address: string;
        streamName: string;
        audio: any;
        video: any;
    }): void;
    /**
     * 有効になっているmediaPluginが変更になったときの動作
     */
    onChangeActiveMedia(media: IMediaPlugin): void;
    /**
     * mediaPluginが撤去されたときの動作
     * @param media
     */
    onRemoveMedia(media: IMediaPlugin): void;
    /**
     * 配信実行
     */
    _publish(): boolean;
    _stop(): void;
}
export declare var _: Rtmp;
